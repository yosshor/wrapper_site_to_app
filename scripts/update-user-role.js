/**
 * @fileoverview Update User Role Script
 * @author YosShor
 * @version 1.0.0
 * 
 * Script to update a user's role to admin in the database.
 */

const mongoose = require('mongoose');
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
    default: false,
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
 * Update user role to admin
 */
async function updateUserRole() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mobile_app_generator';
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Email of the user to update
    const userEmail = 'a@gmail.com'; // Change this to your email

    // Find the user
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      console.log(`❌ User with email ${userEmail} not found`);
      return;
    }

    console.log(`📋 Current user info:`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.firstName} ${user.lastName}`);
    console.log(`   Current Role: ${user.role}`);

    if (user.role === 'admin') {
      console.log('⚠️ User is already an admin');
      return;
    }

    // Update the user role to admin
    user.role = 'admin';
    user.updatedAt = new Date();
    await user.save();

    console.log('✅ User role updated successfully!');
    console.log(`📋 Updated user info:`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.firstName} ${user.lastName}`);
    console.log(`   New Role: ${user.role}`);
    console.log('');
    console.log('🔐 You can now login to the admin dashboard at:');
    console.log('   http://localhost:3000/auth/login?redirect=/admin/dashboard');
    console.log('');
    console.log('⚠️ IMPORTANT: Change your password after first admin login!');

  } catch (error) {
    console.error('❌ Error updating user role:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
if (require.main === module) {
  updateUserRole();
}

module.exports = { updateUserRole }; 