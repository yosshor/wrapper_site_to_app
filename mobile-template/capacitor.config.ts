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
  appId: 'com.example.webwrapper',
  appName: 'Web Wrapper',
  webDir: 'www',
  server: {
    androidScheme: 'https'
  },
  android: {
    buildOptions: {
      keystorePath: 'app/release-key.keystore',
      keystorePassword: 'yosshor',
      keystoreAlias: 'app-alias',
      keystoreAliasPassword: 'yosshor'
    }
  },
  ios: {
    scheme: 'Web Wrapper',
  }
};

export default config; 
