import { getPublicKey } from '../utils/certs';
import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import passport from 'passport';
import passportJwt from 'passport-jwt';
import passportLocal, { IVerifyOptions } from 'passport-local';
import { HeaderAPIKeyStrategy } from 'passport-headerapikey';
import passportTwitter from 'passport-twitter';
import env from '../config/environment';
import Credential, { ICredentialModel } from '../models/credential';
import User, { IUserModel } from '../models/user';
import { ServerError } from '../utils/errorHandler';
import { HttpStatus } from '../enumtypes';
import { ObjectId } from 'mongodb';
import _ from 'lodash';

/**
 * Local strategy
 */
const LocalStrategy = passportLocal.Strategy;

/**
 * JWT strategy authentication
 */
const JwtStrategy = passportJwt.Strategy;

/**
 * Extract JWT
 */
const ExtractJWT = passportJwt.ExtractJwt;

/**
 * Twitter strategy
 */
const TwitterStrategy = passportTwitter.Strategy;

/**
 * Strings type.
 */
type Strings = string | string[];

passport.serializeUser((
  user: IUserModel | ICredentialModel,
  done: (error: any, user?: ObjectId) => void
) => {
  return done(undefined, user._id);
});

passport.deserializeUser(async (
  id: ObjectId,
  done: (error?: ServerError, user?: any) => void
) => {
  let user = await User.findById(id, { _id: 0, password: 0 });
  if (user) {
    return done(undefined, user);
  }

  let credential = await Credential.findById(
    id,
    { _id: 0, secret: 0 }
  );

  if (credential) {
    return done(undefined, user);
  }

  return done(new ServerError(
    'USER_NOT_FOUND',
    `User or credential ${id} not found`,
    HttpStatus.NotFound
  ));
});

passport.use(new LocalStrategy(
  { usernameField: 'user' },
  async (
    user: string,
    password: string,
    done: (error: any, user?: any, options?: IVerifyOptions) => void
  ) => {
    let userInfo = await User.findOne({
      $or: [
        { username: user },
        { email: user },
        { phone: user }
      ]
    });

    if (!userInfo) {
      return done(null, false, { message: `User ${user} is invalid` });
    }

    let isPasswordMatch = await userInfo.comparePassword(password);

    if (!isPasswordMatch) {
      return done(null, false, { message: 'Invalid password' });
    }

    let userInfoForSignin = _.omit(userInfo.toJSON(), ['password', 'profile']);

    return done(null, userInfoForSignin, { message: 'Login success' });
  }
));

passport.use(new JwtStrategy(
  {
    jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
    secretOrKey: fs.readFileSync(getPublicKey()),
    issuer: 'duylam',
    audience: 'duylam',
    algorithms: ['RS256'],
    jsonWebTokenOptions: {
      algorithms: ['RS256'],
      audience: 'duylam',
      issuer: 'duylam'
    }
  },
  (
    payload: IUserModel | undefined | null,
    done: (error: any, user?: any, info?: IVerifyOptions) => void
  ) => {
    if (!payload) {
      return done(undefined, undefined, { message: 'Invalid token' });
    }

    let authData = Object.assign(
      { authType: 'jwt' },
      payload
    );

    return done(undefined, authData);
  }
));

passport.use(new HeaderAPIKeyStrategy(
  { header: 'Authorization', prefix: 'APIKey ' },
  false,
  async (
    apiKey: string,
    done: (error: ServerError | null, user?: any, info?: any) => void
  ) => {
    let [id, secret] = apiKey.split(':');

    // Check if id is valid.
    let isIdValid = ObjectId.isValid(id);
    if (!isIdValid) {
      return done(null, false, { message: 'Invalid apikey id' });
    }

    let credential = await Credential.findOne({ _id: id, secret: secret });

    if (!credential) {
      return done(null, false, { message: 'Invalid apikey' });
    }

    let isCredentialValid = await credential.isExpired();
    if (!isCredentialValid) {
      return done(null, false, { message: 'Apikey expired' });
    }

    let authData = Object.assign(
      { authType: 'apiKey' },
      credential.toJSON()
    );

    return done(null, authData);
  }
));

passport.use(new TwitterStrategy(
  {
    consumerKey: env.twitterConsumerKey,
    consumerSecret: env.twitterConsumerSecret,
    userProfileURL: 'https://api.twitter.com/1.1/account/verify_credentials.json?include_email=true',
    includeEmail: true,
    callbackURL: '/auth/twitter/callback',
    passReqToCallback: true
  },
  async (
    req: Request,
    accessToken: string,
    refreshToken: string,
    profile: passportTwitter.Profile,
    done: (error: any, user?: any) => void
  ) => {
    if (req.user) {
      let existingUser = await User.findOne({ twitterId: profile.id });
      if (existingUser) {
        return done(undefined);
      }

      let user = await User.findById(req.user._id);
      if (!user) {
        return done(new ServerError(
          'USER_NOT_FOUND',
          'User not found',
          HttpStatus.Unauthorized
        ));
      }

      let existingTokenIdx = await user.accessToken.findIndex(token => { return token.kind === 'Twitter' });
      if (existingTokenIdx < 0) {
        user.accessToken.push({ kind: 'Twitter', token: accessToken });
      } else {
        user.accessToken[existingTokenIdx].token = accessToken;
      }
      user.profile.gender = user.profile.gender || profile.gender;
      user.profile.firstname = user.profile.firstname || (profile.name ? profile.name.givenName : undefined);
      user.profile.lastname = user.profile.lastname || (profile.name ? `${profile.name.familyName}${profile.name.middleName}` : undefined);
      user.profile.picture = user.profile.picture || (profile.photos ? profile.photos[0].value : undefined);
      user.email = user.email || (profile.emails ? profile.emails[0].value : undefined);
      let savedUser = await user.save();
      if (!savedUser) {
        return done(new ServerError(
          'AUTHORIZE_FAILED',
          'Authorize failed',
          HttpStatus.Unauthorized
        ));
      }

      return done(undefined, savedUser);
    } else {
      let existingUser = await User.findOne({ twitterId: profile.id });
      if (existingUser) {
        return done(undefined, existingUser);
      }

      let existingUserByEmail = await User.findOne({ email: (profile.emails ? profile.emails[0].value : '') });
      if (!existingUserByEmail) {
        return done(new ServerError(
          'AUTHORIZE_FAILED',
          'Authorize failed',
          HttpStatus.Unauthorized
        ));
      }

      let existingTokenIdx = await existingUserByEmail.accessToken.findIndex(token => { return token.kind === 'Twitter' });
      if (existingTokenIdx < 0) {
        existingUserByEmail.accessToken.push({ kind: 'Twitter', token: accessToken });
      } else {
        existingUserByEmail.accessToken[existingTokenIdx].token = accessToken;
      }
      existingUserByEmail.profile.gender = existingUserByEmail.profile.gender || profile.gender;
      existingUserByEmail.profile.firstname = existingUserByEmail.profile.firstname || (profile.name ? profile.name.givenName : undefined);
      existingUserByEmail.profile.lastname = existingUserByEmail.profile.lastname || (profile.name ? `${profile.name.familyName}${profile.name.middleName}` : undefined);
      existingUserByEmail.profile.picture = existingUserByEmail.profile.picture || (profile.photos ? profile.photos[0].value : undefined);

      let savedUser = await existingUserByEmail.save();
      if (!savedUser) {
        return done(new ServerError(
          'AUTHORIZE_FAILED',
          'Authorize failed',
          HttpStatus.Unauthorized
        ));
      }

      return done(undefined, savedUser);
    }
  }
));

/**
 * Passport authentication middleware
 * @param {Strings} strat Strategy/strategies for authorization.
 */
export const authenticatePassport = (strat: Strings, options?: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate(
      strat,
      options,
      (error: any, user?: any, info?: any) => {
        if (error) {
          return next(new ServerError(
            'UNHANDLED',
            info ? info[1].message ? info[1].message : 'Unhandled error' : 'Unhandled error',
            HttpStatus.InternalServerError
          ));
        }

        if (!user) {
          return next(new ServerError(
            'UNAUTHORIZED',
            info ? info[1].message ? info[1].message : 'Unauthorized' : 'Unauthorized',
            HttpStatus.Unauthorized
          ));
        }

        req.login(user, error => {
          if (error) {
            return next(new ServerError(
              'UNAUTHORIZED',
              'Unauthorized',
              HttpStatus.Unauthorized
            ));
          }

          return next();
        });
      }
    )(req, res, next);
  };
}

/**
 * Ensure session is authenticated
 * @param {Request} req The request
 * @param {Reponse} res The response
 * @param {NextFunction} next Next function
 */
export const ensureAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) { return next(); }

  return next(new ServerError(
    'UNAUTHORIZED',
    'Unauthorized',
    HttpStatus.Unauthorized
  ));
}

/**
 * export the passport
 */
export default passport;
