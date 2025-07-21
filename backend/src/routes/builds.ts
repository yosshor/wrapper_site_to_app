/**
 * @fileoverview Build routes for Mobile App Generator Backend
 * @author YosShor
 * @version 1.0.0
 * 
 * Handles build creation, monitoring, and management endpoints.
 */

import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';

// Import models
import App from '../models/App';
import Build from '../models/Build';

// Import middleware and types
import { authenticateToken, checkAppOwnership, IAuthRequest } from '../middleware/auth';
import { BuildService } from '../services/buildService';

const router = Router();
const buildService = new BuildService();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error as Error, '');
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(null, false); // Don't save the file but don't throw error
    }
  }
});

/**
 * Create a new build for an app
 * POST /api/builds
 * @param {Object} req.body - Build configuration
 * @param {string} req.body.appId - App ID to build
 * @param {string} req.body.platform - Build platform (android|ios|both)
 * @param {string} req.body.buildType - Build type (debug|release)
 * @param {Object} req.body.config - Build configuration overrides
 */
router.post('/', authenticateToken, upload.fields([
  { name: 'appIcon', maxCount: 1 },
  { name: 'splashScreen', maxCount: 1 }
]), async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { appId, platform, buildType = 'debug', config = {} } = req.body;
    const userId = req.user!._id.toString();

    // Verify app ownership
    const app = await App.findOne({ _id: appId, userId });
    if (!app) {
      res.status(404).json({ error: 'App not found or access denied' });
      return;
    }

    // Parse config if it's a string
    let parsedConfig = config;
    if (typeof config === 'string') {
      try {
        parsedConfig = JSON.parse(config);
      } catch (error) {
        res.status(400).json({ error: 'Invalid config format' });
        return;
      }
    }

    // Handle uploaded files
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    if (files && files.appIcon && files.appIcon[0]) {
      parsedConfig.appIcon = files.appIcon[0].path;
    }
    if (files && files.splashScreen && files.splashScreen[0]) {
      parsedConfig.splashScreen = files.splashScreen[0].path;
    }

    // Create build record
    const build = new Build({
      appId,
      userId,
      platform: platform as 'android' | 'ios' | 'both',
      buildType: buildType as 'debug' | 'release',
      // Version is not present on IAppConfig, so fallback to app.version or undefined
      version: (app as any).version || undefined,
      config: {
        ...app.toObject(),
        ...parsedConfig
      },
      status: 'pending',
      logs: [],
      startedAt: new Date()
    });

    await build.save();

    // Start build process asynchronously
    buildService.startBuild(build._id.toString()).catch(error => {
      console.error('Build failed:', error);
    });

    res.status(201).json({
      message: 'Build started successfully',
      buildId: build._id,
      status: build.status
    });

  } catch (error) {
    next(error);
  }
});

/**
 * Get builds for a specific app
 * GET /api/builds/app/:appId
 */
router.get('/app/:appId', authenticateToken, checkAppOwnership, async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { appId } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    const query: any = { appId };
    if (status && status !== 'all') {
      query.status = status;
    }

    const builds = await Build.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit as string) * 1)
      .skip((parseInt(page as string) - 1) * parseInt(limit as string))
      .select('-logs'); // Exclude logs for list view

    const total = await Build.countDocuments(query);

    res.json({
      builds,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * Get specific build details with logs
 * GET /api/builds/:buildId
 */
router.get('/:buildId', authenticateToken, async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { buildId } = req.params;
    const userId = req.user!._id.toString();

    const build = await Build.findOne({ 
      _id: buildId, 
      userId 
    }).populate('appId', 'name packageId bundleId');

    if (!build) {
      res.status(404).json({ error: 'Build not found or access denied' });
      return;
    }

    res.json(build);

  } catch (error) {
    next(error);
  }
});

/**
 * Get build logs
 * GET /api/builds/:buildId/logs
 */
router.get('/:buildId/logs', authenticateToken, async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { buildId } = req.params;
    const userId = req.user!._id.toString();

    const build = await Build.findOne({ 
      _id: buildId, 
      userId 
    }).select('logs status');

    if (!build) {
      res.status(404).json({ error: 'Build not found or access denied' });
      return;
    }

    res.json({
      /**
       * Responds with build log details.
       * 
       * @property {string} buildId - The unique identifier for the build
       * @property {string} status - The current status of the build
       * @property {string[]} logs - Array of log messages for the build
       * 
       * @example
       * // Response format:
       * {
       *   "buildId": "64f1c2e4b2a1c2e4b2a1c2e4",
       *   "status": "completed",
       *   "logs": ["Build started", "Build completed successfully"]
       * }
       */
      success: true,
      data: {
        buildId: build._id,
        status: build.status,
        logs: (build as any).logs
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * Download build artifact
 * GET /api/builds/:buildId/download
 */
router.get('/:buildId/download', authenticateToken, async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { buildId } = req.params;
    const { platform } = req.query;
    const userId = req.user!._id.toString();

    const build = await Build.findOne({ 
      _id: buildId, 
      userId 
    });

    if (!build) {
      res.status(404).json({ error: 'Build not found or access denied' });
      return;
    }

    if (build.status !== 'completed') {
            res.status(400).json({ error: 'Build not completed yet' });
      return;
    }

    // Get download URL from build service
    const downloadUrl = await buildService.getDownloadUrl(buildId, platform as string);
    
    if (!downloadUrl) {
      res.status(404).json({ error: 'Build artifact not found' });
      return;
    }

    res.json({ downloadUrl });

  } catch (error) {
    next(error);
  }
});

/**
 * Cancel a pending or running build
 * POST /api/builds/:buildId/cancel
 */
router.post('/:buildId/cancel', authenticateToken, async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { buildId } = req.params;
    const userId = req.user!._id.toString();

    const build = await Build.findOne({ 
      _id: buildId, 
      userId 
    });

    if (!build) {
      res.status(404).json({ error: 'Build not found or access denied' });
      return;
    }

    if (!['pending', 'building'].includes(build.status)) {
      res.status(400).json({ error: 'Build cannot be cancelled in current state' });
      return;
    }

    // Cancel the build
    const cancelled = await buildService.cancelBuild(buildId);
    
    if (cancelled) {
      build.status = 'cancelled';
      build.updatedAt = new Date();
      await build.save();
      
      res.json({ message: 'Build cancelled successfully', status: 'cancelled' });
    } else {
      res.status(400).json({ error: 'Failed to cancel build' });
    }

  } catch (error) {
    next(error);
  }
});

/**
 * Get build statistics for user
 * GET /api/builds/stats
 */
router.get('/stats', authenticateToken, async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!._id.toString();

    const stats = await Build.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalBuilds = await Build.countDocuments({ userId });
    const recentBuilds = await Build.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('appId', 'name')
      .select('status platform buildType createdAt completedAt');

    const statusCounts = stats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {} as Record<string, number>);

    res.json({
      totalBuilds,
      statusCounts,
      recentBuilds
    });

  } catch (error) {
    next(error);
  }
});

export default router; 
