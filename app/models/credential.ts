import mongoose, { Document, Model } from 'mongoose';
import { ObjectId } from 'bson';

/**
 * Name of the model.
 */
const MODEL_NAME: string = "Credential";

/**
 * Name of the collection in database.
 */
const COLLECTION_NAME: string = "Credentials";

/**
 * Credential model data type
 */
export type CredentialModel = Document & {
    userId: ObjectId,
    credentialType: String,
    secret: String,
    scopes?: String[],
    expireTime: Date
};

/**
 * Credential interface
 */
export interface ICredentialModel extends Document {
    userId: ObjectId,
    credentialType: String,
    secret: String,
    scopes?: String[],
    expireTime: Date,

    isExpired: () => Promise<boolean>
};

/**
 * Credential schema
 */
var CredentialSchema = new mongoose.Schema({
    userId: String,
    credentialType: {
        type: String,
        enum: ['apikey', 'app'],
        default: 'apikey'
    },
    secret: String,
    scopes: { type: Array(String), undefined: true },
    expireTime: Date
}, { versionKey: false, timestamps: true });

/**
 * Check whether credential is valid by expire time 
 */
CredentialSchema.methods.isExpired = async function () {
    let now = new Date().getTime();
    let expireTime = new Date(this.expireTime).getTime();

    return now < expireTime;
};

/**
 * Credential model
 */
const Credential: Model<ICredentialModel> = mongoose.model<ICredentialModel>(MODEL_NAME, CredentialSchema, COLLECTION_NAME);
export default Credential;