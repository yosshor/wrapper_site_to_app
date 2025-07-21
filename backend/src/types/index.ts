/**
 * @fileoverview Type definitions for Mobile App Generator Backend
 * @author YosShor
 * @version 1.0.0
 * 
 * Central location for all TypeScript interfaces and type definitions
 * used throughout the backend application.
 */

import { Request } from 'express';
import { Document } from 'mongoose';
import { IUser } from '../models/User';

/**
 * Extended Request interface with authenticated user
 * Used in protected routes that require authentication
 * 
 * @interface IAuthRequest
 * @extends Request
 */
export interface IAuthRequest extends Request {
  user?: IUser;
  userId?: string;
  appInstance?: any; // App model instance (avoid circular dependency with Express.Request.app)
}

/**
 * JWT Token Payload structure
 * 
 * @interface IJWTPayload
 */
export interface IJWTPayload {
  id: string;
  email: string;
  role: 'user' | 'admin';
  iat: number;
  exp: number;
}

/**
 * API Response structure for consistent responses
 * 
 * @interface IApiResponse
 */
export interface IApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: string[];
  pagination?: IPagination;
  meta?: Record<string, any>;
}

/**
 * Pagination information structure
 * 
 * @interface IPagination
 */
export interface IPagination {
  current: number;
  total: number;
  pages: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Query parameters for listing/filtering
 * 
 * @interface IQueryParams
 */
export interface IQueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
  filter?: Record<string, any>;
}

/**
 * User registration data
 * 
 * @interface IUserRegistration
 */
export interface IUserRegistration {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

/**
 * User login credentials
 * 
 * @interface IUserLogin
 */
export interface IUserLogin {
  email: string;
  password: string;
}

/**
 * User profile update data
 * 
 * @interface IUserProfileUpdate
 */
export interface IUserProfileUpdate {
  firstName?: string;
  lastName?: string;
  email?: string;
}

/**
 * Password change data
 * 
 * @interface IPasswordChange
 */
export interface IPasswordChange {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Password reset request
 * 
 * @interface IPasswordResetRequest
 */
export interface IPasswordResetRequest {
  email: string;
}

/**
 * Password reset data
 * 
 * @interface IPasswordReset
 */
export interface IPasswordReset {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * App configuration structure
 * 
 * @interface IAppConfig
 */
export interface IAppConfig {
  name: string;
  description?: string;
  websiteUrl: string;
  androidPackageId: string;
  iosPackageId: string;
  
  // Firebase configuration
  firebaseEnabled: boolean;
  firebaseConfig?: {
    analyticsEnabled: boolean;
    crashlyticsEnabled: boolean;
    messagingEnabled: boolean;
  };
  
  // AppsFlyer configuration
  appsflyerEnabled: boolean;
  appsflyerConfig?: {
    devKey: string;
    appId?: string;
  };
  
  // Features
  features: {
    offlineMode: boolean;
    pushNotifications: boolean;
    deepLinking: boolean;
    biometricAuth: boolean;
  };
  
  // Styling
  styling: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    logoUrl?: string;
  };
  
  // Build settings
  buildSettings: {
    targetSdkVersion: number;
    minSdkVersion: number;
    permissions: string[];
    orientation: 'portrait' | 'landscape' | 'both';
  };
}

/**
 * App document structure (extends Mongoose Document)
 * 
 * @interface IApp
 */
export interface IApp extends Document {
  _id: string;
  userId: string;
  name: string;
  description?: string;
  websiteUrl: string;
  androidPackageId: string;
  iosPackageId: string;
  
  config: IAppConfig;
  
  // Status and metadata
  status: 'draft' | 'active' | 'paused' | 'archived';
  isPublic: boolean;
  
  // Build information
  lastBuildDate?: Date;
  totalBuilds: number;
  
  // Analytics
  totalDownloads: number;
  totalInstalls: number;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Build configuration and request structure
 * 
 * @interface IBuildRequest
 */
export interface IBuildRequest {
  appId: string;
  platform: 'android' | 'ios';
  buildType: 'debug' | 'release';
  version?: string;
  buildNumber?: number;
  
  // Custom assets
  customIcon?: Express.Multer.File;
  customSplashScreen?: Express.Multer.File;
  customAssets?: Express.Multer.File[];
  
  // Build options
  options?: {
    minifyCode: boolean;
    obfuscateCode: boolean;
    generateSourceMap: boolean;
    enableDebugging: boolean;
  };
}

/**
 * Build document structure
 * 
 * @interface IBuild
 */
export interface IBuild extends Document {
  _id: string;
  appId: string;
  userId: string;
  
  platform: 'android' | 'ios';
  buildType: 'debug' | 'release';
  version: string;
  buildNumber: number;
  
  // Status tracking
  status: 'pending' | 'building' | 'completed' | 'failed' | 'cancelled';
  progress: number; // 0-100
  
  // Build metadata
  buildStartTime?: Date;
  buildEndTime?: Date;
  buildDuration?: number; // seconds
  
  // Assets and outputs
  artifactUrl?: string;
  artifactSize?: number; // bytes
  buildLogUrl?: string;
  
  // Error information
  errorMessage?: string;
  errorDetails?: Record<string, any>;
  
  // Configuration snapshot
  configSnapshot: IAppConfig;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Lead capture data structure
 * 
 * @interface ILead
 */
export interface ILead extends Document {
  _id: string;
  appId: string;
  userId: string;
  data: Record<string, any>;
  dataAnonymized: boolean;
  sessionId: string;
  campaignSource: string;
  campaignMedium: string;
  campaignName: string;

  // Lead information
  email?: string;
  name?: string;
  phone?: string;
  company?: string;
  message?: string;
  
  // Custom fields
  customFields: Record<string, any>;
  
  // Tracking information
  source: string; // 'app_launch' | 'form_submission' | 'contact_us'
  userAgent?: string;
  ipAddress?: string;
  location?: {
    country?: string;
    region?: string;
    city?: string;
  };
  
  // Device information
  deviceInfo?: {
    platform: 'android' | 'ios';
    version: string;
    model?: string;
    manufacturer?: string;
  };
  
  // Processing status
  processed: boolean;
  processedAt?: Date;
  exportedToSheets: boolean;
  exportedAt?: Date;

  // Anonymization
  anonymized: boolean;
  anonymizedAt?: Date;
  anonymizedBy?: string;
  anonymizedReason?: string;
  anonymizedData?: Record<string, any>;

  // UTM parameters
  utmParameters?: Record<string, string>;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;


}

/**
 * Dashboard statistics structure
 * 
 * @interface IDashboardStats
 */
export interface IDashboardStats {
  overview: {
    totalApps: number;
    totalBuilds: number;
    totalLeads: number;
    totalUsers: number;
    totalDownloads: number;
  };
  
  recent: {
    recentBuilds: IBuild[];
    recentLeads: ILead[];
    recentUsers: IUser[];
  };
  
  analytics: {
    buildsPerDay: Array<{ date: string; count: number }>;
    leadsPerDay: Array<{ date: string; count: number }>;
    platformDistribution: Array<{ platform: string; count: number }>;
    topApps: Array<{ appName: string; builds: number; downloads: number }>;
  };
  
  system: {
    buildQueueLength: number;
    buildQueueActiveJobs: number;
    systemHealth: 'healthy' | 'warning' | 'critical';
    uptime: number;
  };
}

/**
 * File upload information
 * 
 * @interface IUploadedFile
 */
export interface IUploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  destination: string;
  filename: string;
  path: string;
  size: number;
}

/**
 * Firebase configuration for client
 * 
 * @interface IFirebaseConfig
 */
export interface IFirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

/**
 * Email template data
 * 
 * @interface IEmailTemplate
 */
export interface IEmailTemplate {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
}

/**
 * Notification data structure
 * 
 * @interface INotification
 */
export interface INotification {
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  data?: Record<string, any>;
  createdAt: Date;
}

/**
 * Database connection options
 * 
 * @interface IMongooseOptions
 */
export interface IMongooseOptions {
  useNewUrlParser: boolean;
  useUnifiedTopology: boolean;
  maxPoolSize: number;
  serverSelectionTimeoutMS: number;
  socketTimeoutMS: number;
  family: number;
}

/**
 * Environment configuration structure
 * 
 * @interface IEnvConfig
 */
export interface IEnvConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  
  // Database
  MONGODB_URI: string;
  REDIS_URL?: string;
  
  // Authentication
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  BCRYPT_ROUNDS: number;
  
  // External services
  FIREBASE_PROJECT_ID?: string;
  FIREBASE_PRIVATE_KEY?: string;
  FIREBASE_CLIENT_EMAIL?: string;
  
  GOOGLE_SHEETS_CREDENTIALS_PATH?: string;
  GOOGLE_SHEETS_SPREADSHEET_ID?: string;
  
  APPSFLYER_API_TOKEN?: string;
  
  // Build system
  BUILD_QUEUE_ENABLED: boolean;
  MAX_CONCURRENT_BUILDS: number;
  BUILD_TIMEOUT_MINUTES: number;
  
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
} 
