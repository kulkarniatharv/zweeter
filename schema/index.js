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
    id: ID!
    tweet: String!
    username: String!
    name: String!
    timestamp: String!
    num_likes: Int
    reply_count: Int
    liked_id: Int
  }

  type UserTweets {
    tweets: [FeedTweet!]
    name: String!
    username: String!
  }

  type User {
    id: ID!
    name: String!
    username: String!
    bio: String
    followers: Int
    following: Int
    tweets_count: Int!
  }

  type AuthData {
    userId: ID!
    token: String!
    tokenExpiration: Int!
  }

  type RootQuery {
    getUserDetail(username: String): [User!]!
    login(username: String!, password: String!): AuthData!
    userTweets(username: String): UserTweets
    getUserFeed(page: Int!): [FeedTweet]
    isFollowing(userId: Int!): Boolean 
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
    postTweet(userInput: PostTweetInput!): FeedTweet!
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