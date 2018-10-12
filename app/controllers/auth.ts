import { Router, Request, Response, NextFunction } from 'express';
import { HttpStatus } from '../enumtypes';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import passport, { authenticatePassport } from '../config/passport';
import { ServerError } from '../utils/errorHandler';
import { getPrivateKey } from '../utils/certs';
import User, { UserModel } from '../models/user';
import * as _ from 'lodash';

/**
 * Authorization router.
 */
var AuthController: Router = Router();

/**
 * Local authentication.
 */
AuthController.post(
  '/login',
  async (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate(
      'local',
      { session: false },
      (error: any, user?: any, info?: any) => {
        if (error) {
          return next(new ServerError(
            'UNHANDLED',
            info ? info.message ? info.message : 'Unhandled error' : 'Unhandled error',
            HttpStatus.InternalServerError
          ));
        }

        if (!user) {
          return next(new ServerError(
            'UNAUTHORIZED',
            info ? info.message ? info.message : 'Unauthorized' : 'Unauthorized',
            HttpStatus.Unauthorized
          ));
        }

        req.login(user, (error) => {
          if (error) {
            return next(new ServerError(
              'UNAUTHORIZED',
              'Unauthorized',
              HttpStatus.Unauthorized
            ));
          }

          const token = jwt.sign(
            user,
            fs.readFileSync(getPrivateKey()),
            {
              algorithm: 'RS256',
              issuer: 'duylam',
              audience: 'duylam',
              expiresIn: 3600
            }
          );

          return res.send({
            type: 'Bearer',
            token: token,
            message: 'OK'
          });
        });
      }
    )(req, res, next);
  }
);

AuthController.get(
  '/twitter',
  authenticatePassport('twitter'),
  (req: Request, res: Response, next: NextFunction) => {
    res.send('OK');
  }
);

AuthController.get(
  '/twitter/callback',
  authenticatePassport('twitter'),
  (req: Request, res: Response, next: NextFunction) => {
    res.send('OK');
  }
);

export default AuthController;
