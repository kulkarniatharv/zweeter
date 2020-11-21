// SQL LOGIC TO POPULATE USERFEED OF USERS AFTER AUTHOR POSTS A TWEET

// =============== STORED PROCEDURE ===================
// DELIMITER //

// CREATE DEFINER=`admin`@`%` PROCEDURE `populate_userfeeds`(IN tweet_id INT, IN author_id INT, IN isRetweet BOOLEAN)
//   BEGIN
// 	   DECLARE n INT DEFAULT 0;
//     DECLARE i INT DEFAULT 0;
//     DECLARE each_user VARCHAR(28);
    
//     CREATE temporary table temp_followers
//     SELECT users.username 
//     FROM followers
//     INNER JOIN users ON followers.user_id = users.id
//     WHERE followers.following_id = author_id;
    
//     SELECT COUNT(*)
//     FROM temp_followers
//     INTO n;
    
//     SET i = 0;
    
//     WHILE i<n DO
//       -- Select each user who follows the tweet author and insert the tweet/retweet into their respective userfeed table
      
//       SELECT CONCAT('userfeed_', username)
//       FROM temp_followers
//       LIMIT i,1
//       INTO each_user; 
          
//       IF isRetweet = False THEN
//         SET @insert_statement = CONCAT('INSERT INTO ', each_user,'(tweet_id) VALUES (', tweet_id, ')');
//       ELSEIF isRetweet = True THEN
//         SET @insert_statement = CONCAT('INSERT INTO ', each_user,'(retweet_id) VALUES (', tweet_id, ')');
//       END IF;
          
//       PREPARE executeQuery FROM @insert_statement;
//       EXECUTE executeQuery; 
//       DEALLOCATE PREPARE executeQuery;
          
//       SET @userfeed_tweets_count = 0;
//       SET @getTweetsCount = CONCAT('Select count(*) from ', each_user , ' into @userfeed_tweets_count');
          
//       PREPARE tweetsCount FROM @getTweetsCount;
//       EXECUTE tweetsCount;
//       DEALLOCATE PREPARE tweetsCount;
          
//       IF @userfeed_tweets_count > 200 then  
//         SET @deleteExtraTweets = CONCAT('DELETE FROM ', each_user , ' WHERE timestamp <= (
//             SELECT timestamp
//             FROM (
//               SELECT timestamp
//               FROM ', each_user, '
//               ORDER BY timestamp DESC
//               LIMIT 1 OFFSET 200
//             ) foo
//             )');
                  
//         PREPARE deleteExtraTweets FROM @deleteExtraTweets;
//         EXECUTE deleteExtraTweets;
//         DEALLOCATE PREPARE deleteExtraTweets;
//       END IF;
      
//       SET i = i + 1;
//     END WHILE;
      
//     DROP temporary table temp_followers;
    
//   END

// DELIMITER ;

const db = require('../db_connection');

module.exports = {
  
  getUserFeed: async (args, req) => {
    // get the tweets from userfeed_[username] table
    
    // this table contains 200 tweets sorted according to timestamp for userfeed of which only 50 will be sent 
    // to the user at one time and when he scrolls down then again an api rquest would be sent to get the next 50

    // when the user follows someone then their tweets will be inserted in his userfeed table according to 
    // the timestamp of tweets but the total number of tweets will be 200. tweets will be truncated after 200.

    // when the user posts a tweet then his followers' userfeed table will be updated to include this new tweet
    // removing the old tweet at the 200th position.

    console.log("IN HERE");
    // const {page} = args;

    if(!req.isAuth) {
      throw new Error(req.errorName.UNAUTHORIZED)
    }

    args.page = args.page % 4;

    // SELECT t.tweet, u.username, concat(u.firstname, ' ', u.lastname) as name, t.timestamp, lc.num_likes
    // FROM tweets t
    // INNER JOIN users u
    // ON t.author = u.id
    // LEFT JOIN likes_count lc
    // ON t.id = lc.tweet_id
    // LEFT JOIN tweet_replies_count trc
    // ON t.id = trc.id;

    let getUserFeed_query = {
      sql: `call userfeed(?)`,
      values: [req.username] 
    }

    const result = await db.query(getUserFeed_query)

    console.log("result ", result);
    
    return result[0];
    // return new Promise((resolve, reject) => {
    //   db.db.beginTransaction((err) => {
    //     if (err) {reject(err);}

        
        
    //     db.transaction_query(getUserFeed_query)
    //     .then(result => {
    //       // const updateLikeCount_query = {
    //       //   sql: `INSERT INTO likes_count (${!type ? 'tweet_id' : 'reply_id'}, num_likes, type) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE num_likes = num_likes + 1`,
    //       //   values: !type ? [Number(args.userInput.tweet_id), 1, type] : [Number(args.userInput.reply_id), 1, type]
    //       // }

    //       // return db.transaction_query(updateLikeCount_query);
    //       console.log(result)
    //     })
    //     .then(result => {
    //       db.db.commit((err) => {
    //         if(err) {
    //           return db.db.rollback(function() {
    //             throw err;
    //           });
    //         }
    //         console.log("commited!")
    //         resolve(true);
    //       })
    //     })
    //     .catch(err => {
    //       console.log(err);
    //       reject(new Error("Couldn't complete like transaction."))
    //     });
    //   })
    // })

  },
}

