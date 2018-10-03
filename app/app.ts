require('dotenv').config();

import Server from './server';

/**
 * Run server in production or development environment.
 */
var server = new Server(false);
