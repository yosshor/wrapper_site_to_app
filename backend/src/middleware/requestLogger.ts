/**
 * @fileoverview Request logging middleware
 * @author YosShor
 * @version 1.0.0
 * 
 * Custom request logging middleware that provides detailed request/response logging
 * with timing, IP tracking, and error handling.
 */

import { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';

/**
 * Custom request logger middleware
 * 
 * Logs HTTP requests with additional context like user agents, response times,
 * and request IDs for better debugging and monitoring.
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Next function
 * 
 * @example
 * app.use(requestLogger);
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  
  // Add request ID for tracing
  const requestId = Math.random().toString(36).substring(2, 15);
  req.headers['x-request-id'] = requestId;
  
  // Log request start
  if (process.env.NODE_ENV !== 'production') {
    console.log(`🔄 [${requestId}] ${req.method} ${req.originalUrl} - Start`);
  }

  // Override res.end to log response
  const originalEnd = res.end;
  res.end =   function(chunk?: any, encoding?: any): Response<any> {
    const endTime = Date.now();
    const duration = endTime - startTime;
    const statusColor = getStatusColor(res.statusCode);
    
    if (process.env.NODE_ENV !== 'production') {
      console.log(
        `✅ [${requestId}] ${req.method} ${req.originalUrl} - ${statusColor}${res.statusCode}\x1b[0m - ${duration}ms`
      );
    }

    // Call the original res.end with the correct context and arguments
    // 'this' is explicitly typed as Response to avoid implicit 'any' error
    return originalEnd.call(this as Response, chunk, encoding);
  };

  next();
};

/**
 * Get color code for HTTP status codes
 * 
 * @param statusCode - HTTP status code
 * @returns ANSI color code string
 */
function getStatusColor(statusCode: number): string {
  if (statusCode >= 500) return '\x1b[31m'; // Red for server errors
  if (statusCode >= 400) return '\x1b[33m'; // Yellow for client errors
  if (statusCode >= 300) return '\x1b[36m'; // Cyan for redirects
  if (statusCode >= 200) return '\x1b[32m'; // Green for success
  return '\x1b[0m'; // Default color
}

/**
 * Morgan logger configuration for different environments
 */
export const morganLogger = morgan(
  process.env.NODE_ENV === 'production' 
    ? 'combined' 
    : ':method :url :status :res[content-length] - :response-time ms'
);

/**
 * Error logging middleware
 * 
 * Logs errors that occur during request processing.
 * 
 * @param error - Error object
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Next function
 */
export const errorLogger = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const requestId = req.headers['x-request-id'] as string;
  
  console.error(`❌ [${requestId}] Error in ${req.method} ${req.originalUrl}:`, {
    error: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    body: req.body,
    query: req.query,
    params: req.params,
    userAgent: req.get('user-agent'),
    ip: req.ip,
  });
  
  next(error);
}; 
