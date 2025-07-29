/**
 * @fileoverview Create Admin User Script
 * @author YosShor
 * @version 1.0.0
 * 
 * Script to create an admin user for the Mobile App Generator platform.
 * This script creates a default admin user with full privileges.
 */

const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
require('dotenv').config({ path: './backend/.env' });

// User Schema (simplified for this script)
const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  isEmailVerified: {
    type: Boolean,
    default: true, // Admin users are pre-verified
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const User = mongoose.model('User', UserSchema);

/**
 * Create admin user
 */
async function createAdminUser() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mobile_app_generator';
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('⚠️ Admin user already exists:');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Name: ${existingAdmin.firstName} ${existingAdmin.lastName}`);
      console.log(`   Role: ${existingAdmin.role}`);
      return;
    }

    // Create admin user data
    const adminData = {
      email: 'admin@mobilegen.com',
      password: 'admin123456',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      isEmailVerified: true,
      isActive: true,
    };

    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const hashedPassword = await bcryptjs.hash(adminData.password, saltRounds);

    // Create admin user
    const adminUser = new User({
      ...adminData,
      password: hashedPassword,
    });

    await adminUser.save();

    console.log('✅ Admin user created successfully!');
    console.log('📋 Admin Credentials:');
    console.log(`   Email: ${adminData.email}`);
    console.log(`   Password: ${adminData.password}`);
    console.log(`   Name: ${adminData.firstName} ${adminData.lastName}`);
    console.log(`   Role: ${adminData.role}`);
    console.log('');
    console.log('🔐 You can now login to the admin dashboard at:');
    console.log('   http://localhost:3000/admin/dashboard');
    console.log('');
    console.log('⚠️ IMPORTANT: Change the default password after first login!');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
if (require.main === module) {
  createAdminUser();
}

module.exports = { createAdminUser }; 