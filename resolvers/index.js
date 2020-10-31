const db = require('../db_connection');
const authResolver = require('./auth');
const tweetsResolver = require('./tweets');
const followersResolver = require('./followers');
const likesResolver = require('./likes');

const rootResolver = {
  
  ...authResolver,
  ...tweetsResolver,
  ...followersResolver,
  ...likesResolver,

  // query

  users: async () => {
    let query = 'SELECT * FROM users';

    try {
      const res = await db.query(query);
      console.log(res);
      return res;
    } 
    catch (err_1) {
      console.log(err_1);
      throw err_1;
    }
  },

  tweets: async () => {
    let query = 'SELECT tweets.*, CONCAT(users.firstname, " ", users.lastname) AS "author_name", users.username AS author_username FROM tweets INNER JOIN users ON tweets.author=users.id';
    
    try {
      const res = await db.query(query);
      console.log(res);
      return res;
    } catch (err_1) {
      console.log(err_1);
      throw err_1;
    }
  },


};

module.exports = rootResolver;