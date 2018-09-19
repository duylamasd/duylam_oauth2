import { getPublicKey } from '../utils/certs';
import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import passport from 'passport';
import passportJwt from 'passport-jwt';
import passportLocal from 'passport-local';
import User, { IUserModel } from '../models/user';
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
    done: (error: any, user?: string) => void
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
            'Not found',
            `User ${id} not found`,
            HttpStatus.NotFound
        ));
    }

    return done(undefined, user);
});

passport.use(new LocalStrategy(
    async (
        user: string,
        password: string,
        done: (error?: ServerError, user?: IUserModel) => void
    ) => {
        let userInfo = await User.findOne({
            $or: [
                { username: user },
                { email: user },
                { phone: user }
            ]
        });

        if (!userInfo) {
            return done(new ServerError(
                'USER_NOT_FOUND',
                `User ${user} not found`,
                HttpStatus.NotFound
            ));
        }

        let isPasswordMatch = await userInfo.comparePassword(password);
        if (!isPasswordMatch) {
            return done(new ServerError(
                'INVALID_USER',
                'Invalid user or password',
                HttpStatus.Unauthorized
            ));
        }

        return done(undefined, userInfo);
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
        done: (error?: ServerError, user?: IUserModel, info?: any) => void
    ) => {
        if (!payload) {
            return done(new ServerError(
                'Unauthorized',
                'Invalid token',
                HttpStatus.Unauthorized
            ));
        }

        return done(undefined, payload);
    }
));