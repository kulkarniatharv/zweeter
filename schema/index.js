const {buildSchema} = require('graphql');

// TODO:
// * Delete Followers, likes, tweets mutations

module.exports = buildSchema(`

  type Tweet {
    id: ID!
    tweet: String!
    author: Int!
    timestamp: String!
  }

  type UserTweets {
    tweets: [Tweet!]
    author_name: String!
    author_username: String!
  }

  type User {
    id: ID!
    firstname: String! 
    lastname: String!
    username: String!
    bio: String
  }

  type AuthData {
    userId: ID!
    token: String!
    tokenExpiration: Int!
  }

  type RootQuery {
    users: [User!]!
    login(username: String!, password: String!): AuthData!
    userTweets(username: String!): UserTweets
  }

  input CreateUserInput {
    username: String!
    firstname: String!
    lastname: String!
    bio: String
    password: String!
  }

  input PostTweetInput {
    tweet: String!
  }

  input AddLikeInput {
    tweet_id: ID
    reply_id: ID
  }

  type RootMutation {
    createUser(userInput: CreateUserInput!): String!
    postTweet(userInput: PostTweetInput!): String!
    addFollowing(username: String!): Boolean!
    removeFollowing(username: String!): Boolean!
    addLike(userInput: AddLikeInput!): Boolean!
    removeLike(userInput: AddLikeInput!): Boolean!
  }

  schema {
    query: RootQuery
    mutation: RootMutation
  }
`)