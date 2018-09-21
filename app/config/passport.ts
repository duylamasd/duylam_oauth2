import { getPublicKey } from '../utils/certs';
import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import passport from 'passport';
import passportJwt from 'passport-jwt';
import passportLocal, { IVerifyOptions } from 'passport-local';
import User, { IUserModel, UserModel } from '../models/user';
import { ServerError } from '../utils/errorHandler';
import { HttpStatus } from '../enumtypes';
import { ObjectId } from 'mongodb';

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

passport.serializeUser((
    user: IUserModel,
    done: (error: any, user?: ObjectId) => void
) => {
    return done(undefined, user._id);
});

passport.deserializeUser(async (
    id: ObjectId,
    done: (error?: ServerError, user?: IUserModel) => void
) => {
    let user = await User.findById(id, { _id: 0, password: 0 });
    if (!user) {
        return done(new ServerError(
            'USER_NOT_FOUND',
            `User ${id} not found`,
            HttpStatus.NotFound
        ));
    }

    return done(undefined, user);
});

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

        return done(undefined, payload);
    }
));

/**
 * Autnentication middleware.
 * @param {string[]} strategies Authentication strategies
 */
export let authentication = (strategies: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        passport.authenticate(
            strategies,
            { session: false },
            (error: any, user?: UserModel, info?: any) => {
                if (error) {
                    return next(error);
                }

                if (!user) {
                    return next(new ServerError(
                        'UNAUTHORIZED',
                        info ? info.message ? info.message : 'Unauthorized' : 'Unauthorized',
                        HttpStatus.Unauthorized
                    ));
                }

                return next();
            }
        )(req, res, next);
    };
}

/**
 * Login required middleware
 */
export let isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated()) {
        return next();
    }

    return next(new ServerError(
        'UNAUTHENTICATED',
        'Unauthenticated',
        HttpStatus.Unauthorized
    ));
}

/**
 * export the passport
 */
export default passport;