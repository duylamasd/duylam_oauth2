import { Request, Response, NextFunction } from 'express';
import { HttpStatus } from '../enumtypes';

/**
 * Server error class
 */
export class ServerError extends Error {
  public status: number;

  /**
   * Server error constructor.
   * @param {string} name Error name
   * @param {string} message Error message
   * @param {number} status Error status
   */
  constructor(name: string, message: string, status?: number) {
    super(message);
    this.name = name;
    this.status = status || HttpStatus.InternalServerError;
  }

  /**
   * Return the error infomation.
   */
  public getErrorInfo() {
    return {
      name: this.name,
      status: this.status,
      message: this.message
    };
  }
}

/**
 * Error handler function.
 * @param {any} error The error payload
 * @param {Request} req The request, which cause the error
 * @param {Response} res The response
 * @param {NextFunction} next Next function.
 */
const errorHandler = async (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (error instanceof ServerError) {
    return res.status(error.status).json(error.getErrorInfo());
  }

  if (error instanceof SyntaxError) {
    return res.status(HttpStatus.BadRequest).json({
      name: 'Syntax error',
      status: HttpStatus.BadRequest,
      message: error.message || 'Syntax error'
    });
  }

  return res.status(error.statusCode || error.status || HttpStatus.InternalServerError).json({
    name: 'Unhandled',
    status: error.statusCode || error.status || HttpStatus.InternalServerError,
    message: error.message || 'Unhandled error'
  });
}

export default errorHandler;
