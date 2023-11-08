import { Request, Response, NextFunction } from 'express';
import ErrorHandler from '../utils/ErrorHandler';

export const ErrorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction) => {

  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Internal server error";

  // invalid mongoDB id
  if (err.name === 'CastError') {
    err = new ErrorHandler(`Resource not found. Invalid: ${err.path}`, 400);
  }
  // Duplicate key error
  if (err.code === 11000) {
    const duplicateKey = Object.keys(err.keyValue)[0];
    err = new ErrorHandler(`Duplicate ${duplicateKey} entered`, 400);
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    err = new ErrorHandler('Invalid or expired token. Please try again.', 400);
  }

  res.status(err.statusCode).json({
    success: false,
    message: err.message
  });
};
