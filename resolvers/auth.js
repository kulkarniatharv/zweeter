const db = require('../db_connection');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// FIXME:
// * use transaction logic in creating user and logining user


module.exports = {
  
  // ================MUTATIONS==============

  createUser: async ({userInput}) => {
    const {username, firstname, lastname, bio, password} = userInput;
    
    // Checking if the user previously exists
    const checkUser_query = {
      sql: 'SELECT id FROM `users` WHERE `username` = ?',
      values: [username]
    };

    let userCheck = await db.query(checkUser_query);

    if(userCheck.length != 0){
      throw new Error('User already exists');
    }

    // Hashing the plain-text password to store in db
    const hashedPassword = await bcrypt.hash(password, 12);

    // quering for new users
    const newUser_query = {
      sql: `INSERT INTO users (firstname, lastname, username, bio)
       VALUES (?,?,?,?)`,
      values: [firstname, lastname, username, bio]
    };

    const newUserCredentials_query = {
      sql: `INSERT INTO user_credentials 
      VALUES (?,?)`,
      values: [username, hashedPassword]
    }

    const newUserFeedTable_query = {
      sql: `CREATE TABLE userfeed_${username} (
        tweet_id INT,
        retweet_id INT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tweet_id) REFERENCES tweets(id) ON DELETE CASCADE,
        FOREIGN KEY (retweet_id) REFERENCES retweets(id) ON DELETE CASCADE
        )`,
      values: ['userfeed_' + username]
    }

    return new Promise((resolve, reject) => {
      db.db.beginTransaction((err) => {
        if(err) {reject(err);}

        db
        .transaction_query(newUser_query)
        .then(result => {
          return db.transaction_query(newUserCredentials_query);
        })
        .then(result => {
          return db.transaction_query(newUserFeedTable_query)
        })
        .then(result => {
          db.db.commit((err) => {
            if(err) {
              return db.db.rollback(function() {
                throw err;
              });
            }
            console.log("commited!")
            resolve("USER CREATED!");
          })
        })
        .catch(err => {
          reject(new Error("Couldn't create user."))
          console.log(err)
        })

      })
    })
  },

  // ===================QUERIES=======================

  login: async ({username, password}) => {
    
    // Checking if user exists
    const checkUser_query = {
      sql: 'SELECT * FROM `user_credentials` WHERE `username` = ?',
      values: [username]
    };

    let userCheck = await db.query(checkUser_query);

    if(userCheck.length == 0){
      throw new Error('Authentication Failed');
    }


    // Checking if password is valid
    const isValid = await bcrypt.compare(password, userCheck[0].password);

    if(!isValid){
      throw new Error("Authentication Failed");
    }

    let userDetails_query = {
      sql: 'SELECT id FROM `users` WHERE `username` = ?',
      values: [username]
    };

    const userDetails = await db.query(userDetails_query);

    if(userDetails.length != 0){
      const token = jwt.sign(
        {user_id: userDetails[0].id, username: username},
        process.env.TOKEN_SIGNING_KEY,
        {expiresIn: '2h'}
      );
      return {userId: userDetails[0].id, token: token, tokenExpiration: 2}
    }
    else {
      throw new Error("Authentication was successful but couldn't log you in due to server issues.");
    };
  },

  deleteUser: async (args, req) => {
    if(!req.isAuth) {
      throw new Error(req.errorName.UNAUTHORIZED)
    }

    // Checking if user exists
    const checkUser_query = {
      sql: 'SELECT * FROM `user_credentials` WHERE `username` = ?',
      values: [req.username]
    };

    let userCheck = await db.query(checkUser_query);

    if(userCheck.length == 0){
      console.log("no user found")
      throw new Error("no user found");
    }

    // Checking if password is valid
    const isValid = await bcrypt.compare(args.password, userCheck[0].password);

    if(!isValid){
      console.log("password not valid")
      throw new Error("password not valid");
    }

    let deleteQuery = {
      sql: `DELETE FROM users WHERE username=?`,
      values:[req.username]
    }

    let deleteUserfeedTable = {
      sql: `DROP TABLE userfeed_${req.username}`
    }
    try{
      const deleteResult = await db.query(deleteQuery);
      const deleteUserfeedResult = await db.query(deleteUserfeedTable);
      return true;
    }catch (err) {
      return false;
    }

    
  }
}