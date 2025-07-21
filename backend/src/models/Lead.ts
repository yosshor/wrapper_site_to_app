/**
 * @fileoverview Lead model for Mobile App Generator Backend
 * @author YosShor
 * @version 1.0.0
 * 
 * MongoDB Lead model using Mongoose for capturing and storing user data
 * from generated mobile apps. Handles lead data, device info, and analytics.
 */

import mongoose, { Schema, Model } from 'mongoose';
import { ILead } from '@/types';

/**
 * Device Information Schema for storing device details
 */
const DeviceInfoSchema = new Schema({
  platform: {
    type: String,
    required: true,
    enum: ['android', 'ios', 'web'],
  },
  version: {
    type: String,
    required: true,
  },
  model: {
    type: String,
    required: true,
  },
  manufacturer: {
    type: String,
    default: null,
  },
}, { _id: false });

/**
 * Location Information Schema for storing geographic data
 */
const LocationSchema = new Schema({
  country: {
    type: String,
    default: null,
  },
  region: {
    type: String,
    default: null,
  },
  city: {
    type: String,
    default: null,
  },
  latitude: {
    type: Number,
    default: null,
  },
  longitude: {
    type: Number,
    default: null,
  },
}, { _id: false });

/**
 * Lead Schema for MongoDB
 * 
 * Defines the structure and validation rules for lead documents.
 * Captures user data, device information, and interaction context.
 */
const LeadSchema: Schema<ILead> = new Schema(
  {
    appId: {
      type: String,
      ref: 'App',
      required: [true, 'App ID is required'],
      index: true,
    },
    userId: {
      type: String,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    data: {
      type: Object,
      required: [true, 'Lead data is required'],
      validate: {
        validator: function (data: any) {
          // Ensure data is an object and not empty
          return data && typeof data === 'object' && Object.keys(data).length > 0;
        },
        message: 'Lead data must be a non-empty object',
      },
    },
    source: {
      type: String,
      enum: ['app_launch', 'form_submission', 'interaction'],
      required: [true, 'Lead source is required'],
      index: true,
    },
    ipAddress: {
      type: String,
      default: null,
      validate: {
        validator: function (ip: string) {
          if (!ip) return true; // Allow null/empty
          // Basic IP validation (IPv4 and IPv6)
          const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
          const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
          return ipv4Regex.test(ip) || ipv6Regex.test(ip);
        },
        message: 'Invalid IP address format',
      },
    },
    userAgent: {
      type: String,
      default: null,
    },
    deviceInfo: {
      type: DeviceInfoSchema,
      default: null,
    },
    location: {
      type: LocationSchema,
      default: null,
    },
    // Additional metadata fields
    referrer: {
      type: String,
      default: null,
    },
    sessionId: {
      type: String,
      default: null,
      index: true,
    },
    campaignSource: {
      type: String,
      default: null,
    },
    campaignMedium: {
      type: String,
      default: null,
    },
    campaignName: {
      type: String,
      default: null,
    },
    utmParameters: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete (ret as any).__v;  
        return ret;
      },
    },
    toObject: {
      transform: function (doc, ret) {
        delete (ret as any).__v;
        return ret;
      },
    },
  }
);

// ============================================================================
// INDEXES
// ============================================================================

// Compound indexes for common queries
LeadSchema.index({ appId: 1, createdAt: -1 });
LeadSchema.index({ userId: 1, createdAt: -1 });
LeadSchema.index({ appId: 1, source: 1 });
LeadSchema.index({ source: 1, createdAt: -1 });
LeadSchema.index({ createdAt: -1 });

// Index for analytics queries
LeadSchema.index({ 'deviceInfo.platform': 1, createdAt: -1 });
LeadSchema.index({ 'location.country': 1, createdAt: -1 });

// Text index for searching lead data
LeadSchema.index({ 'data.name': 'text', 'data.email': 'text' });

// ============================================================================
// MIDDLEWARE (PRE HOOKS)
// ============================================================================

/**
 * Pre-save middleware to sanitize and validate lead data
 */
LeadSchema.pre<ILead>('save', function (next) {
  // Sanitize data fields
  if (this.data as any) {
    // Convert email to lowercase if present
    if ((this.data as any).email && typeof (this.data as any).email === 'string') {
      (this.data as any).email = (this.data as any).email.toLowerCase().trim();
    }
    
    // Trim string fields
    Object.keys(this.data as any).forEach(key => {
      if (typeof (this.data as any)[key] === 'string') {
        (this.data as any)[key] = (this.data as any)[key].trim();
      }
    });
  }
  
  next();
});

/**
 * Pre-save middleware to extract UTM parameters from referrer
 */
LeadSchema.pre<ILead>('save', function (next) {
  if (this.referrer as any) {
    try {
      const url = new URL(this.referrer as string);
      const utmParams: any = {};
      
      // Extract UTM parameters
      ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(param => {
        const value = url.searchParams.get(param);
        if (value) {
          utmParams[param] = value;
        }
      });
      
      if (Object.keys(utmParams).length > 0) {
        (this.utmParameters as any) = utmParams;
        this.campaignSource = utmParams.utm_source;
        this.campaignMedium = utmParams.utm_medium;
        this.campaignName = utmParams.utm_campaign;
      }
    } catch (error) {
      // Invalid URL, ignore UTM extraction
    }
  }
  
  next();
});

// ============================================================================
// INSTANCE METHODS
// ============================================================================

/**
 * Get formatted lead data for export
 * @returns object - Formatted lead data
 */
LeadSchema.methods.getFormattedData = function () {
  const formatted = {
    id: this._id,
    timestamp: this.createdAt,
    source: this.source,
    ...this.data,
  };
  
  // Add device information if available
  if (this.deviceInfo) {
    formatted.device_platform = this.deviceInfo.platform;
    formatted.device_model = this.deviceInfo.model;
    formatted.device_version = this.deviceInfo.version;
  }
  
  // Add location information if available
  if (this.location) {
    formatted.country = this.location.country;
    formatted.region = this.location.region;
    formatted.city = this.location.city;
  }
  
  // Add marketing attribution
  if (this.campaignSource) {
    formatted.campaign_source = this.campaignSource;
    formatted.campaign_medium = this.campaignMedium;
    formatted.campaign_name = this.campaignName;
  }
  
  return formatted;
};

/**
 * Check if lead contains personal identifiable information
 * @returns boolean - True if contains PII
 */
LeadSchema.methods.containsPII = function (): boolean {
  const piiFields = ['email', 'phone', 'name', 'firstName', 'lastName', 'address'];
  return piiFields.some(field => (this.data as any)[field]);
};

/**
 * Anonymize lead data (remove PII)
 * @returns Promise<ILead> - Updated lead document
 */
LeadSchema.methods.anonymize = async function (): Promise<ILead> {
  const piiFields = ['email', 'phone', 'name', 'firstName', 'lastName', 'address'];
  
  piiFields.forEach(field => {
    if ((this.data as any)[field]) {
      delete (this.data as any)[field];
    }
  });
  
  (this.data as any)._anonymized = true;
  (this.data as any)._anonymizedAt = new Date();
  
  return await this.save();
};

// ============================================================================
// STATIC METHODS
// ============================================================================

/**
 * Find leads by app ID with pagination and filtering
 * @param appId - App ID
 * @param filters - Optional filters
 * @param page - Page number
 * @param limit - Items per page
 * @returns Promise<object> - Paginated leads
 */
LeadSchema.statics.findByAppIdPaginated = async function (
  appId: string,
  filters: {
    source?: string;
    dateFrom?: Date;
    dateTo?: Date;
    country?: string;
    platform?: string;
  } = {},
  page: number = 1,
  limit: number = 50
) {
  const skip = (page - 1) * limit;
  const query: any = { appId };
  
  // Apply filters
  if (filters.source) {
    query.source = filters.source;
  }
  
  if (filters.dateFrom || filters.dateTo) {
    query.createdAt = {};
    if (filters.dateFrom) {
      query.createdAt.$gte = filters.dateFrom;
    }
    if (filters.dateTo) {
      query.createdAt.$lte = filters.dateTo;
    }
  }
  
  if (filters.country) {
    query['location.country'] = filters.country;
  }
  
  if (filters.platform) {
    query['deviceInfo.platform'] = filters.platform;
  }
  
  const [leads, total] = await Promise.all([
    this.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('appId', 'name packageId')
      .populate('userId', 'name email'),
    this.countDocuments(query),
  ]);

  return {
    leads,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get lead analytics for an app
 * @param appId - App ID
 * @param dateFrom - Start date
 * @param dateTo - End date
 * @returns Promise<object> - Analytics data
 */
LeadSchema.statics.getAnalytics = async function (
  appId: string,
  dateFrom?: Date,
  dateTo?: Date
) {
  const query: any = { appId };
  
  if (dateFrom || dateTo) {
    query.createdAt = {};
    if (dateFrom) {
      query.createdAt.$gte = dateFrom;
    }
    if (dateTo) {
      query.createdAt.$lte = dateTo;
    }
  }
  
  const [
    totalLeads,
    sourceBreakdown,
    platformBreakdown,
    countryBreakdown,
    dailyLeads,
  ] = await Promise.all([
    this.countDocuments(query),
    
    this.aggregate([
      { $match: query },
      { $group: { _id: '$source', count: { $sum: 1 } } },
    ]),
    
    this.aggregate([
      { $match: query },
      { $group: { _id: '$deviceInfo.platform', count: { $sum: 1 } } },
    ]),
    
    this.aggregate([
      { $match: query },
      { $group: { _id: '$location.country', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    
    this.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
    ]),
  ]);
  
  return {
    totalLeads,
    sourceBreakdown,
    platformBreakdown,
    countryBreakdown,
    dailyLeads,
  };
};

/**
 * Export leads to CSV format
 * @param appId - App ID
 * @param filters - Optional filters
 * @returns Promise<string> - CSV data
 */
LeadSchema.statics.exportToCSV = async function (
  appId: string,
  filters: any = {}
) {
  const query = { appId, ...filters };
  const leads = await this.find(query).sort({ createdAt: -1 });
  
  if (leads.length === 0) {
    return 'No leads found';
  }
  
  // Get all unique fields from lead data
  const allFields = new Set<string>();
  leads.forEach((lead: any) => {
    Object.keys(lead.getFormattedData()).forEach(field => {
      allFields.add(field);
    });
  });
  
  // Create CSV header
  const headers = Array.from(allFields).sort();
  let csvContent = headers.join(',') + '\n';
  
  // Add data rows
  leads.forEach((lead: any) => {
    const formattedData = lead.getFormattedData();
    const row = headers.map(header => {
      const value = formattedData[header];
      // Escape commas and quotes in CSV
      if (value === null || value === undefined) {
        return '';
      }
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    });
    csvContent += row.join(',') + '\n';
  });
  
  return csvContent;
};

/**
 * Clean up old leads (anonymize or delete based on retention policy)
 * @param daysOld - Age threshold in days
 * @param action - 'anonymize' or 'delete'
 * @returns Promise<number> - Number of processed leads
 */
LeadSchema.statics.cleanupOldLeads = async function (
  daysOld: number = 365,
  action: 'anonymize' | 'delete' = 'anonymize'
) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  const query = { createdAt: { $lt: cutoffDate } };
  
  if (action === 'delete') {
    const result = await this.deleteMany(query);
    return result.deletedCount || 0;
  } else {
    // Anonymize old leads
    const oldLeads = await this.find(query);
    let processedCount = 0;
    
    for (const lead of oldLeads) {
      if (!lead.data._anonymized) {
        await lead.anonymize();
        processedCount++;
      }
    }
    
    return processedCount;
  }
};

// ============================================================================
// VIRTUAL PROPERTIES
// ============================================================================

/**
 * Virtual property for lead display name
 */
LeadSchema.virtual('displayName').get(function () {
  return this.data.name || this.data.email || `Lead #${this._id}`;
});

// ============================================================================
// CREATE AND EXPORT MODEL
// ============================================================================

/**
 * Lead Model
 * 
 * MongoDB model for lead data management with analytics, export capabilities,
 * and privacy compliance features for mobile app user data capture.
 */
const Lead: Model<ILead> = mongoose.model<ILead>('Lead', LeadSchema);

export default Lead; 
