const db = require('../db_connection');

// TODO:
// *

// FIXME:
// *

module.exports = {

  addFollowing: async (args, req) => {
    // talking wrt me, so if i follow someone then add this person to my following list
    
    if(!req.isAuth) {
      throw new Error('Unauthenticated')
    }

    // begin transaction
    let wasSuccess = false;
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
          console.log("insertFollowing_query")
          return db.transaction_query(insertFollowing_query);
        })
        .then((result) => {
          // increasing my following count
          const updateFollowingCount_query = {
            sql: 'INSERT INTO following_count VALUES (?, 1) ON DUPLICATE KEY UPDATE following_count = following_count + 1',
            values: [req.userId]
          }
          console.log("updateFollowingCount_query")
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
      throw new Error('Unauthenticated')
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
          reject(new Error("Couldn't complete delete-like transaction."))
        });

      })
    })

  }
}

