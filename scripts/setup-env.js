#!/usr/bin/env node

/**
 * @fileoverview Environment setup script for Mobile App Generator
 * @author YosShor
 * @version 1.0.0
 * 
 * Automatically creates .env files for backend and frontend from templates
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('🚀 Setting up Mobile App Generator environment files...\n');

// Generate a secure JWT secret
const generateJWTSecret = () => {
  return crypto.randomBytes(64).toString('hex');
};

// Backend .env content
const backendEnv = `# Database Configuration
MONGODB_URI=mongodb://admin:password@localhost:27017/mobile_app_generator?authSource=admin
REDIS_URL=redis://localhost:6379

# Authentication & Security
JWT_SECRET=${generateJWTSecret()}
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12

# Server Configuration
PORT=3001
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Build System
BUILD_QUEUE_ENABLED=true
MAX_CONCURRENT_BUILDS=3
BUILD_TIMEOUT_MINUTES=30

# Firebase Admin SDK (Optional - Configure these for Firebase features)
# Get these from your Firebase project settings -> Service accounts
# FIREBASE_PROJECT_ID=your-project-id
# FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"
# FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com

# Google Sheets API (Optional - For lead export feature)
# GOOGLE_SHEETS_CREDENTIALS_PATH=./google-sheets-credentials.json
# GOOGLE_SHEETS_SPREADSHEET_ID=your-spreadsheet-id

# AppsFlyer (Optional - For attribution tracking)
# APPSFLYER_API_TOKEN=your-appsflyer-api-token
`;

// Frontend .env.local content
const frontendEnv = `# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# App Configuration
NEXT_PUBLIC_APP_NAME=Mobile App Generator
NEXT_PUBLIC_APP_VERSION=1.0.0

# Firebase Configuration (Optional - Configure these for client-side Firebase features)
# Get this from your Firebase project settings -> General -> Your apps -> Web app config
# NEXT_PUBLIC_FIREBASE_CONFIG={"apiKey":"your-api-key","authDomain":"your-project.firebaseapp.com","projectId":"your-project-id","storageBucket":"your-project.appspot.com","messagingSenderId":"123456789","appId":"1:123456789:web:abcdef"}

# Analytics & Tracking (Optional)
# NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
`;

// Create backend .env file
const backendEnvPath = path.join(__dirname, '..', 'backend', '.env');
if (!fs.existsSync(backendEnvPath)) {
  try {
    fs.writeFileSync(backendEnvPath, backendEnv);
    console.log('✅ Created backend/.env file');
  } catch (error) {
    console.error('❌ Failed to create backend/.env file:', error.message);
  }
} else {
  console.log('⚠️ backend/.env file already exists - skipping');
}

// Create frontend .env.local file
const frontendEnvPath = path.join(__dirname, '..', 'frontend', '.env.local');
if (!fs.existsSync(frontendEnvPath)) {
  try {
    fs.writeFileSync(frontendEnvPath, frontendEnv);
    console.log('✅ Created frontend/.env.local file');
  } catch (error) {
    console.error('❌ Failed to create frontend/.env.local file:', error.message);
  }
} else {
  console.log('⚠️ frontend/.env.local file already exists - skipping');
}

// Create uploads and builds directories if they don't exist
const uploadsDir = path.join(__dirname, '..', 'uploads');
const buildsDir = path.join(__dirname, '..', 'builds');

if (!fs.existsSync(uploadsDir)) {
  try {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('✅ Created uploads/ directory');
  } catch (error) {
    console.error('❌ Failed to create uploads/ directory:', error.message);
  }
}

if (!fs.existsSync(buildsDir)) {
  try {
    fs.mkdirSync(buildsDir, { recursive: true });
    console.log('✅ Created builds/ directory');
  } catch (error) {
    console.error('❌ Failed to create builds/ directory:', error.message);
  }
}

console.log('\n🎉 Environment setup complete!');
console.log('\n📝 Next steps:');
console.log('   1. Start Docker services: docker-compose up -d');
console.log('   2. Install dependencies: npm install');
console.log('   3. Start development servers: npm run dev');
console.log('\n💡 Optional configurations:');
console.log('   - Configure Firebase credentials in backend/.env');
console.log('   - Set up Google Sheets API for lead export');
console.log('   - Add AppsFlyer token for attribution tracking');
console.log('\n📚 Check SETUP_GUIDE.md for detailed instructions!\n'); 