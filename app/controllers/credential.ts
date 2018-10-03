import crypto from 'crypto';
import { Router, Request, Response, NextFunction } from 'express';
import { HttpStatus } from '../enumtypes';
import { ServerError } from '../utils/errorHandler';
import Credential from '../models/credential';
import passport, { authenticatePassport, ensureAuthenticated } from '../config/passport';

/**
 * Credential controller
 */
var CredentialController: Router = Router();

CredentialController.post(
  '/',
  authenticatePassport('jwt'),
  ensureAuthenticated,
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ServerError(
        'UNAUTHORIZED',
        'Unauthorized',
        HttpStatus.Unauthorized
      ));
    }

    let now = new Date();
    let userId = req.user._id;
    let expireTime = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    let data = Object.assign({ userId, expireTime }, req.body);

    // Create a random secret key when secret is not provided by the request body.
    if (!req.body.secret) {
      let secret = crypto.randomBytes(36).toString('hex');
      data = Object.assign({ secret }, data);
    }
    let credential = await Credential.create(data);
    if (!credential) {
      return next(new ServerError(
        'CREDENTIAL_CREATE_FAILED',
        `Coundn't create credential`,
        HttpStatus.InternalServerError
      ));
    }

    return res.json({
      id: credential._id,
      secret: credential.secret
    });
  }
);

export default CredentialController;
