import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import express, { Request, Response, NextFunction } from 'express';
import * as http from 'http';
import methodOverride from 'method-override';
import { RedisClient } from 'redis';
import session from 'express-session';
import s from 'connect-redis';
import setDatabaseConfigurations from './config/database';
import errorHandler from './utils/errorHandler';
import UserController from './controllers/user';

/**
 * The server class.
 * @class Server.
 */
export default class Server {
    /**
     * Server application
     */
    public app: express.Application;

    /**
     * The server
     */
    private server: http.Server;

    /**
     * Determine server is running in test mode or not.
     */
    private isTest: boolean;

    /**
     * Create new instance of Server.
     * @param {boolean} isTest Determine server is running in test mode.
     */
    constructor(isTest: boolean) {
        this.isTest = isTest;
        this.app = express();
        this.configureAppEnvironmentAndMiddlewares();
        this.configureAppRoutes();
        this.app.use(errorHandler);
        // Run the application
        const PORT = process.env.PORT || 3500;
        this.server = this.app.listen(PORT, () => {
            if (process.env.NODE_ENV !== 'test')
                console.log(`Server started on port ${PORT}`);
        });
    }

    /**
     * Configure the application environment and middlewares.
     */
    private async configureAppEnvironmentAndMiddlewares(): Promise<void> {
        // Environment configurations.
        if (this.isTest) {
            await dotenv.config({ path: '.env.test' });
        }
        else {
            await dotenv.config();
        }

        await setDatabaseConfigurations();

        // CORS
        this.app.use((req: Request, res: Response, next: NextFunction) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader(
                'Access-Control-Allow-Headers',
                'Origin, X-Requested-With, Content-Type, Accept, Authorization'
            );
            res.setHeader(
                'Access-Control-Allow-Methods',
                'GET, POST, OPTIONS, PUT, PATCH, DELETE'
            );
            next();
        });

        // Express parsers
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: true }));
        this.app.use(methodOverride());
    }

    /**
     * Routes configuration
     */
    private configureAppRoutes(): void {
        this.app.use('/users', UserController);
    }

    /**
     * Close the server
     */
    public closeServer(): void {
        this.server.close(() => {
            console.log('Server has been closed');
        });
    }
}