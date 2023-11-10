import { Request, Response, NextFunction } from "express";
import { CatchAsyncError } from "./catchAsyncErrors"
import ErrorHandler from "../utils/ErrorHandler";
import jwt, { JwtPayload } from 'jsonwebtoken';
import { redis } from "../utils/redis"


// Protect routes
export const isAuthenticated = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  const access_token = req.cookies.access_token;

  // Not Logged in
  if (!access_token) {
    return next(new ErrorHandler('Login first to access this resource.', 400));
  }

  const decoded = jwt.verify(access_token, process.env.ACCESS_TOKEN as string) as JwtPayload;

  if (!decoded) {
    return next(new ErrorHandler('access token is not valid', 400));
  }

  // data is stored in redis cache
  const user = await redis.get(decoded.id);

  //user not found
  if (!user) {
    return next(new ErrorHandler('User not found', 404));
  }

  // @ts-ignore
  req.user = JSON.parse(user);

  next();

});


// Authorize roles
export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user?.role || '')) {
      return next(new ErrorHandler(`Role (${req.user?.role}) is not allowed to access this resource.`, 403));
    }
    next();
  };
};
