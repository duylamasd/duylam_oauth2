import mongoose from 'mongoose';
import env from './environment';

/**
 * The database connect options.
 */
const connectOptions: mongoose.ConnectionOptions = {
  reconnectTries: Number.MAX_VALUE, // Never stop trying to reconnect
  reconnectInterval: 1000, // Reconnect every second
  poolSize: 10, // Maximum number of sockets the MongoDB driver will keep open for the connection.
  bufferMaxEntries: 0, // Let database operations to fall immediately when driver is not connected.
  bufferCommands: false, // Let database operations to fall immediately when driver is not connected.
  connectTimeoutMS: 10000, // The MongoDB driver will wait for 10 seconds before falling.
  socketTimeoutMS: 40000, // The MongoDB driver will wait for 40 seconds before killing an inactive socket.
  useNewUrlParser: true, // Use the new parser
};

mongoose.Promise = global.Promise;

/**
 * Set database configurations
 */
const setDatabaseConfigurations = async () => {
  let dbUsername: string | undefined = env.dbUsername;
  let dbPassword: string | undefined = env.dbPassword;
  let dbName: string | undefined = env.dbName;
  let dbUri: string | undefined = env.dbUri;
  let mongoImg: string | undefined = env.mongoImg;

  await mongoose.connect(
    `${mongoImg}://${dbUsername}:${dbPassword}@${dbUri}/${dbName}`,
    connectOptions
  ).then(res => {
    console.log('Connect to database successfully');
  }).catch(err => {
    console.error('Database connection failed');
    console.error(err);
    process.exit(1);
  });
}

export default setDatabaseConfigurations;
