import mongoose, { Document, Model } from 'mongoose';
import bcrypt from 'bcrypt';
import { NextFunction } from 'express';
import { ServerError } from '../utils/errorHandler';
import { HttpStatus } from '../enumtypes';

/**
 * Round for generate salt on hashing password.
 */
const SALT_ROUND: number = 10;

/**
 * Name of the model.
 */
const MODEL_NAME: string = "User";

/**
 * Name of the collection in database.
 */
const COLLECTION_NAME: string = "Users";

/**
 * Compare password funcction type declaration.
 */
type comparePasswordFunction = (candidatePassword: string) => Promise<boolean>;

/**
 * UserModel data type.
 */
export type UserModel = Document & {
    username: String,
    email: String,
    phone: String,
    password: String,
    profile: {
        firstname: String,
        lastname: String,
        gender: String,
        address: String,
        picture?: String
    }
};

/**
 * UserModel Interface
 */
export interface IUserModel extends Document {
    username: String;
    email: String;
    phone: String;
    password: String;
    profile: {
        firstname: String;
        lastname: String;
        gender: String;
        address: String;
        picture?: String;
    };

    comparePassword: comparePasswordFunction;
};

/**
 * User schema
 */
var UserSchema = new mongoose.Schema({
    username: { type: String, unique: true },
    email: { type: String, unique: true },
    phone: { type: String, unique: true },
    password: String,
    profile: {
        firstname: String,
        lastname: String,
        gender: { type: String, enum: ['Male', 'Female'], default: 'Male' },
        address: String,
        picture: { type: String, undefined: true }
    }
}, { timestamps: true, versionKey: false });

/**
 * Password hash
 */
UserSchema.pre('save', async function save(next: NextFunction) {
    const user: UserModel = this as UserModel;
    if (!user.isModified('password')) { return next(); }
    let hashedPassword = await bcrypt.hash(user.password, SALT_ROUND).catch(() => undefined);
    if (hashedPassword) {
        user.password = hashedPassword;
        return next();
    }

    return next(new ServerError(
        'SAVE_PASSWORD_FAILED',
        'Failed while saving password',
        HttpStatus.InternalServerError
    ));
});

/**
 * Compare password function.
 */
UserSchema.methods.comparePassword = async function (candidatePassword: string) {
    return await bcrypt.compare(candidatePassword, this.password);
};

/**
 * User model.
 */
const User: Model<IUserModel> = mongoose.model<IUserModel>(MODEL_NAME, UserSchema, COLLECTION_NAME);
export default User;