const db = require('../db_connection');

module.exports = {
  
  // query

  userTweets: async (args, req) => {
    if(!req.isAuth) {
      throw new Error('Unauthenticated')
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

  // getUserFeed: async (args, req) => {
    
  // },
  
  // mutation
  postTweet: async (args, req) => {
    if(!req.isAuth) {
      throw new Error('Unauthenticated')
    }

    const tweet_query = {
      sql: `INSERT INTO tweets (tweet, author) VALUES (?, ?)`,
      values: [args.userInput.tweet, req.userId]
    };
    
    try {
      const res = await db.query(tweet_query);
      console.log(res);
      return "tweet posted";
    } catch (err_1) {
      console.log(err_1);
      throw err_1;
    }
  },

  
}