const db = require('../db_connection');
const authResolver = require('./auth');
const tweetsResolver = require('./tweets');
const followersResolver = require('./followers');
const likesResolver = require('./likes');
const userfeedResolver = require('./userfeed');

const rootResolver = {
  
  ...authResolver,
  ...tweetsResolver,
  ...followersResolver,
  ...likesResolver,
  ...userfeedResolver,
};

module.exports = rootResolver;