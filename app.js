const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const FormatError = require('easygraphql-format-error');
const apiSchema = require('./schema/index');
const apiResolver = require('./resolvers/index');
const isAuth = require('./middleware/is-auth');

// TODO:
// * Store the user feed in userfeed_[username] table and when user requests for feed, populate the tweets and send them. Send 50 at a time
// * send number of likes with every tweet; be it in userTweets or a feed tweets 
// * a retweet function

// FIXME:
// * likes, reply count are not getting updated properly.

const app = express();
const formatError = new FormatError();
const errorName = formatError.errorName;


app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if(req.method === 'OPTIONS'){
    return res.sendStatus(200);
  }

  next();
})

app.use(isAuth);

app.use('/api', (req, res) => { 
  graphqlHTTP({
    schema: apiSchema,
    rootValue: apiResolver,
    graphiql: true,
    context: { errorName, isAuth: req.isAuth, userId: req.userId, username: req.username },
    formatError: (err) => {
        return formatError.getError(err)
      }
  })(req, res);
});

app.listen(process.env.PORT || '3000', () => {
  console.log('server started on port 3000');
});
