var env = {
    nodeEnv: process.env.NODE_ENV || 'dev',
    port: process.env.PORT || 3500,
    dbUsername: process.env.DB_USERNAME,
    dbPassword: process.env.DB_PASSWORD,
    dbName: process.env.DB_NAME,
    dbUri: process.env.MONGODB_URI
};

export default env;