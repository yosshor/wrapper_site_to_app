/**
 * @fileoverview Capacitor configuration for Mobile App WebView Template
 * @author YosShor
 * @version 1.0.0
 * 
 * Configuration for Capacitor framework with plugins and platform-specific settings.
 * This template will be dynamically configured for each generated app.
 */

import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.webview',
  appName: 'WebView App',
  webDir: 'www',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    // Splash Screen configuration
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      launchFadeOutDuration: 1000,
      backgroundColor: "#3b82f6",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      spinnerColor: "#ffffff",
      splashFullScreen: true,
      splashImmersive: true,
      layoutName: "launch_screen",
      useDialog: true,
    },

    // Status Bar configuration
    StatusBar: {
      style: 'dark',
      backgroundColor: '#3b82f6',
      overlay: false,
    },

    // Keyboard configuration
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true,
    },

    // Push Notifications configuration
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },

    // App configuration
    App: {
      handleUrlOpening: true,
    },

    // Camera configuration
    Camera: {
      iosImageWatermark: false,
      iosImageOrientation: 'up',
      androidImageWatermark: false,
    },

    // Preferences configuration
    Preferences: {
      group: 'app_preferences',
    },

    // Network configuration
    Network: {
      // Add any network-specific configuration here
    },

    // Geolocation configuration
    Geolocation: {
      // Add geolocation-specific configuration here
    },
  },

  // Android-specific configuration
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystorePassword: undefined,
      keystoreAlias: undefined,
      keystoreAliasPassword: undefined,
      releaseType: 'APK', // or 'AAB'
      signingType: 'apksigner', // or 'jarsigner'
    },
    webContentsDebuggingEnabled: false, // Set to true for debugging
  },

  // iOS-specific configuration
  ios: {
    scheme: 'WebViewApp',
    contentInset: 'automatic',
    scrollEnabled: true,
    backgroundColor: '#3b82f6',
  },
};

export default config; 