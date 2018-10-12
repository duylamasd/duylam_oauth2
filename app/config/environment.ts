var env = {
  nodeEnv: process.env.NODE_ENV || 'dev',
  port: process.env.PORT || 3500,
  dbUsername: process.env.DB_USERNAME,
  dbPassword: process.env.DB_PASSWORD,
  dbName: process.env.DB_NAME,
  dbUri: process.env.MONGODB_URI,
  mongoImg: process.env.MONGO_IMG,
  redisHost: process.env.REDIS_HOST,
  cookieSecret: process.env.COOKIE_SECRET || 'secret',
  twitterConsumerKey: process.env.TWITTER_CONSUMER_KEY || '',
  twitterConsumerSecret: process.env.TWITTER_CONSUMER_SECRET || ''
};

export default env;
