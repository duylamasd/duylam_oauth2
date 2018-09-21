import path from 'path';

/**
 * Get the private key file path.
 */
export const getPrivateKey = () => {
    let rootDir = path.dirname(process.cwd());
    let main = require.main;
    if (main) {
        rootDir = path.join(path.dirname(main.filename), '../');
    }
    return path.join(rootDir, '/cert/private.pem');
}

/**
 * Get the public key file path.
 */
export const getPublicKey = () => {
    let rootDir = path.dirname(process.cwd());
    let main = require.main;
    if (main) {
        rootDir = path.join(path.dirname(main.filename), '../');
    }
    return path.join(rootDir, '/cert/public.pem');
}