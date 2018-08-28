/**
 * List of HTTP status codes
 */
export enum HttpStatus {   
    //#region Success

    /**
     * Standard response for successful HTTP requests.
     * The actual response will depend on the request method used.
     * In a GET request, the response will contain an entity corresponding to the requested resource.
     * In a POST request, the response will contain an entity describing or containing the result of the action
     */
    OK = 200,

    /**
     * The request has been fulfilled, resulting in the creation of a new resource
     */
    Created = 201,

    /**
     * The server successfully processed the request and is not returning any content
     */
    NoContent = 204,
    
    //#endregion

    //#region Client errors

    /**
     * The server cannot or will not process the request due to an apparent client error
     */
    BadRequest = 400,

    /**
     * Similar to 403 Forbidden, but specifically for use when authentication is required and has failed or has not yet been provided
     */
    Unauthorized = 401,

    /**
     * Reserved for future use.
     * The original intention was that this code might be used as part of some form of digital cash or micropayment scheme
     */
    PaymentRequired = 402,

    /**
     * The request was valid, but the server is refusing action.
     * The user might not have the necessary permissions for a resource, or may need an account of some sort.
     */
    Forbidden = 403,

    /**
     * The requested resource could not be found but may be available in the future.
     * Subsequent requests by the client are permissible.
     */
    NotFound = 404,

    //#endregion
    
    //#region Server errors

    /**
     * A generic error message, given when an unexpected condition was encountered and no more specific message is suitable.
     */
    InternalServerError = 500

    //#endregion
}