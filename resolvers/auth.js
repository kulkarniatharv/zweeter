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

    let success = "User not created!";
    
    db.query(newUser_query)
      .then(res => {
        console.log("User details created");
        return db.query(newUserCredentials_query);
      })
      .then(result => {
        console.log("Credentials ", result);
        success = "USER CREATED!"
      })
      .catch(err => {
        console.log(err);
      });

      return success;
  },

  // ===================QUERIES=======================

  login: async ({username, password}) => {
    
    // Checking if user exists
    const checkUser_query = {
      sql: 'SELECT * FROM `user_credentials` WHERE `username` = ?',
      values: [username]
    };

    let userCheck = await db.query(checkUser_query);

    console.log("Login usercheck ", userCheck);

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
        {user_id: userDetails[0].id, username: userDetails[0].username},
        process.env.TOKEN_SIGNING_KEY,
        {expiresIn: '2h'}
      );
      return {userId: userDetails[0].id, token: token, tokenExpiration: 2}
    }
    else {
      throw new Error("Authentication was successful but couldn't log you in due to server issues.");
    };
  }
}