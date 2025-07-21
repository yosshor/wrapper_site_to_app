/**
 * @fileoverview App model for MongoDB
 * @author YosShor
 * @version 1.0.0
 * 
 * Defines the App schema and model for mobile app management.
 */

import mongoose, { Document, Schema } from 'mongoose';
import { IApp } from '../types';

/**
 * App Schema Definition
 */
const AppSchema: Schema<IApp> = new Schema({
  userId: {
    type: String,
    required: [true, 'User ID is required'],
    index: true,
  },
  name: {
    type: String,
    required: [true, 'App name is required'],
    trim: true,
    maxlength: [100, 'App name cannot exceed 100 characters'],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
  },
  websiteUrl: {
    type: String,
    required: [true, 'Website URL is required'],
    trim: true,
  },
  androidPackageId: {
    type: String,
    required: [true, 'Android package ID is required'],
    trim: true,
  },
  iosPackageId: {
    type: String,
    required: [true, 'iOS package ID is required'],
    trim: true,
  },
  config: {
    type: Schema.Types.Mixed,
    default: {
      firebaseEnabled: false,
      firebaseConfig: {
        analyticsEnabled: false,
        crashlyticsEnabled: false,
        messagingEnabled: false,
      },
      appsflyerEnabled: false,
      appsflyerConfig: {
        devKey: '',
      },
      features: {
        offlineMode: false,
        pushNotifications: false,
        leadCapture: false,
        customSplash: false,
        analytics: false,
      },
    },
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'archived'],
    default: 'draft',
    index: true,
  },
  isPublic: {
    type: Boolean,
    default: false,
    index: true,
  },
  lastBuildDate: {
    type: Date,
  },
  totalBuilds: {
    type: Number,
    default: 0,
  },
  totalDownloads: {
    type: Number,
    default: 0,
  },
  totalInstalls: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
  collection: 'apps',
});

/**
 * Indexes for better query performance
 */
AppSchema.index({ userId: 1, status: 1 });
AppSchema.index({ createdAt: -1 });

/**
 * Transform the output when converting to JSON
 */
AppSchema.set('toJSON', {
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
AppSchema.set('toObject', {
  transform: function(doc: any, ret: any, options: any) {
    ret.id = ret._id;
    if (ret._id !== undefined) delete ret._id;
    if (ret.__v !== undefined) delete ret.__v;
    return ret;
  }
});

/**
 * App Model
 */
const App = mongoose.model<IApp>('App', AppSchema);

export default App; 
