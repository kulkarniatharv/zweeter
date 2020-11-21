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

  type FeedTweet {
    tweet: String!
    username: String!
    name: String!
    timestamp: String!
    num_likes: Int!
    reply_count: Int!
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
    getUserFeed(page: Int!): [FeedTweet]
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
    deleteUser(password: String!): Boolean!
    postTweet(userInput: PostTweetInput!): String!
    postReply(reply: String!, parentId: ID!): Boolean!
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