#!/bin/bash

# Mobile App Generator Platform Setup Script
# Author: YosShor
# Version: 1.0.0

set -e

echo "🚀 Setting up Mobile App Generator Platform..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker and try again."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose and try again."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Setup environment file
if [ ! -f .env ]; then
    echo "📝 Creating environment file..."
    cp .env.example .env || echo "⚠️  Please create .env file manually from .env.example"
fi

# Create necessary directories
echo "📁 Creating project directories..."
mkdir -p uploads builds logs

# Setup frontend
echo "🎨 Setting up frontend..."
cd frontend
npm install
cd ..

# Setup backend
echo "⚙️ Setting up backend..."
cd backend
npm install
cd ..

# Setup mobile template
echo "📱 Setting up mobile template..."
cd mobile-template
npm install
cd ..

# Start services
echo "🐳 Starting database services..."
docker-compose up -d

# Wait for MongoDB to be ready
echo "⏳ Waiting for MongoDB to be ready..."
sleep 10

# Build projects
echo "🔨 Building projects..."
npm run build

echo ""
echo "✅ Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Edit .env file with your API keys and configuration"
echo "2. Run 'npm run dev' to start development servers"
echo "3. Visit http://localhost:3000 to access the platform"
echo ""
echo "📚 Documentation: Check README.md for detailed instructions"
echo "" 