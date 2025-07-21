/**
 * @fileoverview Authentication middleware
 * @author YosShor
 * @version 1.0.0
 * 
 * Provides authentication and authorization middleware for protected routes.
 * Includes JWT token verification, role-based access control, and rate limiting.
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import User, { IUser } from '../models/User';

/**
 * Extended Request interface to include authenticated user
 */
export interface IAuthRequest extends Request {
  user?: IUser;
  userId?: string;
}

/**
 * JWT Payload interface
 */
interface IJWTPayload {
  id: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

/**
 * Authentication middleware - verifies JWT tokens
 * 
 * Extracts JWT token from Authorization header and verifies its validity.
 * Attaches the authenticated user to the request object.
 * 
 * @param req - Express request object
 * @param res - Express response object  
 * @param next - Next function
 * 
 * @example
 * router.get('/profile', authenticateToken, async (req: IAuthRequest, res) => {
 *   const user = req.user; // Authenticated user is available
 * });
 */
export const authenticateToken = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Access token is required',
      });
      return;
    }

    // Verify JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET environment variable is not set');
      res.status(500).json({
        success: false,
        error: 'Server configuration error',
      });
      return;
    }

    // Decode and verify token
    const decoded = jwt.verify(token, jwtSecret) as IJWTPayload;
    
    // Find user by ID from token
    const user = await User.findById(decoded.id).select('+password');
    
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Invalid token - user not found',
      });
      return;
    }

    // Check if user is active
    if (!user.isActive) {
      res.status(401).json({
        success: false,
        error: 'Account has been deactivated',
      });
      return;
    }

    // Attach user to request object
    req.user = user;
    req.userId = user._id.toString();
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: 'Invalid token',
      });
      return;
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: 'Token has expired',
      });
      return;
    }
    
    res.status(500).json({
      success: false,
      error: 'Authentication failed',
    });
  }
};

/**
 * Role-based authorization middleware
 * 
 * Checks if the authenticated user has the required role.
 * Must be used after authenticateToken middleware.
 * 
 * @param roles - Array of allowed roles or single role string
 * @returns Middleware function
 * 
 * @example
 * router.delete('/user/:id', authenticateToken, authorize(['admin']), deleteUser);
 * router.get('/dashboard', authenticateToken, authorize('admin'), getDashboard);
 */
export const authorize = (roles: string[] | string) => {
  return (req: IAuthRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      const userRole = req.user.role;
      const allowedRoles = Array.isArray(roles) ? roles : [roles];
      
      if (!allowedRoles.includes(userRole)) {
        res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Authorization error:', error);
      res.status(500).json({
        success: false,
        error: 'Authorization failed',
      });
    }
  };
};

/**
 * Rate limiting middleware for authentication routes
 * 
 * Applies stricter rate limiting to authentication endpoints to prevent
 * brute force attacks and abuse.
 * 
 * @example
 * router.post('/login', rateLimitAuth, login);
 * router.post('/register', rateLimitAuth, register);
 */
export const rateLimitAuth = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs for auth endpoints
  message: {
    success: false,
    error: 'Too many authentication attempts. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for successful requests
  skipSuccessfulRequests: true,
});

/**
 * Rate limiting middleware for general API routes
 * 
 * Applies general rate limiting to protect against abuse while allowing
 * normal usage patterns.
 */
export const rateLimitGeneral = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiting middleware for password reset routes
 * 
 * Very restrictive rate limiting for password reset to prevent abuse.
 */
export const rateLimitPasswordReset = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset requests per hour
  message: {
    success: false,
    error: 'Too many password reset attempts. Please try again in an hour.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Optional authentication middleware
 * 
 * Similar to authenticateToken but doesn't fail if no token is provided.
 * Useful for routes that work for both authenticated and anonymous users.
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Next function
 * 
 * @example
 * router.get('/posts', optionalAuth, getPosts); // Works for both auth and anon users
 */
export const optionalAuth = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      // No token provided, continue without authentication
      next();
      return;
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      next();
      return;
    }

    try {
      const decoded = jwt.verify(token, jwtSecret) as IJWTPayload;
      const user = await User.findById(decoded.id).select('+password');
      
      if (user && user.isActive) {
        req.user = user;
        req.userId = user._id.toString();
      }
    } catch (error) {
      // Invalid token, but we don't fail - just continue without authentication
      console.warn('Optional auth failed:', error);
    }

    next();
  } catch (error) {
    console.error('Optional authentication error:', error);
    next(); // Don't fail, just continue
  }
};

/**
 * Generate JWT token for user
 * 
 * Utility function to generate a JWT token for a user.
 * Used in authentication routes after successful login/registration.
 * 
 * @param user - User document
 * @returns string - JWT token
 * 
 * @example
 * const token = generateToken(user);
 * res.json({ success: true, token, user });
 */
export const generateToken = (user: IUser): string => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  const payload = {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, jwtSecret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  } as jwt.SignOptions);
};

/**
 * Verify refresh token
 * 
 * Verifies a refresh token and returns the user ID if valid.
 * Used in token refresh endpoints.
 * 
 * @param refreshToken - Refresh token to verify
 * @returns Promise<string | null> - User ID or null if invalid
 */
export const verifyRefreshToken = async (refreshToken: string): Promise<string | null> => {
  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return null;
    }

    const decoded = jwt.verify(refreshToken, jwtSecret) as IJWTPayload;
    
    // Additional validation - check if user still exists and is active
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return null;
    }

    return decoded.id;
  } catch (error) {
    console.error('Refresh token verification failed:', error);
    return null;
  }
};

/**
 * Legacy alias for backward compatibility
 * 
 * @deprecated Use authenticateToken instead
 */
export const authenticate = authenticateToken;

/**
 * Role-based middleware factory
 * 
 * Creates middleware that checks if user has required role.
 * 
 * @param role - Required role
 * @returns Middleware function
 */
export const requireRole = (role: string) => {
  return authorize([role]);
};

/**
 * Check app ownership middleware
 * 
 * Verifies that the authenticated user owns the specified app.
 * Must be used after authenticateToken middleware.
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Next function
 */
export const checkAppOwnership = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const appId = req.params.appId;
    if (!appId) {
      res.status(400).json({
        success: false,
        error: 'App ID is required',
      });
      return;
    }

    // Admin users can access any app
    if (req.user.role === 'admin') {
      next();
      return;
    }

    // Import App model here to avoid circular dependencies
    const { default: App } = await import('../models/App');
    
    const app = await App.findById(appId);
    if (!app) {
      res.status(404).json({
        success: false,
        error: 'App not found',
      });
      return;
    }

    if (app.userId.toString() !== req.user._id.toString()) {
      res.status(403).json({
        success: false,
        error: 'You can only access your own apps',
      });
      return;
    }

    next();
  } catch (error) {
    console.error('App ownership check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify app ownership',
    });
  }
}; 
