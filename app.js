const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const FormatError = require('easygraphql-format-error');
const apiSchema = require('./schema/index');
const apiResolver = require('./resolvers/index');
const isAuth = require('./middleware/is-auth');

// TODO:
// * Send 50 at a time while requesting userfeed.
// * a retweet function
// * when user posts a tweet, add it to his userfeed table

// FIXME:
// 

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

app.listen(process.env.PORT || '8000', () => {
  console.log('Server Started');
});
