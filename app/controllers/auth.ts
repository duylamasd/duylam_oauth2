import { Router, Request, Response, NextFunction } from 'express';
import { HttpStatus } from '../enumtypes';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import passport from '../config/passport';
import { ServerError } from '../utils/errorHandler';
import { getPrivateKey } from '../utils/certs';
import User, { UserModel } from '../models/user';
import * as _ from 'lodash';

/**
 * Authorization router.
 */
var AuthController: Router = Router();

AuthController.post(
    '/login',
    async (req: Request, res: Response, next: NextFunction) => {
        let [user, password] = [req.body.user, req.body.password];
        let userInfo = await User.findOne({
            $or: [
                { username: user },
                { email: user },
                { phone: user }
            ]
        });

        if (!userInfo) {
            return next(new ServerError(
                'INVALID_USER',
                `User ${user} is invalid`,
                HttpStatus.Unauthorized
            ));
        }

        let isPasswordMatch = await userInfo.comparePassword(password);
        if (!isPasswordMatch) {
            return next(new ServerError(
                'INVALID_PASSWORD',
                'Invalid password',
                HttpStatus.Unauthorized
            ));
        }

        const token = jwt.sign(
            _.omit(userInfo.toJSON(), ['password', 'profile']),
            fs.readFileSync(getPrivateKey()),
            {
                algorithm: 'RS256',
                issuer: 'duylam',
                audience: 'duylam',
                expiresIn: 3600
            }
        );

        if (!token) {
            return next(new ServerError(
                'SERVER_ERROR',
                'Error on creating token',
                HttpStatus.InternalServerError
            ));
        }

        return res.send(token);
    }
)

export default AuthController;