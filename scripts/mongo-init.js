/**
 * @fileoverview MongoDB initialization script for Mobile App Generator
 * @author YosShor
 * @version 1.0.0
 */

// Switch to the mobile_app_generator database
db = db.getSiblingDB('mobile_app_generator');

// Create collections with initial indexes
db.createCollection('users');
db.createCollection('apps');
db.createCollection('builds');
db.createCollection('leads');

// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ createdAt: 1 });

db.apps.createIndex({ userId: 1 });
db.apps.createIndex({ packageId: 1 }, { unique: true });
db.apps.createIndex({ createdAt: 1 });

db.builds.createIndex({ appId: 1 });
db.builds.createIndex({ userId: 1 });
db.builds.createIndex({ status: 1 });
db.builds.createIndex({ createdAt: 1 });

db.leads.createIndex({ appId: 1 });
db.leads.createIndex({ email: 1 });
db.leads.createIndex({ createdAt: 1 });

// Insert initial data
db.users.insertOne({
  _id: ObjectId(),
  email: 'admin@example.com',
  name: 'Admin User',
  role: 'admin',
  createdAt: new Date(),
  updatedAt: new Date()
});

print('✅ Database initialization completed successfully'); 