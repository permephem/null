import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  logger.error({
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    statusCode
  });

  res.status(statusCode).json({
    error: {
      message,
      statusCode,
      ...(process.env['NODE_ENV'] === 'development' && { stack: err.stack })
    }
  });
};

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    error: {
      message: 'Route not found',
      statusCode: 404
    }
  });
};
