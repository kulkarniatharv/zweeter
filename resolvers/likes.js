const db = require('../db_connection');

module.exports = {
  
  addLike: async (args, req) => {
    
    if(!req.isAuth) {
      throw new Error(req.errorName.UNAUTHORIZED)
    }

    let type = 1;
    
    if(args.userInput.tweet_id){
      type = 0
    }

    return new Promise((resolve, reject) => {
      db.db.beginTransaction((err) => {
        if (err) {reject(err);}

        let insertLike_query = {
          sql: `INSERT INTO likes (${!type ? 'tweet_id' : 'reply_id'}, liked_by, type) values (?, ?, ?)`,
          values: !type ? [Number(args.userInput.tweet_id), req.userId, type] : [Number(args.userInput.reply_id), req.userId, type] 
        }
        
        db.transaction_query(insertLike_query)
        .then(result => {
          const updateLikeCount_query = {
            sql: `INSERT INTO likes_count (${!type ? 'tweet_id' : 'reply_id'}, num_likes, type) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE num_likes = num_likes + 1`,
            values: !type ? [Number(args.userInput.tweet_id), 1, type] : [Number(args.userInput.reply_id), 1, type]
          }

          return db.transaction_query(updateLikeCount_query);
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
          reject(new Error("Couldn't complete like transaction."))
        });
      })
    })
  },

  removeLike: async (args, req) => {
    if(!req.isAuth) {
      throw new Error(req.errorName.UNAUTHORIZED)
    }

    let type = 1;
    
    if(args.userInput.tweet_id){
      type = 0
    }
    
    return new Promise((resolve, reject) => {
      db.db.beginTransaction((err) => {
        if (err) {reject(err);}

        let likeExist_query = {
          sql: `SELECT id from likes WHERE liked_by = ?`,
          values: [req.userId]
        }

        let deleteLike_query = {
          sql: `DELETE FROM likes WHERE ${!type ? 'tweet_id' : 'reply_id'} = ?`,
          values: !type ? [args.userInput.tweet_id] : [args.userInput.reply_id] 
        }
        
        db
        .query(likeExist_query)
        .then(result => {
          if(result.length !== 0){
            return db.transaction_query(deleteLike_query)
          }
          throw new Error("User like doesn't exist.")
        })
        .then(result => {
          const updateLikeCount_query = {
            sql: `UPDATE likes_count SET num_likes = num_likes - 1 WHERE ${!type ? 'tweet_id' : 'reply_id'} = ?`,
            values: !type ? [args.userInput.tweet_id] : [args.userInput.reply_id]
          }

          return db.transaction_query(updateLikeCount_query);
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