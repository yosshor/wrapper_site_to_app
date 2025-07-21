# 🚀 Mobile App Generator - Complete Setup Guide

## Prerequisites

Before starting, ensure you have the following installed:
- **Node.js 18+** and npm
- **Docker** (recommended for databases)
- **Git** (for cloning the repository)

## 🔧 Quick Start Setup

### Step 1: Automated Setup (Recommended)

```bash
# Clone the repository (if not already done)
git clone <repository-url>
cd build_site_wrapper

# Complete setup with one command - installs dependencies and creates env files
npm run setup
```

This will:
- Install all dependencies for frontend, backend, and mobile template
- Create `.env` files with secure defaults
- Create necessary directories
- Generate secure JWT secrets

### Step 2: Start Database Services

**Option A: Using Docker (Recommended)**
```bash
# Start MongoDB and Redis containers
npm run setup:db
# OR
docker-compose up -d

# Verify services are running
docker-compose ps
```

**Option B: Manual Installation**
```bash
# Install and start MongoDB locally
mongod --dbpath /path/to/your/db

# Install and start Redis locally  
redis-server
```

### Step 3: Start Development (That's it!)

```bash
# Start both frontend and backend servers
npm run dev
```

### Step 4: Verify Everything is Working

Once the servers start, you should see:
- ✅ Frontend running at http://localhost:3000
- ✅ Backend API at http://localhost:3001
- ✅ MongoDB and Redis connections established

**Quick Test:**
1. Open http://localhost:3000 in your browser
2. You should see the Mobile App Generator homepage
3. Check backend health: http://localhost:3001/health

---

## 🛠️ Manual Setup (Alternative)

If you prefer to set up manually:

### Step 1: Install Dependencies

```bash
# Install all dependencies for all workspaces
npm run install:all
```

### Step 2: Configure Environment Variables

#### Backend Environment Configuration

Create `backend/.env`:
```env
# Database
MONGODB_URI=mongodb://admin:password@localhost:27017/mobile_app_generator?authSource=admin
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-super-secure-jwt-secret-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Firebase Admin SDK (Optional - for advanced features)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com

# Google Sheets API (Optional - for lead export)
GOOGLE_SHEETS_CREDENTIALS_PATH=./google-sheets-credentials.json
GOOGLE_SHEETS_SPREADSHEET_ID=your-spreadsheet-id

# AppsFlyer (Optional - for attribution tracking)
APPSFLYER_API_TOKEN=your-appsflyer-api-token

# Build System
BUILD_QUEUE_ENABLED=true
MAX_CONCURRENT_BUILDS=3
BUILD_TIMEOUT_MINUTES=30

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Server
PORT=3001
NODE_ENV=development
```

#### Frontend Environment Configuration

Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_APP_NAME=Mobile App Generator
NEXT_PUBLIC_APP_VERSION=1.0.0

# Firebase Config (Optional - paste your Firebase config object)
NEXT_PUBLIC_FIREBASE_CONFIG={"apiKey":"...","authDomain":"..."}
```

### Step 4: Start Development Servers

**Method 1: Start Both Servers Together (Recommended)**
```bash
# From the root directory
npm run dev
```

**Method 2: Start Servers Separately**
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend (new terminal window)
cd frontend
npm run dev
```

### Step 5: Access the Application

Once both servers are running:

- **Frontend Application**: http://localhost:3000
- **Backend API**: http://localhost:3001/api
- **Admin Dashboard**: http://localhost:3000/admin/dashboard
- **API Documentation**: http://localhost:3001/api/health (health check)

## 📋 Available Scripts

### Root Level Commands
```bash
npm run dev              # Start both frontend and backend
npm run build            # Build both for production
npm run start            # Start both in production mode
npm run install:all      # Install dependencies for all workspaces
```

### Backend Commands
```bash
cd backend
npm run dev              # Development with hot reload
npm run build            # Build TypeScript to JavaScript  
npm run start            # Production mode
npm run test             # Run tests
npm run lint             # Code linting
npm run type-check       # TypeScript type checking
```

### Frontend Commands
```bash
cd frontend
npm run dev              # Development with hot reload
npm run build            # Build for production
npm run start            # Production mode
npm run lint             # Code linting
npm run type-check       # TypeScript type checking
```

## 🐳 Docker Commands

```bash
# Start all services
docker-compose up -d

# View service status
docker-compose ps

# View logs
docker-compose logs mongodb
docker-compose logs redis

# Stop services
docker-compose down

# Reset everything (WARNING: Deletes all data)
docker-compose down -v
```

## 🔧 Configuration Details

### Firebase Setup (Optional)
1. Go to https://console.firebase.google.com
2. Create a new project
3. Enable Authentication, Firestore, Analytics, and Cloud Messaging
4. Download service account key (Settings > Service Accounts > Generate Key)
5. Add credentials to `backend/.env`

### AppsFlyer Setup (Optional)
1. Create account at https://www.appsflyer.com
2. Create a new app in dashboard
3. Get Dev Key from App Settings
4. Add to `backend/.env` and mobile template configuration

### Google Sheets Integration (Optional)
1. Create Google Cloud Project
2. Enable Google Sheets API
3. Create service account and download credentials JSON
4. Share target spreadsheet with service account email
5. Add credentials path and spreadsheet ID to `backend/.env`

## 🧪 Testing the Setup

### Verify Backend
```bash
curl http://localhost:3001/api/health
# Should return: {"status": "ok", "timestamp": "..."}
```

### Verify Frontend
Open http://localhost:3000 in your browser - you should see the application homepage.

### Verify Database Connection
Check the backend terminal logs for:
```
✅ Connected to MongoDB
✅ Redis connected successfully
🚀 Server running on port 3001
```

## ❗ Troubleshooting

### Common Issues

**Port Conflicts**
- Ensure ports 3000, 3001, 27017, and 6379 are available
- Kill conflicting processes: `npx kill-port 3000 3001`

**Database Connection Issues**
```bash
# Check MongoDB status
docker-compose logs mongodb

# Restart MongoDB
docker-compose restart mongodb

# Connect to MongoDB directly
docker exec -it mobile_app_generator_mongodb mongo -u admin -p password
```

**TypeScript Errors**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check TypeScript configuration
npm run type-check
```

**Environment Variables Not Loading**
- Ensure `.env` files are in correct locations
- Verify variable names match exactly
- Restart development servers after changes

**Build Errors**
```bash
# Clean build directories
rm -rf backend/dist frontend/.next

# Rebuild
npm run build
```

### Reset Everything
```bash
# Stop all processes
pkill -f "next\|nodemon\|ts-node"

# Reset Docker
docker-compose down -v
docker-compose up -d

# Clean install
rm -rf node_modules */node_modules
npm run install:all

# Start fresh
npm run dev
```

## 🔒 Security Notes

- Change default JWT_SECRET in production
- Use strong database passwords
- Enable firewall rules for production deployment
- Regularly update dependencies: `npm audit fix`

## 📚 Next Steps

1. **Create your first app** at http://localhost:3000
2. **Explore the API** documentation
3. **Set up Firebase** for advanced features
4. **Configure AppsFlyer** for attribution
5. **Deploy to production** following deployment guide

## 🆘 Getting Help

If you encounter issues:
1. Check the troubleshooting section above
2. Review logs in terminal/console
3. Verify environment variables are set correctly
4. Ensure all services are running

## 📱 Mobile App Development

Once the platform is running, you can:
1. Create mobile apps from website URLs
2. Customize app icons, names, and features
3. Generate Android APK and iOS IPA files
4. Track app installs and user engagement
5. Manage leads and analytics through admin dashboard

Happy app building! 🎉 