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

// Import models
import App from '../models/App';
import { Build } from '../models/Build';

// Import middleware and types
import { authenticateToken, checkAppOwnership, IAuthRequest } from '../middleware/auth';

const router = Router();

/**
 * POST /api/apps
 * Create a new app
 */
router.post('/', authenticateToken, async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!._id.toString();
    const appData = req.body;

    debugger;
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

    // This would typically aggregate data from builds, leads, etc.
    // For now, returning placeholder data
    const stats = {
      totalBuilds: 0,
      successfulBuilds: 0,
      failedBuilds: 0,
      totalLeads: 0,
      recentLeads: 0,
      lastBuildDate: null,
      appInstalls: 0,
      activeUsers: 0
    };

    // TODO: Implement actual statistics aggregation
    // const builds = await Build.find({ appId });
    // const leads = await Lead.find({ appId });

    res.json(stats);

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

export default router; 
