import mongoose from 'mongoose';

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
    let dbUsername: string | undefined = process.env.DB_USERNAME;
    let dbPassword: string | undefined = process.env.DB_PASSWORD;
    let dbName: string | undefined = process.env.DB_NAME;
    let dbURI: string | undefined = process.env.MONGODB_URI;

    await mongoose.connect(
        `mongodb://${dbUsername}:${dbPassword}@${dbURI}/${dbName}`,
        connectOptions
    );
}

export default setDatabaseConfigurations;
