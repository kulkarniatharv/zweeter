const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const apiSchema = require('./schema/index');
const apiResolver = require('./resolvers/index');
const isAuth = require('./middleware/is-auth');

// TODO:
// * Create new file for storing schema and resolvers of graphql
// * Add user authentication
// * When signing up, create new table called userfeed_[username] which will contain only tweet ids of tweets 
// * Write the logic for posting tweets
// * Store the user feed in userfeed_[username] table and when user requests for feed, populate the tweets and send them. Send 50 at a time
// 

const app = express();


app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Origin', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if(req.method === 'OPTIONS'){
    return res.sendStatus(200);
  }

  next();
})

app.use(isAuth);

app.use('/api', graphqlHTTP({
  schema: apiSchema,
  rootValue: apiResolver,
  graphiql: true
}));

app.listen('3000', () => {
  console.log('server started on port 3000');
});
