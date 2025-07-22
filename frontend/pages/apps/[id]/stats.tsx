/**
 * @fileoverview App Statistics Page
 * @author YosShor
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useQuery } from 'react-query';
import {
  ChartBarIcon,
  UserGroupIcon,
  ClockIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import api from '@/services/api';
import { formatDate } from '@/utils';

export default function AppStats() {
  const router = useRouter();
  const { id } = router.query;
  const { showToast } = useToast();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const { data: statsData, isLoading } = useQuery(
    ['app-stats', id],
    () => api.apps.getStats(id as string),
    {
      enabled: !!id,
      onError: (err: any) => {
        showToast(err.response?.data?.error || 'Failed to load app statistics', 'error');
        router.push(`/apps/${id}`);
      }
    }
  );

  const stats = statsData?.data?.stats;
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="p-4">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded"></div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>App Statistics | Mobile App Generator</title>
        <meta name="description" content="App statistics and analytics" />
      </Head>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">App Statistics</h1>
            <Button
              variant="outline"
              onClick={() => router.push(`/apps/${id}`)}
              className="flex items-center"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Back to App
            </Button>
          </div>

          {isClient && (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Total Builds</p>
                      <p className="text-2xl font-semibold">{stats?.builds?.total || 0}</p>
                    </div>
                    <ChartBarIcon className="h-8 w-8 text-blue-500" />
                  </div>
                  <div className="mt-2">
                    <span className="text-sm text-green-600">
                      {stats?.builds?.successful || 0} successful
                    </span>
                    <span className="text-sm text-red-600 ml-2">
                      {stats?.builds?.failed || 0} failed
                    </span>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Total Leads</p>
                      <p className="text-2xl font-semibold">{stats?.leads?.total || 0}</p>
                    </div>
                    <UserGroupIcon className="h-8 w-8 text-green-500" />
                  </div>
                  <div className="mt-2">
                    <span className="text-sm text-blue-600">
                      {stats?.leads?.recent || 0} in last 7 days
                    </span>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Success Rate</p>
                      <p className="text-2xl font-semibold">
                        {stats?.performance?.successRate?.toFixed(1) || 0}%
                      </p>
                    </div>
                    <ChartBarIcon className="h-8 w-8 text-purple-500" />
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Active Users</p>
                      <p className="text-2xl font-semibold">{stats?.performance?.activeUsers || 0}</p>
                    </div>
                    <UserGroupIcon className="h-8 w-8 text-orange-500" />
                  </div>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Build Trends</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={stats?.builds?.buildTrend || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="total" stroke="#3B82F6" name="Total Builds" />
                        <Line type="monotone" dataKey="successful" stroke="#10B981" name="Successful" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Platform Distribution</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Android', value: stats?.builds?.platforms?.android || 0 },
                            { name: 'iOS', value: stats?.builds?.platforms?.ios || 0 }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label
                        >
                          {[0, 1].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Recent Builds</h3>
                  <div className="space-y-4">
                    {stats?.builds?.recentBuilds?.map((build: any) => (
                      <div key={build.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <div className={`w-2 h-2 rounded-full mr-3 ${
                            build.status === 'completed' ? 'bg-green-500' : 'bg-red-500'
                          }`} />
                          <div>
                            <p className="text-sm font-medium">{build.platform}</p>
                            <p className="text-xs text-gray-500">{formatDate(build.createdAt)}</p>
                          </div>
                        </div>
                        <span className="text-sm">{build.duration}s</span>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Recent Leads</h3>
                  <div className="space-y-4">
                    {stats?.leads?.recentLeads?.map((lead: any) => (
                      <div key={lead.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium">{lead.source}</p>
                          <p className="text-xs text-gray-500">{formatDate(lead.createdAt)}</p>
                        </div>
                        <span className={`text-sm px-2 py-1 rounded ${
                          lead.status === 'converted' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {lead.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}