/**
 * @fileoverview App management routes for mobile app configuration
 * @author YosShor
 * @version 1.0.0
 * @requires express
 * @requires ../models/App
 * @requires ../middleware/auth
 */

import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import fsExtra from 'fs-extra';
import { exec } from 'child_process';
import util from 'util';

// Import models
import App from '../models/App';
import { Build } from '../models/Build';
import Lead from '../models/Lead';

// Import middleware and types
import { authenticateToken, checkAppOwnership, IAuthRequest } from '../middleware/auth';
import { buildService } from '../services/buildService';

interface BuildTrend {
  date: string;
  total: number;
  successful: number;
}

interface RecentBuild {
  id: string;
  status: string;
  platform: string;
  duration: number;
  createdAt: Date;
}

interface RecentLead {
  id: string;
  source: string;
  status: string;
  createdAt: Date;
}

interface LeadTrend {
  date: string;
  count: number;
}

const router = Router();

/**
 * POST /api/apps
 * Create a new app
 */
router.post('/', authenticateToken, async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!._id.toString();
    const appData = req.body;

    // debugger;
    // Validate required fields
    const { name, websiteUrl, packageId, bundleId } = appData;
    
    if (!name || !websiteUrl || !packageId) {
      console.error('Missing required fields: name, websiteUrl, packageId');
      res.status(400).json({
        success: false,
        error: 'Missing required fields: name, websiteUrl, packageId'
      });
      return;
    }

    // Check if app with same package ID already exists for this user
    const existingApp = await App.findOne({
      userId,
      $or: [
        { androidPackageId: packageId },
        { iosPackageId: bundleId || packageId }
      ]
    });

    if (existingApp) {
      console.error('An app with this package ID already exists');
      res.status(409).json({
        success: false,
        error: 'An app with this package ID already exists'
      });
      return;
    }

    // Create new app
    const newApp = new App({
      userId,
      name: name.trim(),
      description: appData.description?.trim() || '',
      websiteUrl: websiteUrl.trim(),
      androidPackageId: packageId.trim(),
      iosPackageId: (bundleId || packageId).trim(),
      
      config: {
        name: name.trim(),
        description: appData.description?.trim() || '',
        websiteUrl: websiteUrl.trim(),
        
        // Firebase configuration
        firebaseEnabled: appData.firebase?.enabled || false,
        firebaseConfig: {
          analyticsEnabled: appData.firebase?.features?.analytics || false,
          crashlyticsEnabled: appData.firebase?.features?.crashlytics || false,
          messagingEnabled: appData.firebase?.features?.messaging || false,
        },
        
        // AppsFlyer configuration
        appsflyerEnabled: appData.appsflyer?.enabled || false,
        appsflyerConfig: {
          devKey: appData.appsflyer?.devKey || '',
        },
        
        // Features
        features: {
          offlineMode: appData.features?.offlineMode || false,
          pushNotifications: appData.features?.pushNotifications || false,
          leadCapture: appData.features?.leadCapture || false,
          customSplash: appData.features?.customSplash || false,
          analytics: appData.features?.analytics || false,
        },
      },
      
      status: 'draft',
      isPublic: false,
      totalBuilds: 0,
      totalDownloads: 0,
      totalInstalls: 0,
    });

    const savedApp = await newApp.save();

    console.log('Created app:', {
      success: true,
      message: 'App created successfully',
      data: savedApp
    });

    res.status(201).json({
      success: true,
      message: 'App created successfully',
      data: savedApp.toObject()
    });

  } catch (error) {
    console.error('Error creating app:', error);
    next(error);
  }
});

/**
 * GET /api/apps
 * Get all apps for the authenticated user
 */
router.get('/', authenticateToken, async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!._id.toString();
    const { page = 1, limit = 10, search, status } = req.query;

    // Build query
    const query: any = { userId };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) {
      query.status = status;
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [apps, totalCount] = await Promise.all([
      App.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      App.countDocuments(query)
    ]);

    const totalPages = Math.ceil(totalCount / limitNum);

    res.status(200).json({
      success: true,
      data: {
        apps,
        pagination: {
          current: pageNum,
          total: totalCount,
          pages: totalPages,
          limit: limitNum,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1,
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * Get a specific app by ID
 * GET /api/apps/:appId
 */
router.get('/:appId', authenticateToken, checkAppOwnership, async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { appId } = req.params;
    const userId = req.user!._id.toString();

    const app = await App.findOne({ _id: appId, userId });
    
    if (!app) {
      res.status(404).json({ 
        success: false, 
        error: 'App not found' 
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { app }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * Update an existing app
 * PUT /api/apps/:appId
 */
router.put('/:appId', authenticateToken, checkAppOwnership, async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { appId } = req.params;
    const userId = req.user!._id.toString();
    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    delete updateData._id;
    delete updateData.userId;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    const updatedApp = await App.findOneAndUpdate(
      { _id: appId, userId },
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!updatedApp) {
      res.status(404).json({
        success: false,
        error: 'App not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'App updated successfully',
      data: { app: updatedApp }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * Delete an app
 * DELETE /api/apps/:appId
 */
router.delete('/:appId', authenticateToken, checkAppOwnership, async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { appId } = req.params;
    const userId = req.user!._id.toString();

    const deletedApp = await App.findOneAndDelete({ _id: appId, userId });

    if (!deletedApp) {
      res.status(404).json({
        success: false,
        error: 'App not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'App deleted successfully'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * Toggle app status (active/paused)
 * POST /api/apps/:appId/toggle-status
 */
router.post('/:appId/toggle-status', authenticateToken, checkAppOwnership, async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { appId } = req.params;
    const userId = req.user!._id.toString();

    const app = await App.findOne({ _id: appId, userId });

    if (!app) {
      res.status(404).json({
        success: false,
        error: 'App not found'
      });
      return;
    }

    // Toggle between active and paused
    const newStatus = app.status === 'active' ? 'paused' : 'active';
    app.status = newStatus;
    await app.save();

    res.status(200).json({
      success: true,
      message: `App ${newStatus === 'active' ? 'activated' : 'paused'} successfully`,
      data: { app }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * Get app statistics
 * GET /api/apps/:appId/stats
 */
router.get('/:appId/stats', authenticateToken, checkAppOwnership, async (req: IAuthRequest, res: Response, next: NextFunction) => {
  try {
    const { appId } = req.params;
    
    // Initialize enhanced stats object
    const stats = {
      builds: {
        total: 0,
        successful: 0,
        failed: 0,
        lastBuildDate: new Date(),
        recentBuilds: [] as RecentBuild[],
        buildTrend: [] as BuildTrend[],
        platforms: {
          android: 0,
          ios: 0
        }
      },
      leads: {
        total: 0,
        recent: 0, // Last 7 days
        bySource: {}, // Group by source
        conversionRate: 0,
        recentLeads: [] as RecentLead[], // Last 5 leads
        leadTrend: [] as LeadTrend[], // Last 7 days trend
      },
      performance: {
        totalInstalls: 0,
        activeUsers: 0,
        avgBuildTime: 0,
        successRate: 0
      }
    };

    // Get builds and leads with more details
    const [builds, leads] = await Promise.all([
      Build.find({ appId })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),
      Lead.find({ appId })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean()
    ]);

    // Process build statistics
    stats.builds.total = builds.length;
    stats.builds.successful = builds.filter(b => b.status === 'completed').length;
    stats.builds.failed = builds.filter(b => b.status === 'failed').length;
    stats.builds.lastBuildDate = builds[0]?.createdAt || new Date();
    stats.builds.recentBuilds = builds.slice(0, 5).map((b: any) => ({
      id: b._id,
      status: b.status,
      platform: b.platform,
      duration: b.buildDuration,
      createdAt: b.createdAt
    }));

    // Calculate platform distribution
    builds.forEach((build: any) => {
      if (build.platform === 'android') stats.builds.platforms.android++;
      if (build.platform === 'ios') stats.builds.platforms.ios++;
    });

    // Calculate build trend (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    stats.builds.buildTrend  = last7Days.map((date: any) => ({
      date,
      total: builds.filter(b => b.createdAt.toISOString().startsWith(date)).length,
      successful: builds.filter(b => 
        b.createdAt.toISOString().startsWith(date) && 
        b.status === 'completed'
      ).length
    }));

    // Process lead statistics
    stats.leads.total = leads.length;
    stats.leads.recent = leads.filter(l => 
      new Date(l.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length;

    // Group leads by source
    stats.leads.bySource = leads.reduce((acc: any, lead: any) => {
      acc[lead.source] = (acc[lead.source] || 0) + 1;
      return acc;
    }, {});

    // Recent leads with details
    stats.leads.recentLeads = leads.slice(0, 5).map((l: any) => ({
      id: l._id,
      source: l.source,
      status: l.status,
      createdAt: l.createdAt
    }));

    // Calculate lead trend (last 7 days)
    stats.leads.leadTrend = last7Days.map((date: any) => ({
      date,
      count: leads.filter(l => l.createdAt.toISOString().startsWith(date)).length
    }));

    // Calculate performance metrics
    stats.performance.totalInstalls = builds.reduce((sum: any, b: any) => sum + (b.installs || 0), 0);
    stats.performance.activeUsers = leads.reduce((sum: any, l: any) => sum + (l.activeUsers || 0), 0);
    stats.performance.avgBuildTime = builds.length ? 
      builds.reduce((sum: any, b: any) => sum + (b.duration || 0), 0) / builds.length : 0;
    stats.performance.successRate = builds.length ? 
      (stats.builds.successful / stats.builds.total) * 100 : 0;

    res.status(200).json({
      success: true,
      data: { stats }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * Duplicate an app
 * POST /api/apps/:appId/duplicate
 */
router.post('/:appId/duplicate', authenticateToken, checkAppOwnership, async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { appId } = req.params;
    const userId = req.user!._id.toString();

    const originalApp = await App.findOne({ _id: appId, userId });

    if (!originalApp) {
      res.status(404).json({
        success: false,
        error: 'App not found'
      });
      return;
    }

    // Create a copy of the app
    const duplicatedApp = new App({
      ...originalApp.toObject(),
      _id: undefined,
      name: `${originalApp.name} (Copy)`,
      status: 'draft',
      totalBuilds: 0,
      totalDownloads: 0,
      totalInstalls: 0,
      lastBuildDate: undefined,
      createdAt: undefined,
      updatedAt: undefined,
    });

    const savedApp = await duplicatedApp.save();

    res.status(201).json({
      success: true,
      message: 'App duplicated successfully',
      data: { app: savedApp }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * Build an app
 * POST /api/apps/:appId/build
 */
router.post('/:appId/build', authenticateToken, checkAppOwnership, async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { appId } = req.params;
    const { platform, config } = req.body;

    // Create new build
    const build = new Build({
      appId,
      userId: req.user!._id,
      platform,
      status: 'pending',
      configSnapshot: {
        ...config,
        buildTime: new Date(),
        environment: process.env.NODE_ENV
      },
      startedAt: new Date()
    });

    await build.save();

    // Start build process asynchronously
    buildService.startBuild(build._id.toString())
      .catch(error => {
        console.error('Build process failed:', error);
      });

    // Return immediately with the build ID
    res.status(200).json({
      success: true,
      message: 'Build started',
      data: { buildId: build._id }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * Get builds list for an app
 */
router.get('/:appId/builds', authenticateToken, checkAppOwnership, async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { appId } = req.params;
    const { limit = 10, page = 1 } = req.query;
    
    const limitNum = parseInt(limit as string);
    const pageNum = parseInt(page as string);
    const skip = (pageNum - 1) * limitNum;

    // Get builds for this app, sorted by creation date (newest first)
    const builds = await Build.find({ appId })
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip(skip)
      .lean();

    // Get total count for pagination
    const total = await Build.countDocuments({ appId });

    res.json({
      success: true,
      data: {
        builds,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error) {
    console.error('Error getting builds:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get builds'
    });
  }
});

/**
 * Add a new endpoint to check build status
 */
router.get('/:appId/builds/:buildId', authenticateToken, async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { buildId } = req.params;
    const build = await Build.findById(buildId);

    if (!build) {
      res.status(404).json({ success: false, error: 'Build not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: { build }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * Add endpoint to download APK
 */
router.get('/:appId/builds/:buildId/download', authenticateToken, async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { buildId } = req.params;
    const build = await Build.findById(buildId);

    if (!build || !build.buildUrl) {
      res.status(404).json({ success: false, error: 'Build or APK not found' });
      return;
    }

    res.download(build.buildUrl);

  } catch (error) {
    console.error('Build error:', error);
    next(error);
  }
});


export default router; 
