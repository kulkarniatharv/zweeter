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

    // const {page} = args;

    if(!req.isAuth) {
      throw new Error(req.errorName.UNAUTHORIZED)
    }

    args.page = args.page % 4;

    let getUserFeed_query = {
      sql: `call userfeed(?,?)`,
      values: [req.username, req.userId] 
    }

    const result = await db.query(getUserFeed_query)

    return result[0];

  },

  getUserDetail: async (args, req) => {
    if(!req.isAuth) {
      throw new Error(req.errorName.UNAUTHORIZED)
    }

    const userDetailQuery = {
      sql: `SELECT u.id, concat(u.firstname, " ", u.lastname) as name, u.username, u.bio, followerC.num_followers as followers, followingC.following_count as following, count(t.id) as tweets_count
            FROM users u
            LEFT JOIN following_count followingC
            ON u.id = followingC.user_id
            LEFT JOIN followers_count followerC
            ON u.id = followerC.user_id
            LEFT JOIN tweets t
            ON u.id = t.author
            WHERE u.username = ?`,
      values: [args.username === undefined ? req.username : args.username]
    }

    console.log(userDetailQuery);

    try{
      const userDetails = await db.query(userDetailQuery);
      console.log(userDetails)
      return userDetails;
    }catch(err){
      console.log(err);
    }
  }


}

