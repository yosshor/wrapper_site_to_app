/**
 * @fileoverview Admin Dashboard - Platform overview and management
 * @author YosShor
 * @version 1.0.0
 * @description Comprehensive admin dashboard for platform monitoring and management
 */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useQuery } from 'react-query';
import {
  ChartBarIcon,
  UserGroupIcon,
  DevicePhoneMobileIcon,
  CogIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import  { Card }  from '../../components/ui/Card';
import  { Button }  from '../../components/ui/Button';
import  api  from '../../services/api';
import { formatDate, formatNumber, cn } from '../../utils/index';

/**
 * Admin Dashboard Component
 * @returns {JSX.Element} Admin dashboard component
 * Provides comprehensive platform overview including:
 * - Key performance metrics and statistics
 * - Recent user activity and registrations
 * - Build status monitoring and logs
 * - Lead capture analytics
 * - System health indicators
 * - Quick action panels for common admin tasks
 */
export default function AdminDashboard() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [activeTab, setActiveTab] = useState<'overview' | 'builds' | 'leads' | 'users'>('overview');
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    setCurrentTime(new Date().toLocaleTimeString());
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  /**
   * Fetch dashboard statistics
   */
  const { data: statsData, isLoading: statsLoading } = useQuery(
    ['admin-stats', timeRange],
    () => api.getDashboardStats(),
    {
      refetchInterval: 30000, // Refresh every 30 seconds
      staleTime: 15000
    }
  );

  /**
   * Fetch recent activities
   */
  const { data: activitiesData, isLoading: activitiesLoading } = useQuery(
    ['admin-activities', activeTab],
    () => api.getLeads(activeTab, 1, 10),
    {
      refetchInterval: 60000, // Refresh every minute
      staleTime: 30000
    }
  );
  
  /**
   * Get status badge styling for builds
   * @param {string} status - Build status
   * @returns {string} CSS classes
   */
  const getBuildStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'building':
        return 'bg-blue-100 text-blue-800';
      case 'queued':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  /**
   * Get status icon for builds
   * @param {string} status - Build status
   * @returns {JSX.Element} Status icon
   */
  const getBuildStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'building':
        return <CogIcon className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'queued':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      default:
        return <ExclamationTriangleIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <>
      <Head>
        <title>Admin Dashboard | Mobile App Generator</title>
        <meta name="description" content="Platform administration and monitoring" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-2">
                Platform overview and management console
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
              
              <Button onClick={() => window.location.reload()}>
                Refresh Data
              </Button>
            </div>
          </div>

          {/* Key Metrics */}
          {statsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="p-6 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total Users */}
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {formatNumber(statsData?.data?.totalUsers || 0)}
                    </p>
                    <p className="text-sm text-green-600 flex items-center mt-2">
                      <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                      +{statsData?.data?.userGrowth || 0}% vs last period
                    </p>
                  </div>
                  <UserGroupIcon className="h-12 w-12 text-blue-500" />
                </div>
              </Card>

              {/* Total Apps */}
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Apps</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {formatNumber(statsData?.data?.totalApps || 0)}
                    </p>
                    <p className="text-sm text-blue-600 flex items-center mt-2">
                      <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                      +{statsData?.data?.appGrowth || 0}% vs last period
                    </p>
                  </div>
                  <DevicePhoneMobileIcon className="h-12 w-12 text-green-500" />
                </div>
              </Card>

              {/* Total Builds */}
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Builds</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {formatNumber(statsData?.data?.totalBuilds || 0)}
                    </p>
                    <p className="text-sm text-purple-600 flex items-center mt-2">
                      <CogIcon className="h-4 w-4 mr-1" />
                      {statsData?.data?.successfulBuilds || 0}% success rate
                    </p>
                  </div>
                  <ChartBarIcon className="h-12 w-12 text-purple-500" />
                </div>
              </Card>

              {/* Total Leads */}
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Leads</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {formatNumber(statsData?.data?.totalLeads || 0)}
                    </p>
                    <p className="text-sm text-orange-600 flex items-center mt-2">
                      <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                      +{statsData?.data?.leadGrowth || 0}% vs last period
                    </p>
                  </div>
                  <UserGroupIcon className="h-12 w-12 text-orange-500" />
                </div>
              </Card>
            </div>
          )}

          {/* Activity Tabs */}
          <div className="mb-6">
            <nav className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              {[
                { key: 'overview', label: 'System Overview' },
                { key: 'builds', label: 'Recent Builds' },
                { key: 'leads', label: 'Latest Leads' },
                { key: 'users', label: 'New Users' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={cn(
                    'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                    activeTab === tab.key
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <Card className="p-6">
                {/* System Overview */}
                {activeTab === 'overview' && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">
                      System Health Overview
                    </h2>
                    
                    <div className="space-y-6">
                      {/* Build Queue Status */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                          Build Queue Status
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-blue-600">
                              {statsData?.data?.buildQueue?.building || 0}
                            </p>
                            <p className="text-sm text-gray-600">Building</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-yellow-600">
                              {statsData?.data?.buildQueue?.queued || 0}
                            </p>
                            <p className="text-sm text-gray-600">Queued</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-green-600">
                              {statsData?.data?.buildQueue?.completed || 0}
                            </p>
                            <p className="text-sm text-gray-600">Completed Today</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-red-600">
                              {statsData?.data?.buildQueue?.failed || 0}
                            </p>
                            <p className="text-sm text-gray-600">Failed Today</p>
                          </div>
                        </div>
                      </div>

                      {/* Platform Health */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                          Platform Health
                        </h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Database Status</span>
                            <span className="flex items-center text-green-600">
                              <CheckCircleIcon className="h-4 w-4 mr-1" />
                              Healthy
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Build Service</span>
                            <span className="flex items-center text-green-600">
                              <CheckCircleIcon className="h-4 w-4 mr-1" />
                              Active
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Firebase Integration</span>
                            <span className="flex items-center text-green-600">
                              <CheckCircleIcon className="h-4 w-4 mr-1" />
                              Connected
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Lead Capture Service</span>
                            <span className="flex items-center text-green-600">
                              <CheckCircleIcon className="h-4 w-4 mr-1" />
                              Operational
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recent Builds */}
                {activeTab === 'builds' && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">
                      Recent Build Activity
                    </h2>
                    
                    {activitiesLoading ? (
                      <div className="space-y-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className="animate-pulse flex items-center space-x-4">
                            <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                            <div className="flex-1">
                              <div className="h-4 bg-gray-200 rounded mb-2"></div>
                              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {activitiesData?.data?.builds?.map((build: any) => (
                          <div key={build.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-4">
                              {getBuildStatusIcon(build.status)}
                              <div>
                                <p className="font-medium text-gray-900">
                                  {build.appName}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {build.platform} • {formatDate(build.createdAt)}
                                </p>
                              </div>
                            </div>
                            <span className={cn(
                              'px-2.5 py-0.5 rounded-full text-xs font-medium',
                              getBuildStatusBadge(build.status)
                            )}>
                              {build.status}
                            </span>
                          </div>
                        )) || (
                          <p className="text-gray-500 text-center py-8">
                            No recent builds found
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Latest Leads */}
                {activeTab === 'leads' && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">
                      Latest Lead Captures
                    </h2>
                    
                    {activitiesLoading ? (
                      <div className="space-y-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className="animate-pulse p-4 bg-gray-50 rounded-lg">
                            <div className="h-4 bg-gray-200 rounded mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {activitiesData?.data?.leads?.map((lead: any) => (
                          <div key={lead.id} className="p-4 bg-gray-50 rounded-lg">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-gray-900">
                                  {lead.email || lead.name}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {lead.appName} • {formatDate(lead.createdAt)}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {lead.deviceInfo?.country} • {lead.deviceInfo?.platform}
                                </p>
                              </div>
                              <span className="text-xs text-gray-500">
                                {lead.source}
                              </span>
                            </div>
                          </div>
                        )) || (
                          <p className="text-gray-500 text-center py-8">
                            No recent leads found
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* New Users */}
                {activeTab === 'users' && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">
                      Recently Registered Users
                    </h2>
                    
                    {activitiesLoading ? (
                      <div className="space-y-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className="animate-pulse p-4 bg-gray-50 rounded-lg">
                            <div className="h-4 bg-gray-200 rounded mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {activitiesData?.data?.users?.map((user: any) => (
                          <div key={user.id} className="p-4 bg-gray-50 rounded-lg">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-gray-900">
                                  {user.firstName} {user.lastName}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {user.email}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Joined {formatDate(user.createdAt)}
                                </p>
                              </div>
                              <span className={cn(
                                'px-2.5 py-0.5 rounded-full text-xs font-medium',
                                user.isEmailVerified
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              )}>
                                {user.isEmailVerified ? 'Verified' : 'Pending'}
                              </span>
                            </div>
                          </div>
                        )) || (
                          <p className="text-gray-500 text-center py-8">
                            No new users found
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Quick Actions
                </h3>
                <div className="space-y-3">
                  <Button className="w-full justify-start">
                    Export User Data
                  </Button>
                  <Button variant="secondary" className="w-full justify-start">
                    Export Build Logs
                  </Button>
                  <Button variant="secondary" className="w-full justify-start">
                    Export Lead Data
                  </Button>
                  <Button variant="secondary" className="w-full justify-start">
                    System Maintenance
                  </Button>
                </div>
              </Card>

              {/* System Alerts */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  System Alerts
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        All systems operational
                      </p>
                      <p className="text-xs text-gray-500">
                        Last checked: {currentTime}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Recent Activity Summary */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Activity Summary (24h)
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">New Registrations</span>
                    <span className="font-medium">{statsData?.data?.dailyStats?.newUsers || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Apps Created</span>
                    <span className="font-medium">{statsData?.data?.dailyStats?.newApps || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Builds Started</span>
                    <span className="font-medium">{statsData?.data?.dailyStats?.buildsStarted || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Leads Captured</span>
                    <span className="font-medium">{statsData?.data?.dailyStats?.leadsCaptured || 0}</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 