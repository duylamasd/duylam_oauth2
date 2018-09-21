import { Router, Request, Response, NextFunction } from 'express';
import { HttpStatus } from '../enumtypes';
import { authentication } from '../config/passport';
import { ServerError } from '../utils/errorHandler';
import User from '../models/user';

/**
 * User controller's router
 */
var UserController: Router = Router();

/**
 * Create new user
 */
UserController.post(
    '/',
    async (req: Request, res: Response, next: NextFunction) => {
        let user = await User.create(req.body);

        if (!user) {
            return next(new ServerError(
                'CREATE_USER_FAILED',
                'Can not create this user',
                HttpStatus.InternalServerError
            ));
        }

        return res.sendStatus(HttpStatus.Created);
    }
);

export default UserController;