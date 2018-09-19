import { Router, Request, Response, NextFunction } from 'express';
import { HttpStatus } from '../enumtypes';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import { ServerError } from '../utils/errorHandler';
import { getPrivateKey } from '../utils/certs';
import '../config/passport';
import User, { IUserModel } from '../models/user';

/**
 * User controller's router
 */
var router: Router = Router();

/**
 * Signin method
 */
router.post(
    '/signin',
    (req: Request, res: Response, next: NextFunction) => {
        passport.authenticate(
            'local',
            { session: false },
            (
                error?: ServerError,
                user?: any,
                info?: any
            ) => {
                if (error) {
                    return next(error);
                }

                if (!user) {
                    return next(new ServerError(
                        'NO_USER',
                        'User does not exist',
                        HttpStatus.BadRequest
                    ));
                }

                req.logIn(user, {session: false}, (error) => {
                    if (error) {
                        return next(error);
                    }         

                    const token = jwt.sign(
                        user,
                        fs.readFileSync(getPrivateKey()),
                        {
                            algorithm: 'RS256',
                            issuer: 'duylam',
                            audience: 'duylam'
                        }
                    );

                    return res.json({user, token});
                })
            }
        )(req, res, next);
    }
);

/**
 * Create new user
 */
router.post(
    '/',
    async (req: Request, res: Response, next: NextFunction) => {
        let user = await User.create(req.body);
        if (!user) {
            return next(new ServerError(
                'CREATE_FAILED',
                'Can not create this user',
                HttpStatus.InternalServerError
            ));
        }

        res.send(HttpStatus.Created);
    }
)

/**
 * User controller
 */
const UserController: Router = router;
export default UserController;