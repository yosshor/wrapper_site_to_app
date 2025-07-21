/**
 * @fileoverview User model for MongoDB
 * @author YosShor
 * @version 1.0.0
 * 
 * Defines the User schema and model for authentication and user management.
 * Includes password hashing, validation, and instance methods.
 */

import mongoose, { Document, Schema } from 'mongoose';
import bcryptjs from 'bcryptjs';

/**
 * User Interface
 * 
 * Defines the structure of a User document in MongoDB.
 */
export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'admin';
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  lastLogin?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  getFullName(): string;
  generatePasswordResetToken(): string;
  generateEmailVerificationToken(): string;
  generateAuthToken(): string;
}

/**
 * User Schema Definition
 * 
 * Defines validation rules, indexes, and middleware for the User model.
 */
const UserSchema: Schema<IUser> = new Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      'Please provide a valid email address'
    ],
    index: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false, // Don't include password in query results by default
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters'],
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters'],
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
    index: true,
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
    index: true,
  },
  emailVerificationToken: {
    type: String,
    select: false,
  },
  passwordResetToken: {
    type: String,
    select: false,
  },
  passwordResetExpires: {
    type: Date,
    select: false,
  },
  lastLogin: {
    type: Date,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt
  collection: 'users',
});

/**
 * Indexes for better query performance
 */
UserSchema.index({ email: 1, isActive: 1 });
UserSchema.index({ role: 1, isActive: 1 });
UserSchema.index({ createdAt: -1 });

/**
 * Pre-save middleware to hash password
 * 
 * Automatically hashes the password before saving to database
 * if the password field has been modified.
 */
UserSchema.pre<IUser>('save', async function(next) {
  try {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) {
      return next();
    }

    // Generate salt and hash the password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
    const salt = await bcryptjs.genSalt(saltRounds);
    const hashedPassword = await bcryptjs.hash(this.password, salt);
    
    // Replace the plain text password with the hashed one
    this.password = hashedPassword;
    next();
  } catch (error) {
    next(error as Error);
  }
});

/**
 * Instance method to compare passwords
 * 
 * Compares a plain text password with the hashed password stored in database.
 * 
 * @param candidatePassword - Plain text password to compare
 * @returns Promise<boolean> - True if passwords match
 * 
 * @example
 * const isMatch = await user.comparePassword('mypassword');
 * if (isMatch) {
 *   // Password is correct
 * }
 */
UserSchema.methods.comparePassword = async function(
  candidatePassword: string
): Promise<boolean> {
  try {
    return await bcryptjs.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Error comparing passwords');
  }
};

/**
 * Instance method to get full name
 * 
 * @returns string - Full name of the user
 * 
 * @example
 * const fullName = user.getFullName(); // "John Doe"
 */
UserSchema.methods.getFullName = function(): string {
  return `${this.firstName} ${this.lastName}`.trim();
};

/**
 * Instance method to generate password reset token
 * 
 * Generates a secure random token for password reset functionality.
 * 
 * @returns string - Password reset token
 * 
 * @example
 * const token = user.generatePasswordResetToken();
 * user.passwordResetToken = token;
 * user.passwordResetExpires = new Date(Date.now() + 3600000); // 1 hour
 * await user.save();
 */
UserSchema.methods.generatePasswordResetToken = function(): string {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  
  // Set token and expiration (1 hour from now)
  this.passwordResetToken = token;
  this.passwordResetExpires = new Date(Date.now() + 3600000); // 1 hour
  
  return token;
};

/**
 * Instance method to generate email verification token
 * 
 * Generates a secure random token for email verification.
 * 
 * @returns string - Email verification token
 * 
 * @example
 * const token = user.generateEmailVerificationToken();
 * user.emailVerificationToken = token;
 * await user.save();
 */
UserSchema.methods.generateEmailVerificationToken = function(): string {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  
  this.emailVerificationToken = token;
  return token;
};

/**
 * Instance method to generate JWT authentication token
 * 
 * Generates a JWT token for user authentication.
 * 
 * @returns string - JWT authentication token
 * 
 * @example
 * const token = user.generateAuthToken();
 */
UserSchema.methods.generateAuthToken = function(): string {
  const jwt = require('jsonwebtoken');
  const jwtSecret = process.env.JWT_SECRET;
  
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  const payload = {
    id: this._id.toString(),
    email: this.email,
    role: this.role,
  };

  return jwt.sign(payload, jwtSecret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  } as any);
};

/**
 * Static method to find user by email
 * 
 * @param email - Email address to search for
 * @returns Promise<IUser | null> - User document or null
 * 
 * @example
 * const user = await User.findByEmail('user@example.com');
 */
UserSchema.statics.findByEmail = function(email: string) {
  return this.findOne({ email: email.toLowerCase(), isActive: true });
};

/**
 * Static method to find active users
 * 
 * @returns Promise<IUser[]> - Array of active user documents
 */
UserSchema.statics.findActive = function() {
  return this.find({ isActive: true }).select('-password');
};

/**
 * Transform the output when converting to JSON
 * 
 * Removes sensitive fields and transforms _id to id for client consumption.
 */
UserSchema.set('toJSON', {
  transform: function(doc: any, ret: any, options: any) {
    // Transform _id to id
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    
    // Remove sensitive fields
    if (ret.password !== undefined) delete ret.password;
    if (ret.emailVerificationToken !== undefined) delete ret.emailVerificationToken;
    if (ret.passwordResetToken !== undefined) delete ret.passwordResetToken;
    if (ret.passwordResetExpires !== undefined) delete ret.passwordResetExpires;
    
    return ret;
  }
});

/**
 * Transform the output when converting to Object
 */
UserSchema.set('toObject', {
  transform: function(doc: any, ret: any, options: any) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    
    // Remove sensitive fields
    if (ret.password !== undefined) delete ret.password;
    if (ret.emailVerificationToken !== undefined) delete ret.emailVerificationToken;
    if (ret.passwordResetToken !== undefined) delete ret.passwordResetToken;
    if (ret.passwordResetExpires !== undefined) delete ret.passwordResetExpires;
    
    return ret;
  }
});

/**
 * User Model
 * 
 * Export the User model for use in other parts of the application.
 */
const User = mongoose.model<IUser>('User', UserSchema);

export default User;
export { User }; 
