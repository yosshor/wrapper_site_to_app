/**
 * @fileoverview TypeScript type definitions for Mobile App Generator
 * @author YosShor
 * @version 1.0.0
 */

/**
 * @interface AppFormData
 * @description Interface for app form data
 * @property {string} name - The name of the app
 * @property {string} description - The description of the app
 * @property {string} websiteUrl - The website URL of the app
 * @property {string} packageId - The package ID of the app
 * @property {string} bundleId - The bundle ID of the app
 * @property {boolean} firebase.enabled - Whether Firebase is enabled
 * @property {object} firebase.config - The Firebase configuration
 * @property {string} firebase.config.apiKey - The Firebase API key
 * @property {string} firebase.config.authDomain - The Firebase authentication domain
 * @property {string} firebase.config.projectId - The Firebase project ID
 * @property {string} firebase.config.storageBucket - The Firebase storage bucket
 * @property {boolean} firebase.analytics - Whether Firebase analytics is enabled
 * @property {boolean} firebase.crashlytics - Whether Firebase crashlytics is enabled
 * @property {boolean} firebase.messaging - Whether Firebase messaging is enabled
 * @property {boolean} appsflyer.enabled - Whether Appsflyer is enabled
 * @property {string} appsflyer.devKey - The Appsflyer developer key
 * @property {object} appsflyer.config - The Appsflyer configuration
 * @property {string} appsflyer.config.devKey - The Appsflyer developer key
 * @property {string} appsflyer.config.appId - The Appsflyer app ID
 * @property {boolean} features.leadCapture - Whether lead capture is enabled
 * @property {boolean} features.pushNotifications - Whether push notifications are enabled
 * @property {boolean} features.offlineMode - Whether offline mode is enabled
 * @property {boolean} features.customSplash - Whether custom splash is enabled
 * @property {boolean} features.analytics - Whether analytics is enabled
 */
export interface AppFormData {
  name: string;
  description: string;
  websiteUrl: string;
  packageId: string;
  bundleId: string;
  firebase: {
    enabled: boolean;
    features: {
      analytics: boolean;
      crashlytics: boolean;
      messaging: boolean;
    };
    config: {
      apiKey: string;
      authDomain: string;
      projectId: string;
      storageBucket: string;
      messagingSenderId: string;
      appId: string;
      measurementId: string;
    };
    
  };
  appsflyer: {
    enabled: boolean;
    devKey: string;
    config: {
      devKey: string;
      appId: string;
    };
  };
  features: {
    leadCapture: boolean;
    pushNotifications: boolean;
    offlineMode: boolean;
    customSplash: boolean;
    analytics: boolean;
  };

}

  /**
   * @interface User
   * @description Interface for user data
   * @property {string} id - The ID of the user
   * @property {string} email - The email of the user
   * @property {string} name - The name of the user
   * @property {string} role - The role of the user   
   * @property {string} avatar - The avatar of the user
   * @property {string} createdAt - The date and time the user was created
   * @property {string} updatedAt - The date and time the user was last updated
   */
// User Management Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * @interface App
 * @description Interface for app data
 * @property {string} id - The ID of the app
 * @property {string} userId - The ID of the user who created the app
 * @property {string} name - The name of the app
 * @property {string} packageId - The package ID of the app
 * @property {string} bundleId - The bundle ID of the app
 * @property {string} websiteUrl - The website URL of the app
 * @property {string} description - The description of the app
 * @property {string} appIconUrl - The URL of the app icon
 * @property {string} splashScreenUrl - The URL of the splash screen
 * @property {string} status - The status of the app
 * @property {string} createdAt - The date and time the app was created
 * @property {string} updatedAt - The date and time the app was last updated
 */
// App Generation Types
export interface App {
  _id: string;
  userId: string;
  name: string;
  packageId: string;
  bundleId: string;
  websiteUrl: string;
  description?: string;
  appIconUrl?: string;
  splashScreenUrl?: string;
  status: 'active' | 'inactive' | 'draft' | 'building' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
}

export interface AppConfig {
  appName: string;
  packageId: string;
  bundleId: string;
  websiteUrl: string;
  description?: string;
  appIcon?: File;
  splashScreen?: File;
  platform: 'android' | 'ios' | 'both';
  features: AppFeatures;
}

export interface AppFeatures {
  firebase: {
    enabled: boolean;
    analytics: boolean;
    crashlytics: boolean;
    messaging: boolean;
  };
  appsflyer: {
    enabled: boolean;
    devKey: string;
  };
  leadCapture: {
    enabled: boolean;
    fields: LeadField[];
  };
}

export interface LeadField {
  name: string;
  type: 'text' | 'email' | 'phone' | 'number';
  required: boolean;
  label: string;
}

// Build Management Types
export interface Build {
  id: string;
  appId: string;
  userId: string;
  platform: 'android' | 'ios';
  version: string;
  status: 'pending' | 'building' | 'completed' | 'failed' | 'cancelled';
  downloadUrl?: string;
  errorMessage?: string;
  buildLogs?: string[];
  startedAt: string;
  completedAt?: string;
  createdAt: string;
}

// Lead Management Types
export interface Lead {
  id: string;
  appId: string;
  userId: string;
  data: Record<string, any>;
  source: 'app_launch' | 'form_submission' | 'interaction';
  ipAddress?: string;
  userAgent?: string;
  deviceInfo?: DeviceInfo;
  createdAt: string;
}

export interface DeviceInfo {
  platform: string;
  version: string;
  model: string;
  manufacturer?: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  data: {
    apps: App[];
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Form Types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  password: string;
  name: string;
  confirmPassword: string;
}

export interface AppCreationForm {
  appName: string;
  packageId: string;
  bundleId: string;
  websiteUrl: string;
  description: string;
  platform: 'android' | 'ios' | 'both';
}

// Firebase Types
export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

// Google Sheets Types
export interface GoogleSheetsConfig {
  spreadsheetId: string;
  range: string;
  credentials: {
    clientEmail: string;
    privateKey: string;
  };
}

// Appsflyer Types
export interface AppsflyerConfig {
  devKey: string;
  appId: string;
  isDebug: boolean;
}

// Analytics Types
export interface AnalyticsEvent {
  name: string;
  parameters?: Record<string, any>;
  timestamp: string;
}

// UI Component Types
export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface ToastProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  onClose?: () => void;
}

// Statistics Types
export interface DashboardStats {
  totalUsers: number;
  totalApps: number;
  totalBuilds: number;
  totalLeads: number;
  userGrowth: number;
  appGrowth: number;
  buildGrowth: number;
  leadGrowth: number;
  successfulBuilds: number;
  buildQueue: {
    building: number;
    queued: number;
    completed: number;
    failed: number;
  };
  dailyStats: {
    newUsers: number;
    newApps: number;
    buildsStarted: number;
    leadsCaptured: number;
  };
}

export interface DashboardActivities {
  builds?: Array<{
    id: string;
    status: string;
    platform: string;
    appName: string;
    createdAt: string;
    completedAt?: string;
  }>;
  leads?: Array<{
    id: string;
    email: string;
    name: string;
    phone: string;
    appName: string;
    deviceInfo: any;
    source: string;
    createdAt: string;
  }>;
  users?: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    isEmailVerified: boolean;
    role: string;
    createdAt: string;
  }>;
}

// File Upload Types
export interface FileUpload {
  file: File;
  preview?: string;
  progress?: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  error?: string;
}

// Theme Types
export interface Theme {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  error: string;
  background: string;
  surface: string;
  text: string;
}

// Route Types
export interface Route {
  path: string;
  name: string;
  component: React.ComponentType;
  protected?: boolean;
  adminOnly?: boolean;
}

// Context Types
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterForm) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

export interface AppContextType {
  apps: App[];
  loading: boolean;
  createApp: (data: AppConfig) => Promise<App>;
  updateApp: (id: string, data: Partial<App>) => Promise<App>;
  deleteApp: (id: string) => Promise<void>;
  getApp: (id: string) => Promise<App>;
  refreshApps: () => Promise<void>;
}

// Error Types
export interface AppError {
  message: string;
  code?: string;
  statusCode?: number;
  details?: any;
} 