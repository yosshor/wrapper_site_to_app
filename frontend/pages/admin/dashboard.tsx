/**
 * @fileoverview Admin Dashboard - Platform overview and management
 * @author YosShor
 * @version 1.0.0
 * @description Comprehensive admin dashboard for platform monitoring and management
 */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
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
import { DashboardStats, DashboardActivities } from '../../types';

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
  const router = useRouter();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [activeTab, setActiveTab] = useState<'overview' | 'builds' | 'leads' | 'users'>('overview');
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedBuild, setSelectedBuild] = useState<any>(null);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showBuildModal, setShowBuildModal] = useState<boolean>(false);
  const [showLeadModal, setShowLeadModal] = useState<boolean>(false);
  const [showUserModal, setShowUserModal] = useState<boolean>(false);

  useEffect(() => {
    setCurrentTime(new Date().toLocaleTimeString());
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Check authentication on component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/auth/login?redirect=/admin/dashboard');
          return;
        }

        // Verify token and check if user is admin
        const response = await api.getProfile();
        if (response.data?.user?.role !== 'admin') {
          console.error('Access denied: User is not an admin');
          router.push('/auth/login?redirect=/admin/dashboard');
          return;
        }

        setIsAuthenticated(true);
      } catch (error) {
        console.error('Authentication error:', error);
        router.push('/auth/login?redirect=/admin/dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  /**
   * Fetch dashboard statistics
   */
  const { data: statsData, isLoading: statsLoading } = useQuery<DashboardStats>(
    ['admin-stats', timeRange],
    () => api.getDashboardStats(),
    {
      refetchInterval: 30000, // Refresh every 30 seconds
      staleTime: 15000,
      enabled: isAuthenticated, // Only fetch if authenticated
    }
  );

  /**
   * Fetch recent activities
   */
  const { data: activitiesData, isLoading: activitiesLoading } = useQuery<DashboardActivities>(
    ['admin-activities', activeTab],
    () => api.getActivities(activeTab, 10),
    {
      refetchInterval: 60000, // Refresh every minute
      staleTime: 30000,
      enabled: isAuthenticated, // Only fetch if authenticated
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
   * @returns {JSX.Element} Status icon component
   */
  const getBuildStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'building':
        return <ClockIcon className="h-5 w-5 text-blue-500" />;
      case 'queued':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'cancelled':
        return <XCircleIcon className="h-5 w-5 text-gray-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  // Show access denied if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">You need admin privileges to access this page.</p>
          <Button onClick={() => router.push('/auth/login')}>
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Admin Dashboard - MobileGen</title>
        <meta name="description" content="Admin dashboard for MobileGen platform management" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-600">Platform overview and management</p>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">
                  Last updated: {currentTime}
                </span>
                <Button
                  variant="secondary"
                  onClick={() => {
                    localStorage.removeItem('token');
                    router.push('/auth/login');
                  }}
                >
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content Area */}
            <div className="lg:col-span-3 space-y-8">
              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <UserGroupIcon className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Users</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {statsLoading ? '...' : formatNumber(statsData?.totalUsers || 0)}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <DevicePhoneMobileIcon className="h-8 w-8 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Apps Created</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {statsLoading ? '...' : formatNumber(statsData?.totalApps || 0)}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <CogIcon className="h-8 w-8 text-yellow-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Active Builds</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {statsLoading ? '...' : formatNumber(statsData?.buildQueue?.building || 0)}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <ChartBarIcon className="h-8 w-8 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Leads Captured</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {statsLoading ? '...' : formatNumber(statsData?.totalLeads || 0)}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Activity Tabs */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
                  <div className="flex space-x-2">
                    {['overview', 'builds', 'leads', 'users'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={cn(
                          'px-3 py-2 text-sm font-medium rounded-md transition-colors',
                          activeTab === tab
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-500 hover:text-gray-700'
                        )}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {activitiesLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-500 mt-2">Loading activities...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeTab === 'overview' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Builds</h3>
                          {activitiesData?.builds && activitiesData.builds.length > 0 ? (
                            <div className="space-y-3">
                              {activitiesData.builds.slice(0, 5).map((build: any, index: number) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                  <div className="flex items-center space-x-3">
                                    {getBuildStatusIcon(build.status)}
                                    <div>
                                      <p className="font-medium text-gray-900">{build.appName}</p>
                                      <p className="text-sm text-gray-500">{build.platform}</p>
                                    </div>
                                  </div>
                                  <span className={cn('px-2 py-1 rounded-full text-xs font-medium', getBuildStatusBadge(build.status))}>
                                    {build.status}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-500 text-center py-4">No recent builds</p>
                          )}
                        </div>

                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Users</h3>
                          {activitiesData?.users && activitiesData.users.length   > 0 ? (
                            <div className="space-y-3">
                              {activitiesData.users.slice(0, 5).map((user: any, index: number) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                  <div>
                                    <p className="font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                                    <p className="text-sm text-gray-500">{user.email}</p>
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
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-500 text-center py-4">No new users found</p>
                          )}
                        </div>
                      </div>
                    )}

                    {activeTab === 'builds' && (
                      <div className="space-y-4">
                        {activitiesData?.builds && activitiesData.builds.length > 0 ? ( 
                          activitiesData.builds.map((build: any, index: number) => (
                            <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                              <div className="flex items-center space-x-4">
                                {getBuildStatusIcon(build.status)}
                                <div>
                                  <h4 className="font-medium text-gray-900">{build.appName}</h4>
                                  <p className="text-sm text-gray-500">
                                    {build.platform} • {formatDate(build.createdAt)}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-4">
                                <span className={cn('px-3 py-1 rounded-full text-sm font-medium', getBuildStatusBadge(build.status))}>
                                  {build.status}
                                </span>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedBuild(build);
                                    setShowBuildModal(true);
                                  }}
                                >
                                  View Details
                                </Button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-500 text-center py-8">No builds found</p>
                        )}
                      </div>
                    )}

                    {activeTab === 'leads' && (
                      <div className="space-y-4">
                        {activitiesData?.leads && activitiesData.leads.length > 0 ? (
                          activitiesData.leads.map((lead: any, index: number) => (
                            <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                              <div>
                                <h4 className="font-medium text-gray-900">{lead.name}</h4>
                                <p className="text-sm text-gray-500">{lead.email}</p>
                                <p className="text-sm text-gray-500">{lead.appName}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-gray-500">{formatDate(lead.createdAt)}</p>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedLead(lead);
                                    setShowLeadModal(true);
                                  }}
                                >
                                  View Details
                                </Button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-500 text-center py-8">No leads found</p>
                        )}
                      </div>
                    )}

                    {activeTab === 'users' && (
                      <div className="space-y-4">
                        {activitiesData?.users && activitiesData.users.length > 0 ? (
                          activitiesData.users.map((user: any, index: number) => (
                            <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                              <div>
                                <h4 className="font-medium text-gray-900">{user.firstName} {user.lastName}</h4>
                                <p className="text-sm text-gray-500">{user.email}</p>
                                <p className="text-sm text-gray-500">Role: {user.role}</p>
                              </div>
                              <div className="flex items-center space-x-4">
                                <span className={cn(
                                  'px-2.5 py-0.5 rounded-full text-xs font-medium',
                                  user.isEmailVerified
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                )}>
                                  {user.isEmailVerified ? 'Verified' : 'Pending'}
                                </span>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setShowUserModal(true);
                                  }}
                                >
                                  View Profile
                                </Button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-500 text-center py-8">No users found</p>
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
                    <span className="font-medium">{statsData?.dailyStats?.newUsers || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Apps Created</span>
                        <span className="font-medium">{statsData?.dailyStats?.newApps || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Builds Started</span>
                    <span className="font-medium">{statsData?.dailyStats?.buildsStarted || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Leads Captured</span>
                    <span className="font-medium">{statsData?.dailyStats?.leadsCaptured || 0}</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Build Details Modal */}
      {showBuildModal && selectedBuild && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Build Details</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBuildModal(false)}
              >
                ✕
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">App Name</label>
                  <p className="text-sm text-gray-900">{selectedBuild.appName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Platform</label>
                  <p className="text-sm text-gray-900">{selectedBuild.platform}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={cn('px-2 py-1 rounded-full text-xs font-medium', getBuildStatusBadge(selectedBuild.status))}>
                    {selectedBuild.status}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created</label>
                  <p className="text-sm text-gray-900">{formatDate(selectedBuild.createdAt)}</p>
                </div>
                {selectedBuild.completedAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Completed</label>
                    <p className="text-sm text-gray-900">{formatDate(selectedBuild.completedAt)}</p>
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Build Logs</h3>
                <div className="bg-gray-100 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">
                    {selectedBuild.status === 'completed' 
                      ? '✅ Build completed successfully'
                      : selectedBuild.status === 'failed'
                      ? '❌ Build failed - check error logs below'
                      : '⏳ Build in progress...'
                    }
                  </p>
                  {selectedBuild.status === 'failed' && (
                    <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded">
                      <p className="text-sm text-red-800">
                        Error: Build process failed. Check the build configuration and try again.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowBuildModal(false)}
                >
                  Close
                </Button>
                {selectedBuild.status === 'completed' && (
                  <Button>
                    Download Build
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lead Details Modal */}
      {showLeadModal && selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Lead Details</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLeadModal(false)}
              >
                ✕
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <p className="text-sm text-gray-900">{selectedLead.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="text-sm text-gray-900">{selectedLead.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">App</label>
                  <p className="text-sm text-gray-900">{selectedLead.appName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Source</label>
                  <p className="text-sm text-gray-900">{selectedLead.source}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created</label>
                  <p className="text-sm text-gray-900">{formatDate(selectedLead.createdAt)}</p>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowLeadModal(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">User Profile</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowUserModal(false)}
              >
                ✕
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <p className="text-sm text-gray-900">{selectedUser.firstName} {selectedUser.lastName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="text-sm text-gray-900">{selectedUser.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <p className="text-sm text-gray-900">{selectedUser.role}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={cn(
                    'px-2 py-1 rounded-full text-xs font-medium',
                    selectedUser.isEmailVerified
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  )}>
                    {selectedUser.isEmailVerified ? 'Verified' : 'Pending'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created</label>
                  <p className="text-sm text-gray-900">{formatDate(selectedUser.createdAt)}</p>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowUserModal(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 