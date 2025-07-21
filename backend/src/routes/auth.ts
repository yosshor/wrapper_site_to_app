/**
 * @fileoverview Authentication routes for Mobile App Generator Backend
 * @author YosShor  
 * @version 1.0.0
 * 
 * Handles user registration, login, profile management, password reset,
 * and token verification endpoints with rate limiting and validation.
 */

import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { authenticateToken, rateLimitAuth, IAuthRequest } from '../middleware/auth';

const router = Router();

/**
 * POST /api/auth/register
 * Create a new user account
 * @param {Object} req.body - Registration data
 * @param {string} req.body.email - User email
 * @param {string} req.body.password - User password
 * @param {string} req.body.firstName - User first name
 * @param {string} req.body.lastName - User last name
 */
router.post('/register', rateLimitAuth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      res.status(400).json({
        success: false,
        error: 'All fields are required: email, password, firstName, lastName'
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
      return;
    }

    // Validate password strength
    if (password.length < 6) {
      res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long'
      });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(409).json({
        success: false,
        error: 'User with this email already exists'
      });
      return;
    }

    // Create new user
    const user = new User({
      email: email.toLowerCase(),
      password,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      role: 'user',
      isActive: true,
      isEmailVerified: false
    });

    await user.save();

    // Generate JWT token
    const token = user.generateAuthToken();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isEmailVerified: user.isEmailVerified
        },
        token
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token
 * @param {Object} req.body - Login data
 * @param {string} req.body.email - User email
 * @param {string} req.body.password - User password
 */
router.post('/login', rateLimitAuth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;
    console.log('Login request', email, password);
    // Validate required fields
    if (!email || !password) {
      console.log('Email and password are required', email, password);
      res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
      return;
    }

    // Find user by email and explicitly select password field
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      console.log('Invalid email or password', user);
      res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
      return;
    }

    // Check if user is active
    if (!user.isActive) {
      console.log('Account has been deactivated', user);
      res.status(401).json({
        success: false,
        error: 'Account has been deactivated'
      });
      return;
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) { 
      console.log('Invalid email or password', user);
      res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
      return;
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = user.generateAuthToken();
      var userData: any = {success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          lastLogin: user.lastLogin
        },
        token
      }}
      res.status(200).json(userData);
      console.log('Login successful', userData);

  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth/profile
 * Get current user profile
 */
router.get('/profile', authenticateToken, async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
      return;
    }

    const user = req.user;

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/auth/profile
 * Update user profile
 */
router.put('/profile', authenticateToken, async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
      return;
    }

    const { firstName, lastName, email } = req.body;
    const user = req.user;

    // Update fields if provided
    if (firstName) user.firstName = firstName.trim();
    if (lastName) user.lastName = lastName.trim();
    if (email && email !== user.email) {
      // Check if new email is already taken
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        res.status(409).json({
          success: false,
          error: 'Email is already taken'
        });
        return;
      }
      user.email = email.toLowerCase();
      user.isEmailVerified = false; // Require re-verification for new email
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isEmailVerified: user.isEmailVerified
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/change-password
 * Change user password
 */
router.post('/change-password', authenticateToken, async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
      return;
    }

    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validate required fields
    if (!currentPassword || !newPassword || !confirmPassword) {
      res.status(400).json({
        success: false,
        error: 'All fields are required: currentPassword, newPassword, confirmPassword'
      });
      return;
    }

    // Validate new password
    if (newPassword.length < 6) {
      res.status(400).json({
        success: false,
        error: 'New password must be at least 6 characters long'
      });
      return;
    }

    // Validate password confirmation
    if (newPassword !== confirmPassword) {
      res.status(400).json({
        success: false,
        error: 'New password and confirmation do not match'
      });
      return;
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
      return;
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/forgot-password
 * Send password reset email
 */
router.post('/forgot-password', rateLimitAuth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        error: 'Email is required'
      });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't reveal if user exists or not
      res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent'
      });
      return;
    }

    // Generate password reset token
    const resetToken = user.generatePasswordResetToken();
    await user.save();

    // TODO: Send password reset email with resetToken
    console.log(`Password reset token for ${user.email}: ${resetToken}`);

    res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/reset-password
 * Reset password with token
 */
router.post('/reset-password', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    // Validate required fields
    if (!token || !newPassword || !confirmPassword) {
      res.status(400).json({
        success: false,
        error: 'All fields are required: token, newPassword, confirmPassword'
      });
      return;
    }

    // Validate password
    if (newPassword.length < 6) {
      res.status(400).json({
        success: false,
        error: 'New password must be at least 6 characters long'
      });
      return;
    }

    // Validate password confirmation
    if (newPassword !== confirmPassword) {
      res.status(400).json({
        success: false,
        error: 'New password and confirmation do not match'
      });
      return;
    }

    // Find user by reset token
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() }
    }).select('+passwordResetToken +passwordResetExpires');

    if (!user) {
      res.status(400).json({
        success: false,
        error: 'Invalid or expired reset token'
      });
      return;
    }

    // Update password and clear reset token
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/verify-token
 * Verify JWT token validity
 */
router.post('/verify-token', authenticateToken, async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Token is valid',
      data: {
        user: {
          id: req.user._id,
          email: req.user.email,
          role: req.user.role
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

export default router; 
