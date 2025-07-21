/**
 * @fileoverview Build model for MongoDB
 * @author YosShor
 * @version 1.0.0
 * 
 * Defines the Build schema and model for app build management.
 */

import mongoose, { Document, Schema } from 'mongoose';
import { IBuild } from '../types';

/**
 * Build Schema Definition
 */
const BuildSchema: Schema<IBuild> = new Schema({
  appId: {
    type: String,
    required: [true, 'App ID is required'],
    index: true,
  },
  userId: {
    type: String,
    required: [true, 'User ID is required'],
    index: true,
  },
  platform: {
    type: String,
    enum: ['android', 'ios'],
    required: [true, 'Platform is required'],
    index: true,
  },
  buildType: {
    type: String,
    enum: ['debug', 'release'],
    required: [true, 'Build type is required'],
    default: 'debug',
  },
  version: {
    type: String,
    required: [true, 'Version is required'],
    default: '1.0.0',
  },
  buildNumber: {
    type: Number,
    required: [true, 'Build number is required'],
    default: 1,
  },
  status: {
    type: String,
    enum: ['pending', 'building', 'completed', 'failed', 'cancelled'],
    default: 'pending',
    index: true,
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  buildStartTime: {
    type: Date,
  },
  buildEndTime: {
    type: Date,
  },
  buildDuration: {
    type: Number, // seconds
  },
  artifactUrl: {
    type: String,
  },
  artifactSize: {
    type: Number, // bytes
  },
  buildLogUrl: {
    type: String,
  },
  errorMessage: {
    type: String,
  },
  errorDetails: {
    type: Schema.Types.Mixed,
  },
  configSnapshot: {
    type: Schema.Types.Mixed,
    required: true,
  },
}, {
  timestamps: true,
  collection: 'builds',
});

/**
 * Indexes for better query performance
 */
BuildSchema.index({ appId: 1, status: 1 });
BuildSchema.index({ userId: 1, createdAt: -1 });
BuildSchema.index({ platform: 1, status: 1 });

/**
 * Transform the output when converting to JSON
 */
BuildSchema.set('toJSON', {
  transform: function(doc: any, ret: any, options: any) {
    ret.id = ret._id;
    if (ret._id !== undefined) delete ret._id;
    if (ret.__v !== undefined) delete ret.__v;
    return ret;
  }
});

/**
 * Transform the output when converting to Object
 */
BuildSchema.set('toObject', {
  transform: function(doc: any, ret: any, options: any) {
    ret.id = ret._id;
    if (ret._id !== undefined) delete ret._id;
    if (ret.__v !== undefined) delete ret.__v;
    return ret;
  }
});

/**
 * Build Model
 */
const Build = mongoose.model<IBuild>('Build', BuildSchema);

export default Build;
export { Build }; 
