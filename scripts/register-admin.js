/**
 * @fileoverview Register Admin User Script
 * @author YosShor
 * @version 1.0.0
 * 
 * Script to register a new admin user through the API.
 * This script creates an admin user with full privileges.
 */

import axios from 'axios';

// API configuration
const API_BASE_URL = 'http://localhost:3001/api';

/**
 * Register admin user
 */
export async function registerAdminUser() {
  try {
    console.log('🔐 Registering admin user...');

    // Admin user data
    const adminData = {
      email: 'admin2@mobilegen.com',
      password: 'admin123456',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin' // Note: This might be ignored by the API for security
    };

    // Register the user
    console.log('📝 Creating admin account...');
    const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, {
      email: adminData.email,
      password: adminData.password,
      firstName: adminData.firstName,
      lastName: adminData.lastName
    });

    if (registerResponse.data.success) {
      console.log('✅ Admin user registered successfully!');
      console.log('📋 Admin Credentials:');
      console.log(`   Email: ${adminData.email}`);
      console.log(`   Password: ${adminData.password}`);
      console.log(`   Name: ${adminData.firstName} ${adminData.lastName}`);
      console.log('');
      console.log('🔐 You can now login to the admin dashboard at:');
      console.log('   http://localhost:3000/auth/login?redirect=/admin/dashboard');
      console.log('');
      console.log('⚠️ IMPORTANT: The user was created with "user" role by default.');
      console.log('   You need to manually update the role to "admin" in the database.');
      console.log('');
      console.log('💡 To update the role, run the create-admin.js script instead.');
    } else {
      console.error('❌ Registration failed:', registerResponse.data.error);
    }

  } catch (error) {
    if (error.response?.data?.error) {
      console.error('❌ Registration failed:', error.response.data.error);
    } else {
      console.error('❌ Network error:', error.message);
    }
  }
}

// Run the script
if (require.main === module) {
  registerAdminUser();
}

