const db = require('../db_connection');

// FIXME:  
// * 

module.exports = {
  
  // query

  userTweets: async (args, req) => {
    if(!req.isAuth) {
      throw new Error(req.errorName.UNAUTHORIZED)
    }
    console.log(args.username);

    const checkUser_query = {
      sql: 'SELECT id, CONCAT(users.firstname, " ", users.lastname) AS "author_name", username FROM `users` WHERE `username` = ?',
      values: [args.username === undefined ? req.username : args.username]
    };


    let userDetails;

    try {
      userDetails = await db.query(checkUser_query);

    } catch (err_1) {
      console.log(err_1);
      throw err_1;
    }

    try {
      const getUserTweets_query = {
        sql: `SELECT t.id, t.tweet, u.username, concat(u.firstname, ' ', u.lastname) as name, t.timestamp, lc.num_likes, trc.reply_count, l.id as liked_id
        FROM tweets t
        INNER JOIN users u
        ON t.author = u.id
        LEFT JOIN likes l
        ON l.tweet_id = t.id and l.liked_by = ?
        LEFT JOIN likes_count lc
        ON t.id = lc.tweet_id
        LEFT JOIN tweet_replies_count trc
        ON t.id = trc.parent_id
        WHERE u.id= ?
        ORDER BY t.timestamp desc
        LIMIT 200`,
        values: [req.userId, args.username === undefined ? req.userId : userDetails[0].id],
      };

      const userTweets = await db.query(getUserTweets_query);


      return {
        tweets: userTweets,
        name: userDetails[0].author_name,
        username: userDetails[0].username,
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
        sql: `SELECT t.id, t.tweet, u.username, concat(u.firstname, ' ', u.lastname) as name, t.timestamp, lc.num_likes
        FROM tweets t
        INNER JOIN users u
        ON t.author = u.id
        LEFT JOIN likes_count lc
        ON t.id = lc.tweet_id
        LEFT JOIN tweet_replies_count trc
        ON t.id = trc.parent_id
        WHERE t.id=?`,
        values: [res.insertId]
      };

      const tweet = await db.query(getTweetQuery);
      console.log("twwert", tweet);
      
      const sp_userfeed_query = {
        sql: `CALL populate_userfeeds(${res.insertId}, ${req.userId}, False)`,
      };
      
      const sp_res = await db.query(sp_userfeed_query);
      console.log(res);
      console.log("sp_res",sp_res);

      return tweet[0];
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