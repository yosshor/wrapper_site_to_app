# Mobile App Generator Platform

A full-stack web platform that allows users to generate mobile apps (Android APK and iOS IPA) by entering a website URL. The platform wraps websites in WebView-based mobile apps with Firebase and AppsFlyer integration, lead capture capabilities, and an admin dashboard.

## 🚀 Features

### Core Platform
- **Website to App Conversion**: Transform any website into a native mobile app
- **Cross-Platform Support**: Generate both Android APK and iOS IPA files
- **WebView Integration**: Compliant with Google Play and App Store guidelines
- **User Management**: Complete authentication and authorization system
- **Admin Dashboard**: Comprehensive platform monitoring and management

### Mobile App Features
- **Firebase Integration**: Analytics, Crashlytics, and Cloud Messaging support
- **AppsFlyer Integration**: Install tracking and in-app event analytics  
- **Lead Capture System**: Capture user data on first app open or form submission
- **Custom Branding**: App name, package/bundle ID, splash screen, and app icon customization
- **Offline Support**: Optional caching for offline content viewing
- **Push Notifications**: Firebase Cloud Messaging integration

### Data Management
- **Google Sheets Integration**: Automatic lead data export via Google Sheets API
- **MongoDB Storage**: Scalable data storage with Mongoose ODM
- **Real-time Analytics**: Live tracking and reporting
- **Data Export**: CSV and JSON export capabilities

## 🏗️ Architecture

### Frontend (Next.js + React + TypeScript)
```
frontend/
├── pages/                 # Next.js pages and routing
│   ├── index.tsx         # Landing page
│   ├── apps/             # App management pages
│   └── admin/            # Admin dashboard pages
├── components/           # Reusable React components
│   └── ui/               # UI component library
├── services/             # API integration services
├── styles/               # Global styles and Tailwind CSS
├── types/                # TypeScript type definitions
└── utils/                # Utility functions
```

### Backend (Node.js + Express + TypeScript)
```
backend/
├── src/
│   ├── server.ts         # Main application server
│   ├── models/           # MongoDB/Mongoose models
│   ├── routes/           # API route handlers
│   ├── middleware/       # Express middleware
│   ├── services/         # Business logic services
│   └── types/            # TypeScript interfaces
├── package.json          # Dependencies and scripts
└── tsconfig.json         # TypeScript configuration
```

### Mobile Template (Capacitor)
```
mobile-template/
├── src/
│   ├── index.html        # Main WebView container
│   ├── firebase-config.js # Firebase SDK initialization
│   ├── lead-capture.js   # Lead capture functionality
│   └── assets/           # App icons and splash screens
├── capacitor.config.ts   # Capacitor configuration
└── build-config.json     # Build automation settings
```

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 with React 18
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom components
- **State Management**: React Query for server state
- **Form Handling**: React Hook Form with validation
- **UI Components**: Custom component library with accessibility

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT-based authentication
- **Security**: Helmet, CORS, rate limiting
- **File Upload**: Multer for asset management

### Mobile
- **Framework**: Capacitor 5.x for cross-platform apps
- **WebView**: Native WebView with custom JavaScript bridge
- **Analytics**: Firebase SDK + AppsFlyer SDK
- **Build Tools**: Gradle (Android), Xcode (iOS)

### Infrastructure
- **Database**: MongoDB with connection pooling
- **Caching**: Redis for session management
- **File Storage**: Local filesystem with cloud storage options
- **Services**: Docker Compose for local development

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- MongoDB 6.0+
- Redis (optional, for caching)
- Android SDK and Gradle (for Android builds)
- Xcode (for iOS builds, macOS only)

### Environment Configuration

Create `.env` files in both `backend/` and `frontend/` directories:

#### Backend Environment (.env)
```env
# Database
MONGODB_URI=mongodb://localhost:27017/mobile-app-generator
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-super-secure-jwt-secret-key-here
JWT_EXPIRES_IN=7d

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com

# Google Sheets API
GOOGLE_SHEETS_CREDENTIALS_PATH=./google-sheets-credentials.json
GOOGLE_SHEETS_SPREADSHEET_ID=your-spreadsheet-id

# AppsFlyer
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

#### Frontend Environment (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_FIREBASE_CONFIG={"apiKey":"...","authDomain":"..."}
NEXT_PUBLIC_APP_NAME=Mobile App Generator
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### Installation Steps

1. **Clone the repository**
```bash
git clone <repository-url>
cd build_site_wrapper
```

2. **Install dependencies**
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Install mobile template dependencies
cd ../mobile-template
npm install
```

3. **Set up database**
```bash
# Start MongoDB (if using Docker)
docker-compose up -d mongodb

# Or start local MongoDB service
mongod --dbpath /path/to/your/db

# Run database initialization
node scripts/mongo-init.js
```

4. **Start the development servers**
```bash
# Terminal 1: Start backend server
cd backend
npm run dev

# Terminal 2: Start frontend server  
cd frontend
npm run dev

# Terminal 3: Start MongoDB (if not using Docker)
mongod
```

5. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Admin Dashboard: http://localhost:3000/admin/dashboard

## 🔧 Configuration

### Firebase Setup
1. Create a Firebase project at https://console.firebase.google.com
2. Enable Analytics, Crashlytics, and Cloud Messaging
3. Download the service account key JSON file
4. Add the credentials to your backend environment variables

### AppsFlyer Setup
1. Create an AppsFlyer account at https://www.appsflyer.com
2. Create a new app and get your Dev Key
3. Add the Dev Key to your environment variables
4. Configure attribution settings in the AppsFlyer dashboard

### Google Sheets Integration
1. Create a Google Cloud Project
2. Enable the Google Sheets API
3. Create a service account and download credentials
4. Share your target spreadsheet with the service account email
5. Add credentials path and spreadsheet ID to environment

## 🚀 Usage Guide

### For End Users

#### Creating Your First App
1. **Register/Login**: Create an account or sign in
2. **Create App**: Click "Create New App" from the dashboard
3. **Basic Information**: 
   - Enter app name and description
   - Provide the website URL to wrap
   - Set Android package ID and iOS bundle ID
4. **Configure Services**:
   - Enable Firebase for analytics and crash reporting
   - Enable AppsFlyer for attribution tracking
   - Configure lead capture settings
5. **Select Features**:
   - Choose push notifications, offline mode, etc.
   - Upload custom app icon and splash screen
6. **Generate App**: Click "Create App" to start the build process

#### Managing Apps
- **View Apps**: Access all your apps from the main dashboard
- **Build Apps**: Generate APK/IPA files with one click
- **Monitor Builds**: Track build progress and download completed files
- **View Analytics**: Check app performance and lead data
- **Update Settings**: Modify app configuration and rebuild

### For Administrators

#### Admin Dashboard Access
- Navigate to `/admin/dashboard`
- Requires admin role privileges
- Monitor platform health and user activity

#### Key Admin Functions
- **User Management**: View all registered users and their apps
- **Build Monitoring**: Track build queue, success rates, and failures
- **Lead Analytics**: Monitor lead capture across all apps
- **Data Export**: Export users, leads, and build logs
- **System Health**: Monitor database, services, and integrations

## 📱 Mobile App Features

### Generated App Capabilities
- **WebView Container**: Secure, sandboxed web content display
- **Native Navigation**: Hardware back button, deep linking support
- **Firebase Analytics**: Automatic event tracking and user analytics
- **Crash Reporting**: Firebase Crashlytics integration
- **Push Notifications**: FCM-based messaging (optional)
- **Lead Capture**: Form-based user data collection
- **AppsFlyer Attribution**: Install and event tracking
- **Offline Support**: Content caching for offline viewing (optional)

### App Store Compliance
- **Google Play**: Follows WebView policy guidelines
- **Apple App Store**: Complies with web content restrictions
- **Privacy**: GDPR/CCPA compliant data handling
- **Security**: HTTPS enforcement, content security policies

## 🔌 API Documentation

### Authentication Endpoints
```
POST /api/auth/register      # User registration
POST /api/auth/login         # User login  
GET  /api/auth/profile       # Get user profile
PUT  /api/auth/profile       # Update profile
POST /api/auth/change-password # Change password
```

### App Management Endpoints
```
POST /api/apps               # Create new app
GET  /api/apps               # List user apps
GET  /api/apps/:id           # Get app details
PUT  /api/apps/:id           # Update app
DELETE /api/apps/:id         # Delete app
POST /api/apps/:id/duplicate # Duplicate app
```

### Build Management Endpoints
```
POST /api/builds             # Start new build
GET  /api/builds/app/:appId  # Get builds for app
GET  /api/builds/:id         # Get build details
GET  /api/builds/:id/logs    # Get build logs
GET  /api/builds/:id/download # Download build artifact
POST /api/builds/:id/cancel  # Cancel build
```

### Admin Dashboard Endpoints
```
GET  /api/dashboard/stats         # Platform statistics
GET  /api/dashboard/activities    # Recent activities
GET  /api/dashboard/export/users  # Export user data
GET  /api/dashboard/export/leads  # Export lead data
GET  /api/dashboard/export/builds # Export build logs
```

## 🔒 Security Features

### Authentication & Authorization
- JWT-based stateless authentication
- Role-based access control (user, admin)
- Password hashing with bcrypt
- Token expiration and refresh handling

### API Security
- CORS configuration for cross-origin requests
- Helmet.js for security headers
- Rate limiting to prevent abuse
- Input validation and sanitization
- File upload restrictions and validation

### Data Protection
- MongoDB connection encryption
- Environment variable management
- Secure session handling
- HTTPS enforcement in production

## 📊 Monitoring & Analytics

### Application Monitoring
- **Health Checks**: Database and service connectivity
- **Performance Metrics**: Response times and throughput
- **Error Tracking**: Centralized error logging
- **Build Monitoring**: Queue status and completion rates

### User Analytics
- **Registration Tracking**: New user sign-ups
- **App Creation**: App generation statistics  
- **Build Success Rates**: Platform reliability metrics
- **Lead Capture**: Conversion tracking across apps

### Firebase Integration
- **App Analytics**: User engagement and retention
- **Crash Reporting**: Stability monitoring
- **Performance Monitoring**: App launch and navigation times

## 🚀 Deployment

### Production Setup

#### Backend Deployment
1. **Environment Setup**
```bash
NODE_ENV=production
PORT=3001
# Set production database and service URLs
```

2. **Build and Start**
```bash
npm run build
npm start
```

#### Frontend Deployment
1. **Build for Production**
```bash
npm run build
npm run export  # For static hosting
```

2. **Deploy to Vercel/Netlify**
```bash
# Vercel
vercel --prod

# Netlify
netlify deploy --prod
```

#### Database Setup
- Use MongoDB Atlas for managed MongoDB
- Configure connection pooling and replica sets
- Set up automated backups
- Enable monitoring and alerts

#### Infrastructure Considerations
- **Load Balancing**: Use nginx or cloud load balancers
- **SSL/TLS**: Configure HTTPS with Let's Encrypt or cloud certificates
- **CDN**: Use CloudFlare or AWS CloudFront for static assets
- **Monitoring**: Set up application monitoring with services like DataDog or New Relic

## 🛠️ Development

### Code Quality
- **TypeScript**: Full type safety across frontend and backend
- **ESLint**: Code linting with custom rules
- **Prettier**: Automatic code formatting
- **Husky**: Git hooks for pre-commit validation

### Testing Strategy
- **Unit Tests**: Jest for business logic testing
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Playwright for user journey testing
- **Mobile Testing**: Capacitor test automation

### Development Workflow
1. **Feature Development**: Create feature branches
2. **Code Review**: Pull request reviews
3. **Testing**: Automated test execution
4. **Deployment**: Staging environment validation
5. **Production**: Blue-green deployment strategy

## 🤝 Contributing

### Getting Started
1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Submit a pull request

### Code Standards
- Follow TypeScript best practices
- Add JSDoc comments for all functions
- Include unit tests for new features
- Update documentation for API changes

### Commit Convention
```
feat: Add new app creation wizard
fix: Resolve build queue memory leak
docs: Update API documentation
test: Add integration tests for auth
```

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

### Documentation
- **API Reference**: `/api/docs` endpoint
- **Component Library**: Storybook documentation
- **Database Schema**: MongoDB documentation

### Troubleshooting

#### Common Issues
1. **Build Failures**
   - Check Capacitor configuration
   - Verify Android SDK installation
   - Ensure iOS development certificates

2. **Firebase Integration**
   - Validate Firebase project configuration
   - Check service account permissions
   - Verify API key restrictions

3. **Database Connection**
   - Confirm MongoDB service status
   - Check connection string format
   - Verify network accessibility

### Getting Help
- **Issues**: GitHub Issues for bug reports
- **Discussions**: GitHub Discussions for questions
- **Email**: support@yourplatform.com for direct support

## 🗺️ Roadmap

### Phase 1 (Current)
- [x] Core platform functionality
- [x] Basic mobile app generation
- [x] Firebase and AppsFlyer integration
- [x] Admin dashboard
- [x] Lead capture system

### Phase 2 (Next)
- [ ] Enhanced build customization
- [ ] Real-time build monitoring
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] App store publishing integration

### Phase 3 (Future)
- [ ] White-label solutions
- [ ] API marketplace
- [ ] Advanced mobile features
- [ ] Enterprise SSO integration
- [ ] Multi-tenant architecture

---

**Built with ❤️ using modern web technologies**

For more detailed information about specific components, see the individual README files in each module directory. 