/**
 * @fileoverview Global error handling middleware for Express application
 * @author YosShor
 * @version 1.0.0
 * @description Centralized error handling with logging and user-friendly responses
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Custom Error interface for structured error handling
 */
interface CustomError extends Error {
  statusCode?: number;
  code?: string | number;
  path?: string;
  value?: any;
  keyValue?: Record<string, any>;
  errors?: Record<string, any>;
}

/**
 * Global error handling middleware
 * 
 * Handles various types of errors including:
 * - MongoDB validation errors
 * - Duplicate key errors  
 * - Cast errors
 * - JWT errors
 * - Custom application errors
 * 
 * @param {CustomError} err - Error object
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error = { ...err };
  error.message = err.message;

  // Log error for debugging
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });

  // MongoDB bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Invalid ID format';
    error = { name: 'CastError', message, statusCode: 400 } as CustomError;
  }

  // MongoDB duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];
    const message = field ? `${field} already exists` : 'Duplicate field value';
    error = { name: 'DuplicateError', message, statusCode: 409 } as CustomError;
  }

  // MongoDB validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors || {})
      .map((val: any) => val.message)
      .join(', ');
    error = { name: 'ValidationError', message, statusCode: 400 } as CustomError;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { name: 'JsonWebTokenError', message, statusCode: 401 } as CustomError;
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { name: 'TokenExpiredError', message, statusCode: 401 } as CustomError;
  }

  // Default error response
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack,
        details: error
      })
    }
  });
};

/**
 * 404 Not Found handler
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: {
      message: `Route ${req.originalUrl} not found`
    }
  });
};

/**
 * Async error wrapper for route handlers
 * Automatically catches async errors and passes them to error middleware
 * 
 * @param {Function} fn - Async route handler function
 * @returns {Function} Wrapped route handler
 */
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) =>
  Promise.resolve(fn(req, res, next)).catch(next); 
