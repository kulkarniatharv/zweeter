const db = require('../db_connection');

// FIXME:  
// * 

module.exports = {
  
  // query

  userTweets: async (args, req) => {
    if(!req.isAuth) {
      throw new Error(req.errorName.UNAUTHORIZED)
    }

    const checkUser_query = {
      sql: 'SELECT id, CONCAT(users.firstname, " ", users.lastname) AS "author_name", username FROM `users` WHERE `username` = ?',
      values: [args.username]
    };

    let userDetails;

    try {
      userDetails = await db.query(checkUser_query);

      console.log("userDetails", userDetails);
    } catch (err_1) {
      console.log(err_1);
      throw err_1;
    }

    try {
      const getUserTweets_query = {
        sql: 'SELECT * FROM tweets WHERE author=?',
        values: [userDetails[0].id],
      };

      const userTweets = await db.query(getUserTweets_query);

      console.log("userTweets", userTweets);

      return {
        tweets: userTweets,
        author_name: userDetails[0].author_name,
        author_username: userDetails[0].username,
      }
    } catch (err_1) {
      console.log(err_1);
      throw err_1;
    }
  },
  
  // mutation
  postTweet: async (args, req) => {
    if(!req.isAuth) {
      throw new Error(req.errorName.UNAUTHORIZED)
    }

    const tweet_query = {
      sql: `INSERT INTO tweets (tweet, author) VALUES (?, ?)`,
      values: [args.userInput.tweet, req.userId]
    };

    try {
      const res = await db.query(tweet_query);

      const getTweetQuery = {
        sql: `SELECT * FROM tweets where id=?`,
        values: [res.insertId]
      };

      const tweet = await db.query(getTweetQuery);
      console.log(tweet);
      
      const sp_userfeed_query = {
        sql: `CALL populate_userfeeds(${res.insertId}, ${req.userId}, False)`,
      };
      
      const sp_res = await db.query(sp_userfeed_query);
      console.log(res);
      console.log("sp_res",sp_res)
      return "tweet posted";
    } catch (err_1) {
      console.log(err_1);
      throw err_1;
    }
  },

  postReply: async (args, req) => {
    if(!req.isAuth) {
      throw new Error(req.errorName.UNAUTHORIZED)
    }

    return new Promise((resolve, reject) => {
      db.db.beginTransaction((err) => {
        if (err) {reject(err);}

        let replyQuery = {
          sql: `INSERT INTO tweet_replies (reply, author, parent_id) VALUES (?,?,?)`,
          values: [args.reply, req.userId, args.parentId]
        }
        
        db.transaction_query(replyQuery)
        .then(result => {
          const updateReplyCount_query = {
            sql: `INSERT INTO tweet_replies_count (parent_id, reply_count) VALUES (?,?) ON DUPLICATE KEY UPDATE reply_count = reply_count + 1`,
            values: [Number(args.parentId), 1]
          }

          return db.transaction_query(updateReplyCount_query);
        })
        .then(result => {
          db.db.commit((err) => {
            if(err) {
              return db.db.rollback(function() {
                throw err;
              });
            }
            console.log("commited!")
            resolve(true);
          })
        })
        .catch(err => {
          console.log(err);
          reject(new Error("Couldn't complete reply transaction."))
        });
      })
    })
  }
}