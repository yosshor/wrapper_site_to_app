/**
 * @fileoverview Firebase Admin SDK Service
 * @author YosShor
 * @version 1.0.0
 * 
 * Handles Firebase Admin SDK initialization and management for server-side operations.
 * Provides methods for authentication, analytics, and messaging services.
 */

import { initializeApp, cert, App as FirebaseApp } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getMessaging, Messaging } from 'firebase-admin/messaging';

/**
 * Firebase Service Class
 * 
 * Manages Firebase Admin SDK initialization and provides access to Firebase services.
 * Handles authentication, push notifications, and other Firebase features.
 */
export class FirebaseService {
  private static app: FirebaseApp | null = null;
  private static auth: Auth | null = null;
  private static messaging: Messaging | null = null;
  private static initialized: boolean = false;

  /**
   * Initialize Firebase Admin SDK
   * 
   * Sets up Firebase Admin SDK with service account credentials from environment variables.
   * This method is idempotent - multiple calls are safe.
   * 
   * @returns Promise<void>
   * @throws Error if initialization fails or credentials are missing
   * 
   * @example
   * await FirebaseService.initialize();
   */
  public static async initialize(): Promise<void> {
    try {
      // Skip if already initialized
      if (this.initialized && this.app) {
        return;
      }

      // Check if Firebase credentials are provided
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

      // If credentials are not provided, skip Firebase initialization
      // This allows the app to run without Firebase for basic functionality
      if (!projectId || !privateKey || !clientEmail) {
        console.warn('⚠️ Firebase credentials not found - Firebase features will be disabled');
        console.warn('   Set FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, and FIREBASE_CLIENT_EMAIL to enable Firebase');
        this.initialized = true; // Mark as initialized to prevent repeated warnings
        return;
      }

      // Parse private key (handle escaped newlines)
      const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');

      // Initialize Firebase Admin SDK
      this.app = initializeApp({
        credential: cert({
          projectId,
          privateKey: formattedPrivateKey,
          clientEmail,
        }),
        projectId,
      });

      // Initialize Firebase services
      this.auth = getAuth(this.app);
      this.messaging = getMessaging(this.app);

      this.initialized = true;
      console.log(`✅ Firebase Admin SDK initialized for project: ${projectId}`);

    } catch (error) {
      console.error('❌ Failed to initialize Firebase Admin SDK:', error);
      
      // In development, we can continue without Firebase
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Continuing without Firebase in development mode');
        this.initialized = true;
        return;
      }
      
      // In production, Firebase initialization failure is critical
      throw new Error(`Firebase initialization failed: ${error}`);
    }
  }

  /**
   * Get Firebase Auth service
   * 
   * @returns Auth instance or null if not initialized
   * 
   * @example
   * const auth = FirebaseService.getAuth();
   * if (auth) {
   *   const userRecord = await auth.getUser(uid);
   * }
   */
  public static getAuth(): Auth | null {
    if (!this.initialized) {
      console.warn('⚠️ Firebase not initialized - call initialize() first');
      return null;
    }
    return this.auth;
  }

  /**
   * Get Firebase Messaging service
   * 
   * @returns Messaging instance or null if not initialized
   * 
   * @example
   * const messaging = FirebaseService.getMessaging();
   * if (messaging) {
   *   await messaging.send(message);
   * }
   */
  public static getMessaging(): Messaging | null {
    if (!this.initialized) {
      console.warn('⚠️ Firebase not initialized - call initialize() first');
      return null;
    }
    return this.messaging;
  }

  /**
   * Get Firebase App instance
   * 
   * @returns FirebaseApp instance or null if not initialized
   */
  public static getApp(): FirebaseApp | null {
    return this.app;
  }

  /**
   * Check if Firebase is initialized and available
   * 
   * @returns boolean indicating if Firebase is ready to use
   */
  public static isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Check if Firebase is available (credentials provided and initialized successfully)
   * 
   * @returns boolean indicating if Firebase services are available
   */
  public static isAvailable(): boolean {
    return this.initialized && this.app !== null;
  }

  /**
   * Verify Firebase ID token
   * 
   * Verifies a Firebase ID token and returns the decoded token.
   * Used for authenticating users in API requests.
   * 
   * @param idToken - Firebase ID token to verify
   * @returns Promise<DecodedIdToken> decoded token data
   * @throws Error if token is invalid or Firebase is not available
   * 
   * @example
   * try {
   *   const decodedToken = await FirebaseService.verifyIdToken(idToken);
   *   const uid = decodedToken.uid;
   * } catch (error) {
   *   console.error('Invalid token:', error);
   * }
   */
  public static async verifyIdToken(idToken: string): Promise<any> {
    const auth = this.getAuth();
    if (!auth) {
      throw new Error('Firebase Auth not available - check configuration');
    }

    try {
      const decodedToken = await auth.verifyIdToken(idToken);
      return decodedToken;
    } catch (error) {
      throw new Error(`Token verification failed: ${error}`);
    }
  }

  /**
   * Send push notification to a device
   * 
   * Sends a push notification to a specific device using Firebase Cloud Messaging.
   * 
   * @param token - FCM registration token
   * @param notification - Notification payload
   * @param data - Optional data payload
   * @returns Promise<string> message ID
   * @throws Error if messaging is not available or send fails
   * 
   * @example
   * await FirebaseService.sendNotification(
   *   deviceToken,
   *   { title: 'Hello', body: 'World' },
   *   { customKey: 'customValue' }
   * );
   */
  public static async sendNotification(
    token: string,
    notification: { title: string; body: string },
    data?: Record<string, string>
  ): Promise<string> {
    const messaging = this.getMessaging();
    if (!messaging) {
      throw new Error('Firebase Messaging not available - check configuration');
    }

    try {
      const message = {
        token,
        notification,
        data,
        android: {
          priority: 'high' as const,
        },
        apns: {
          headers: {
            'apns-priority': '10',
          },
        },
      };

      const messageId = await messaging.send(message);
      console.log(`✅ Notification sent successfully: ${messageId}`);
      return messageId;

    } catch (error) {
      console.error('❌ Failed to send notification:', error);
      throw new Error(`Notification send failed: ${error}`);
    }
  }

  /**
   * Create a custom token for a user
   * 
   * Creates a custom Firebase Auth token for server-side authentication.
   * 
   * @param uid - User ID
   * @param additionalClaims - Optional additional claims to include in token
   * @returns Promise<string> custom token
   * @throws Error if auth is not available or token creation fails
   * 
   * @example
   * const customToken = await FirebaseService.createCustomToken(
   *   'user123',
   *   { role: 'admin' }
   * );
   */
  public static async createCustomToken(
    uid: string,
    additionalClaims?: Record<string, any>
  ): Promise<string> {
    const auth = this.getAuth();
    if (!auth) {
      throw new Error('Firebase Auth not available - check configuration');
    }

    try {
      const customToken = await auth.createCustomToken(uid, additionalClaims);
      return customToken;
    } catch (error) {
      throw new Error(`Custom token creation failed: ${error}`);
    }
  }
} 
