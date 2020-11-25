const db = require('../db_connection');

// TODO:
// *

// FIXME:
// *

module.exports = {

  addFollowing: async (args, req) => {
    // talking wrt me, so if i follow someone then add this person to my following list
    
    /* STORED PROCEDURE FOR POPULATING THE USERFEED AFTER FOLLOWING SOMEONE
    // DELIMITER //
    // CREATE DEFINER=`admin`@`%` PROCEDURE `populate_userfeed_after_following`(IN username varchar(20), IN following_username varchar(20))
    // BEGIN
        
    // SET @following_id = 0;
    // SET @last_tweet = NULL;

    // SET @followingId_tweet = CONCAT('SELECT id from users where username=\'', following_username, '\' into @following_id');
    // SET @timestamp_tweet = CONCAT('SELECT min(timestamp) FROM userfeed_', username, ' into @last_tweet');

    // PREPARE followingIdQuery FROM @followingId_tweet;
    // EXECUTE followingIdQuery; 
    // DEALLOCATE PREPARE followingIdQuery;

    // PREPARE timestamp_tweetQuery FROM @timestamp_tweet;
    // EXECUTE timestamp_tweetQuery; 
    // DEALLOCATE PREPARE timestamp_tweetQuery;

    // IF (@last_tweet is NULL) THEN
    //   SET @insert_statement = CONCAT('INSERT INTO userfeed_', username, '(tweet_id) SELECT id from tweets
    //   WHERE author=@following_id
    //       LIMIT 200');
    // ELSE
    //       SET @insert_statement = CONCAT('INSERT INTO userfeed_', username, '(tweet_id) SELECT id from tweets
    //   WHERE author=@following_id and timestamp > @last_tweet');
    // END IF;

    // PREPARE insertQuery FROM @insert_statement;
    // EXECUTE insertQuery; 
    // DEALLOCATE PREPARE insertQuery;

    // SET @userfeed_tweets_count_after_following = 0;
    // SET @getTweetsCount_after_following = CONCAT('Select count(*) from userfeed_', username , ' into @userfeed_tweets_count_after_following');

    // PREPARE tweetsCount_after_following FROM @getTweetsCount_after_following;
    // EXECUTE tweetsCount_after_following;
    // DEALLOCATE PREAPARE tweetsCount_after_following;

    // IF @userfeed_tweets_count_after_following > 200 then  
    //   SET @deleteExtraTweets_after_following = CONCAT('DELETE FROM userfeed_', username , ' WHERE timestamp <= (
    //       SELECT timestamp
    //       FROM (
    //         SELECT timestamp
    //         FROM userfeed_', username, '
    //         ORDER BY timestamp DESC
    //         LIMIT 1 OFFSET 200
    //       ) foo
    //       )');
        
    //   PREPARE deleteExtraTweets_after_following FROM @deleteExtraTweets_after_following;
    //   EXECUTE deleteExtraTweets_after_following;
    //   DEALLOCATE PREAPARE deleteExtraTweets_after_following;
    // END IF;

    // END
    // DELIMITER ; */

    if(!req.isAuth) {
      throw new Error(req.errorName.UNAUTHORIZED)
    }

    // begin transaction
    return new Promise((resolve, reject) => {
      db.db.beginTransaction((err) => {
        if (err) {reject(err);}
        
        const getUser_query = {
          sql: 'SELECT id FROM `users` WHERE `username` = ?',
          values: [args.username]
        };
        
        let followingUserDetails;
  
        db
        .transaction_query(getUser_query)
        .then(followingDetails => {
  
          followingUserDetails = followingDetails;
  
          const insertFollowing_query = {
            sql: 'INSERT INTO followers VALUES (?,?)',
            values: [req.userId, followingDetails[0].id]
          };

          return db.transaction_query(insertFollowing_query);
        })
        .then((result) => {
          // increasing my following count
          const updateFollowingCount_query = {
            sql: 'INSERT INTO following_count VALUES (?, 1) ON DUPLICATE KEY UPDATE following_count = following_count + 1',
            values: [req.userId]
          }

          return db.transaction_query(updateFollowingCount_query);
        })
        .then(result => {
          // increasing the follower count of the person i'm following
          const updateFollowersCount_query = {
            sql: 'INSERT INTO followers_count VALUES (?, 1) ON DUPLICATE KEY UPDATE num_followers = num_followers + 1',
            values: [followingUserDetails[0].id]
          }
  
          return db.transaction_query(updateFollowersCount_query);
        })
        .then(result => {
          const populate_userfeed_following_query = {
            sql: 'call populate_userfeed_after_following(?, ?)',
            values: [req.username, args.username]
          }

          console.log(populate_userfeed_following_query);

          return db.transaction_query(populate_userfeed_following_query);
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
          reject(new Error("Couldn't complete following-follower transaction"))
          console.log(err)
        })
      })
    });
  },

  removeFollowing: async (args, req) => {
    
    if(!req.isAuth) {
      throw new Error(req.errorName.UNAUTHORIZED)
    }

    return new Promise((resolve, reject) => {
      db.db.beginTransaction((err) => {
        if (err) {reject(err);}

        const getUser_query = {
          sql: 'SELECT id FROM `users` WHERE `username` = ?',
          values: [args.username]
        };

        let followingUserDetails;
  
        db
        .transaction_query(getUser_query)
        .then(result => {

          followingUserDetails = result[0]

          let followingExist_query = {
            sql: `SELECT user_id FROM followers WHERE user_id = ? AND following_id = ?`,
            values: [req.userId, result[0].id]
          }

          return db.transaction_query(followingExist_query)
        })
        .then(followingExist => {
          if(followingExist.length !== 0){
            
            let deleteFollowing_query = {
              sql: `DELETE FROM followers WHERE user_id = ? AND following_id = ?`,
              values: [req.userId, followingUserDetails.id]
            }

            return db.transaction_query(deleteFollowing_query)
          }
          throw new Error(`You don't follow ${args.username}`)
        })
        .then(result => {
          const updateFollowingCount_query = {
            sql: `UPDATE following_count SET following_count = following_count - 1 WHERE user_id = ?`,
            values: [req.userId]
          }
          return db.transaction_query(updateFollowingCount_query);
        })
        .then(result => {
          const updateFollowerCount_query = {
            sql: `UPDATE followers_count SET num_followers = num_followers - 1 WHERE user_id = ?`,
            values: [followingUserDetails.id]
          }
          return db.transaction_query(updateFollowerCount_query);
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
          reject(new Error("Couldn't complete remove follower transaction."))
        });

      })
    })

  },

  isFollowing: async (args, req) => {
    if(!req.isAuth) {
      throw new Error(req.errorName.UNAUTHORIZED)
    }

    const query = {
      sql: `SELECT user_id from followers where user_id=? and following_id=?`,
      values: [req.userId, args.userId]
    }

    try{
      const followingDetails = await db.query(query);

      if (followingDetails.length !== 0){
        return true
      }
      return false;
    }catch (err){
      console.log(err);
    }
  }
}

