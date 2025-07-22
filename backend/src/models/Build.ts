/**
 * @fileoverview Build model for MongoDB
 * @author YosShor
 * @version 1.0.0
 * 
 * Defines the Build schema and model for app build management.
 */

import mongoose from 'mongoose';

const buildSchema = new mongoose.Schema({
  appId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'App',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  platform: {
    type: String,
    enum: ['android', 'ios'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'failed'],
    default: 'pending'
  },
  configSnapshot: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  buildDuration: {
    type: Number,
    default: 0
  },
  startedAt: Date,
  completedAt: Date,
  error: String,
  buildUrl: String,
  logs: [{
    timestamp: { type: Date, default: Date.now },
    message: String,
    level: { type: String, enum: ['info', 'warn', 'error'] }
  }],
  version: String,
}, {
  timestamps: true
});

export const Build = mongoose.model('Build', buildSchema); 
