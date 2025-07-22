/**
 * @fileoverview Admin dashboard routes for platform statistics and monitoring
 * @author YosShor
 * @version 1.0.0
 * @requires express
 * @requires ../models/User
 * @requires ../models/App
 * @requires ../models/Build
 * @requires ../models/Lead
 * @requires ../middleware/auth
 */

import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import App from '../models/App';
import { Build } from '../models/Build';
import Lead from '../models/Lead';
import { authenticateToken, requireRole } from '../middleware/auth';
import { IAuthRequest } from '../types';

const router = Router();

/**
 * Get dashboard statistics
 * GET /api/dashboard/stats
 * @param {string} timeRange - Time range for statistics (7d, 30d, 90d)
 */
router.get('/stats', authenticateToken, requireRole('admin'), async (req: IAuthRequest, res: Response, next: NextFunction) => {
  try {
    const { timeRange = '30d' } = req.query;
    
    // Calculate date range
    const days = timeRange === '7d' ? 7 : timeRange === '90d' ? 90 : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Get total counts
    const [totalUsers, totalApps, totalBuilds, totalLeads] = await Promise.all([
      User.countDocuments({}),
      App.countDocuments({}),
      Build.countDocuments({}),
      Lead.countDocuments({})
    ]);

    // Get growth statistics (compare with previous period)
    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - days);
    
    const [
      currentPeriodUsers,
      previousPeriodUsers,
      currentPeriodApps,
      previousPeriodApps,
      currentPeriodBuilds,
      previousPeriodBuilds,
      currentPeriodLeads,
      previousPeriodLeads
    ] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: startDate } }),
      User.countDocuments({ createdAt: { $gte: previousStartDate, $lt: startDate } }),
      App.countDocuments({ createdAt: { $gte: startDate } }),
      App.countDocuments({ createdAt: { $gte: previousStartDate, $lt: startDate } }),
      Build.countDocuments({ createdAt: { $gte: startDate } }),
      Build.countDocuments({ createdAt: { $gte: previousStartDate, $lt: startDate } }),
      Lead.countDocuments({ createdAt: { $gte: startDate } }),
      Lead.countDocuments({ createdAt: { $gte: previousStartDate, $lt: startDate } })
    ]);

    // Calculate growth percentages
    const userGrowth = previousPeriodUsers > 0 
      ? Math.round(((currentPeriodUsers - previousPeriodUsers) / previousPeriodUsers) * 100)
      : currentPeriodUsers > 0 ? 100 : 0;
      
    const appGrowth = previousPeriodApps > 0 
      ? Math.round(((currentPeriodApps - previousPeriodApps) / previousPeriodApps) * 100)
      : currentPeriodApps > 0 ? 100 : 0;
      
    const buildGrowth = previousPeriodBuilds > 0 
      ? Math.round(((currentPeriodBuilds - previousPeriodBuilds) / previousPeriodBuilds) * 100)
      : currentPeriodBuilds > 0 ? 100 : 0;
      
    const leadGrowth = previousPeriodLeads > 0 
      ? Math.round(((currentPeriodLeads - previousPeriodLeads) / previousPeriodLeads) * 100)
      : currentPeriodLeads > 0 ? 100 : 0;

    // Get build success rate
    const completedBuilds = await Build.countDocuments({ status: 'completed' });
    const successfulBuilds = totalBuilds > 0 ? Math.round((completedBuilds / totalBuilds) * 100) : 0;

    // Get build queue status
    const [buildingCount, queuedCount, completedToday, failedToday] = await Promise.all([
      Build.countDocuments({ status: 'building' }),
      Build.countDocuments({ status: 'queued' }),
      Build.countDocuments({ 
        status: 'completed',
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      }),
      Build.countDocuments({ 
        status: 'failed',
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      })
    ]);

    // Get daily stats (last 24 hours)
    const last24Hours = new Date();
    last24Hours.setHours(last24Hours.getHours() - 24);
    
    const [newUsers, newApps, buildsStarted, leadsCaptured] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: last24Hours } }),
      App.countDocuments({ createdAt: { $gte: last24Hours } }),
      Build.countDocuments({ createdAt: { $gte: last24Hours } }),
      Lead.countDocuments({ createdAt: { $gte: last24Hours } })
    ]);

    res.json({
      totalUsers,
      totalApps,
      totalBuilds,
      totalLeads,
      userGrowth,
      appGrowth,
      buildGrowth,
      leadGrowth,
      successfulBuilds,
      buildQueue: {
        building: buildingCount,
        queued: queuedCount,
        completed: completedToday,
        failed: failedToday
      },
      dailyStats: {
        newUsers,
        newApps,
        buildsStarted,
        leadsCaptured
      }
    });
    return;

  } catch (error) {
    next(error);
    return;
  }
});

/**
 * Get recent activities
 * GET /api/dashboard/activities
 * @param {string} type - Activity type (overview, builds, leads, users)
 * @param {number} limit - Number of items to return
 */
router.get('/activities', authenticateToken, requireRole('admin'), async (req: IAuthRequest, res: Response, next: NextFunction) => {
  try {
    const { type = 'overview', limit = 10 } = req.query;
    const limitNum = parseInt(limit as string);

    let result: any = {};

    if (type === 'builds' || type === 'overview') {
      // Get recent builds with app information
      const builds = await Build.find({})
        .populate('appId', 'name')
        .sort({ createdAt: -1 })
        .limit(limitNum)
        .select('status platform createdAt completedAt appId');

      result.builds = builds.map((build: any) => ({
        id: build._id,
        status: build.status,
        platform: build.platform,
        appName: (build.appId as any)?.name || 'Unknown App',
        createdAt: build.createdAt,
        completedAt: build.updatedAt
      }));
    }

    if (type === 'leads' || type === 'overview') {
      // Get recent leads with app information
      const leads = await Lead.find({})
        .populate('appId', 'name')
        .sort({ createdAt: -1 })
        .limit(limitNum)
        .select('email name phone appId deviceInfo source createdAt');

      result.leads = leads.map(lead => ({
        id: lead._id,
        email: lead.email,
        name: lead.name,
        phone: lead.phone,
        appName: (lead.appId as any)?.name || 'Unknown App',
        deviceInfo: lead.deviceInfo,
        source: lead.source,
        createdAt: lead.createdAt
      }));
    }

    if (type === 'users' || type === 'overview') {
      // Get recent users
      const users = await User.find({})
        .sort({ createdAt: -1 })
        .limit(limitNum)
        .select('firstName lastName email isEmailVerified createdAt role');

      result.users = users.map(user => ({
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        role: user.role,
        createdAt: user.createdAt
      }));
    }

    res.json(result);
    return;

  } catch (error) {
    next(error);
    return;
  }
});

/**
 * Get build logs for a specific build
 * GET /api/dashboard/builds/:buildId/logs
 */
router.get('/builds/:buildId/logs', authenticateToken, requireRole('admin'), async (req: IAuthRequest, res: Response, next: NextFunction) => {
  try {
    const { buildId } = req.params;

    const build = await Build.findById(buildId)
      .populate('appId', 'name packageId bundleId')
      .populate('userId', 'firstName lastName email')
      .select('status platform logs createdAt completedAt config');

    if (!build) {
      return res.status(404).json({ error: 'Build not found' });
    }

    res.json({
      buildId: build._id,
      status: build.status,
      platform: build.platform,
      app: build.appId,
      user: build.userId,
      createdAt: build.createdAt,
      completedAt: build.updatedAt,
      logs: (build as any).logs || [],
      config: {
        packageId: (build as any).config?.packageId,
        bundleId: (build as any).config?.bundleId,
        version: (build as any).config?.version,
        name: (build as any).config?.name
      }
    });
    return;

  } catch (error) {
    next(error);
    return;
  }
});

/**
 * Get lead details with analytics
 * GET /api/dashboard/leads/:leadId
 */
router.get('/leads/:leadId', authenticateToken, requireRole('admin'), async (req: IAuthRequest, res: Response, next: NextFunction) => {
  try {
    const { leadId } = req.params;

    const lead = await Lead.findById(leadId)
      .populate('appId', 'name websiteUrl packageId')
      .select('email name phone appId deviceInfo location source analytics createdAt');

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    res.json({
      leadId: lead._id,
      email: lead.email,
      name: lead.name,
      phone: lead.phone,
      app: lead.appId,
      deviceInfo: lead.deviceInfo,
      location: lead.location,
      source: lead.source,
      analytics: (lead as any).analytics || {},
      createdAt: lead.createdAt
    });
    return;

  } catch (error) {
    next(error);
    return;
  }
});

/**
 * Export data endpoints
 */

/**
 * Export users data as CSV
 * GET /api/dashboard/export/users
 */
router.get('/export/users', authenticateToken, requireRole('admin'), async (req: IAuthRequest, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter: any = {};
    if (startDate) dateFilter.$gte = new Date(startDate as string);
    if (endDate) dateFilter.$lte = new Date(endDate as string);
    
    const query = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};

    const users = await User.find(query)
      .select('firstName lastName email role isEmailVerified createdAt lastLogin')
      .sort({ createdAt: -1 });

    // Convert to CSV format
    const headers = ['Name', 'Email', 'Role', 'Email Verified', 'Created At', 'Last Login'];
    const csvData = [
      headers.join(','),
      ...users.map(user => [
        `"${user.firstName} ${user.lastName}"`,
        user.email,
        user.role,
        user.isEmailVerified,
        user.createdAt.toISOString(),
        user.lastLogin ? user.lastLogin.toISOString() : 'Never'
      ].join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=users-export.csv');
    res.send(csvData);

  } catch (error) {
    next(error);
  }
});

/**
 * Export leads data as CSV
 * GET /api/dashboard/export/leads
 */
router.get('/export/leads', authenticateToken, requireRole('admin'), async (req: IAuthRequest, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter: any = {};
    if (startDate) dateFilter.$gte = new Date(startDate as string);
    if (endDate) dateFilter.$lte = new Date(endDate as string);
    
    const query = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};

    const leads = await Lead.find(query)
      .populate('appId', 'name')
      .select('email name phone appId deviceInfo source createdAt')
      .sort({ createdAt: -1 });

    // Convert to CSV format
    const headers = ['Name', 'Email', 'Phone', 'App Name', 'Device Platform', 'Country', 'Source', 'Created At'];
    const csvData = [
      headers.join(','),
      ...leads.map(lead => [
        `"${lead.name || ''}"`,
        lead.email || '',
        lead.phone || '',
        `"${(lead.appId as any)?.name || 'Unknown'}"`,
        lead.deviceInfo?.platform || '',
        lead.deviceInfo?.model || '',
        lead.source || '',
        lead.createdAt.toISOString()
      ].join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=leads-export.csv');
    res.send(csvData);

  } catch (error) {
    next(error);
  }
});

/**
 * Export build logs as JSON
 * GET /api/dashboard/export/builds
 */
router.get('/export/builds', authenticateToken, requireRole('admin'), async (req: IAuthRequest, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate, status } = req.query;
    
    const query: any = {};
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate as string);
      if (endDate) query.createdAt.$lte = new Date(endDate as string);
    }
    
    if (status) {
      query.status = status;
    }

    const builds = await Build.find(query)
      .populate('appId', 'name packageId')
      .populate('userId', 'email firstName lastName')
      .select('status platform logs createdAt completedAt config')
      .sort({ createdAt: -1 });

    const exportData = builds.map((build: any) => ({
      buildId: build._id,
      status: build.status,
      platform: build.platform,
      app: {
        name: (build.appId as any)?.name,
        packageId: (build.appId as any)?.packageId
      },
      user: {
        email: (build.userId as any)?.email,
        name: `${(build.userId as any)?.firstName} ${(build.userId as any)?.lastName}`
      },
      createdAt: build.createdAt,
      completedAt: build.updatedAt,
      logs: (build as any).logs || [],
      config: (build as any).config || {}
    }));

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=builds-export.json');
    res.json(exportData);

  } catch (error) {
    next(error);
  }
});

export default router; 
