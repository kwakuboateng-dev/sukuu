import 'dotenv/config'; // This is the same as import dotenv from 'dotenv'; dotenv.config();
import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { ErrorMiddleware } from './middleware/error';

export const app = express();


// Body parsing Middleware
app.use(express.json({ limit: '50mb' }));

// Cookie parsing Middleware
app.use(cookieParser());

// Cors Middleware
app.use(cors(
  {
    origin: process.env.ORIGIN || 'http://localhost:3000'
  }
));


// Test route
app.get('/test', (req: Request, res: Response, next: NextFunction) => {
  res.status(200).json({
    message: 'API is working!'
  });
});

// Unknown routes Middleware
app.all('*', (req: Request, res: Response, next: NextFunction) => {
  const err = new Error(`Route ${req.originalUrl} not found`) as any;
  err.statusCode = 404;
  next(err);
});


// Error Middleware
app.use(ErrorMiddleware);