import bodyParser from 'body-parser';
import compression from 'compression';
import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import https from 'https';
import methodOverride from 'method-override';
import passport from './config/passport';
import { RedisClient } from 'redis';
import session from 'express-session';
import s from 'connect-redis';
import spdy from 'spdy';
import setDatabaseConfigurations from './config/database';
import path from 'path';
import errorHandler from './utils/errorHandler';
import AuthController from './controllers/auth';
import CredentialController from './controllers/credential';
import UserController from './controllers/user';
import env from './config/environment';

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
  private server: https.Server;

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
    // Run the application
    const PORT = env.port;
    this.server = spdy.createServer(
      {
        key: fs.readFileSync(path.join(__dirname, '../') + '/server.key'),
        cert: fs.readFileSync(path.join(__dirname, '../') + '/server.crt')
      },
      this.app
    ).listen(PORT, (err: any) => {
      if (err) {
        console.error('Create server failed');
        console.error(err);
        process.exit(1);
      }

      console.log(`Listening on port: ${PORT}`);
    });
  }

  /**
   * Configure the application environment and middlewares.
   */
  private async configureAppEnvironmentAndMiddlewares(): Promise<void> {
    await setDatabaseConfigurations();

    /**
     * The redis store.
     */
    const RedisStore: s.RedisStore = s(session);

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
    await this.app.use(bodyParser.json());
    await this.app.use(bodyParser.urlencoded({ extended: true }));
    await this.app.use(methodOverride());
    await this.app.use(compression());
    await this.app.use(session({
      resave: true,
      saveUninitialized: true,
      secret: 'my_secret',
      store: new RedisStore({
        client: new RedisClient({
          host: '127.0.0.1',
          port: 6379
        }),
        host: '127.0.0.1',
        port: 6379
      })
    }));
    await this.app.use(passport.initialize());
    await this.app.use(passport.session());

    await this.configureAppRoutes();

    // Error handler
    await this.app.use(errorHandler);
  }

  /**
   * Routes configuration
   */
  private async configureAppRoutes(): Promise<void> {
    await this.app.get('/healthcheck', (req: Request, res: Response) => { res.send('OK'); });
    await this.app.use('/auth', AuthController);
    await this.app.use('/credentials', CredentialController);
    await this.app.use('/users', UserController);
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
