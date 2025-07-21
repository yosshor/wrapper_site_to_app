/**
 * @fileoverview Firebase configuration template for mobile apps
 * @author YosShor
 * @version 1.0.0
 * 
 * Firebase configuration that will be dynamically populated during build.
 * Includes Analytics, Crashlytics, and FCM setup.
 */

// Import Firebase SDKs
import { initializeApp } from 'firebase/app';
import { getAnalytics, logEvent } from 'firebase/analytics';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

// Firebase configuration (will be replaced during build)
const firebaseConfig = {
  apiKey: "{{FIREBASE_API_KEY}}",
  authDomain: "{{FIREBASE_AUTH_DOMAIN}}",
  projectId: "{{FIREBASE_PROJECT_ID}}",
  storageBucket: "{{FIREBASE_STORAGE_BUCKET}}",
  messagingSenderId: "{{FIREBASE_MESSAGING_SENDER_ID}}",
  appId: "{{FIREBASE_APP_ID}}",
  measurementId: "{{FIREBASE_MEASUREMENT_ID}}"
};

// Initialize Firebase
let app = null;
let analytics = null;

try {
  app = initializeApp(firebaseConfig);
  
  // Initialize App Check for security
  if (typeof window !== 'undefined') {
    const appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider('{{RECAPTCHA_SITE_KEY}}'),
      isTokenAutoRefreshEnabled: true
    });
  }
  
  // Initialize Analytics
  if (FIREBASE_ANALYTICS_ENABLED) {
    analytics = getAnalytics(app);
    console.log('Firebase Analytics initialized');
  }
  
  // Initialize Crashlytics
  if (FIREBASE_CRASHLYTICS_ENABLED) {
    // Crashlytics will be initialized natively
    console.log('Firebase Crashlytics enabled');
  }
  
  // Initialize FCM
  if (FIREBASE_MESSAGING_ENABLED) {
    // FCM will be handled by Capacitor Push Notifications plugin
    console.log('Firebase Cloud Messaging enabled');
  }
  
  console.log('Firebase initialized successfully');
  
} catch (error) {
  console.error('Firebase initialization error:', error);
}

/**
 * Track custom analytics event
 * @param {string} eventName - Name of the event
 * @param {object} eventParams - Event parameters
 */
export function trackEvent(eventName, eventParams = {}) {
  if (analytics && FIREBASE_ANALYTICS_ENABLED) {
    try {
      logEvent(analytics, eventName, {
        ...eventParams,
        timestamp: Date.now(),
        app_name: '{{APP_NAME}}',
        app_version: '{{APP_VERSION}}'
      });
      console.log('Analytics event tracked:', eventName, eventParams);
    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  }
}

/**
 * Track screen view
 * @param {string} screenName - Name of the screen
 * @param {string} screenClass - Screen class/category
 */
export function trackScreenView(screenName, screenClass = 'WebView') {
  trackEvent('screen_view', {
    screen_name: screenName,
    screen_class: screenClass
  });
}

/**
 * Track user engagement
 * @param {number} engagementTime - Time spent in milliseconds
 */
export function trackEngagement(engagementTime) {
  trackEvent('user_engagement', {
    engagement_time_msec: engagementTime
  });
}

/**
 * Track conversion event
 * @param {string} conversionType - Type of conversion
 * @param {object} conversionData - Additional conversion data
 */
export function trackConversion(conversionType, conversionData = {}) {
  trackEvent('conversion', {
    conversion_type: conversionType,
    ...conversionData
  });
}

// Make functions available globally
if (typeof window !== 'undefined') {
  window.trackEvent = trackEvent;
  window.trackScreenView = trackScreenView;
  window.trackEngagement = trackEngagement;
  window.trackConversion = trackConversion;
}

export { app, analytics }; 