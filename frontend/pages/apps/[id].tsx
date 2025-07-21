/**
 * @fileoverview App Detail Page
 * @author YosShor
 * @version 1.0.0
 */

import React from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useQuery } from 'react-query';
import api from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { formatDate } from '@/utils';

import {
  GlobeAltIcon,
  CubeIcon,
  TagIcon,
  ClockIcon,
  FireIcon,
  RocketLaunchIcon,
  ChartBarIcon,
  BellIcon,
  DocumentDuplicateIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
  CogIcon,
  DevicePhoneMobileIcon,
  SignalIcon,
  UserGroupIcon,
  PresentationChartLineIcon,
  CalendarIcon,
  ArrowLeftIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';


// Helper function to format status
const formatStatus = (status?: string) => {
  if (!status) return 'Unknown';
  return status.charAt(0).toUpperCase() + status.slice(1);
};

// Helper function to get status color
const getStatusColor = (status?: string) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'draft':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function AppDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { showToast } = useToast();

  // Fetch app data
  const { data: response, isLoading, error } = useQuery(
    ['app', id],
    () => api.apps.get(id as string),
    {
      enabled: !!id,
      onError: (err: any) => {
        showToast(err.response?.data?.error || 'Failed to load app', 'error');
        router.push('/apps');
      }
    }
  );

  if (isLoading || !response?.data) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <Card>
              <div className="h-4 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              App Not Found
            </h1>
            <p className="text-gray-600 mb-8">
              The app you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Button onClick={() => router.push('/apps')}>
              Back to Apps
            </Button>
          </div>
        </div>
      </div>
    );
  }


  const app = response.data.app;
  console.log('App data:', app);
  return (
    <>
      <Head>
        <title>{app.name || 'App Details'} | Mobile App Generator</title>
        <meta name="description" content={app.description || `Details for ${app.name || 'app'}`} />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex justify-between items-start">
              <div className="flex items-start space-x-4">
                <div className="bg-blue-100 rounded-lg p-3">
                  <DevicePhoneMobileIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {app.name}
                  </h1>
                  <p className="text-gray-600 flex items-center">
                    <GlobeAltIcon className="h-5 w-5 mr-2 text-gray-400" />
                    {app.description || app.websiteUrl}
                  </p>
                  <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                    <span className="flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      Created {formatDate(app.createdAt)}
                    </span>
                    <span className="flex items-center">
                      <ChartBarIcon className="h-4 w-4 mr-1" />
                      {app.totalBuilds} builds
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => router.push('/apps')}
                  className="flex items-center"
                >
                  <ArrowLeftIcon className="h-5 w-5 mr-2" />
                  Back to Apps
                </Button>
                <Button
                  onClick={() => router.push(`/apps/${app.id}/build`)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center"
                >
                  <RocketLaunchIcon className="h-5 w-5 mr-2" />
                  Build App
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="p-4 flex items-center space-x-3">
              <div className="bg-green-100 rounded-lg p-2">
                <ChartBarIcon className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Builds</p>
                <p className="text-xl font-semibold">{app.totalBuilds}</p>
              </div>
            </Card>
            <Card className="p-4 flex items-center space-x-3">
              <div className="bg-blue-100 rounded-lg p-2">
                <ArrowPathIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="text-xl font-semibold">{formatStatus(app.status)}</p>
              </div>
            </Card>
            <Card className="p-4 flex items-center space-x-3">
              <div className="bg-purple-100 rounded-lg p-2">
                <UserGroupIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Installs</p>
                <p className="text-xl font-semibold">{app.totalInstalls || 0}</p>
              </div>
            </Card>
            <Card className="p-4 flex items-center space-x-3">
              <div className="bg-orange-100 rounded-lg p-2">
                <PresentationChartLineIcon className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Downloads</p>
                <p className="text-xl font-semibold">{app.totalDownloads || 0}</p>
              </div>
            </Card>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Basic Information */}
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-6">
                <CogIcon className="h-6 w-6 text-gray-400 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Basic Information
                </h2>
              </div>
              <dl className="space-y-4">
                <div className="flex items-start">
                  <dt className="flex items-center text-sm font-medium text-gray-500 min-w-[120px]">
                    <GlobeAltIcon className="h-5 w-5 mr-2 text-gray-400" />
                    Website URL
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 flex-1">{app.websiteUrl}</dd>
                </div>
                <div className="flex items-start">
                  <dt className="flex items-center text-sm font-medium text-gray-500 min-w-[120px]">
                    <CubeIcon className="h-5 w-5 mr-2 text-gray-400" />
                    Package ID
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 flex-1">{app.androidPackageId}</dd>
                </div>
                <div className="flex items-start">
                  <dt className="flex items-center text-sm font-medium text-gray-500 min-w-[120px]">
                    <TagIcon className="h-5 w-5 mr-2 text-gray-400" />
                    Bundle ID
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 flex-1">{app.iosPackageId}</dd>
                </div>
                <div className="flex items-start">
                  <dt className="flex items-center text-sm font-medium text-gray-500 min-w-[120px]">
                    <ClockIcon className="h-5 w-5 mr-2 text-gray-400" />
                    Status
                  </dt>
                  <dd className="mt-1">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(app.status)}`}>
                      {formatStatus(app.status)}
                    </span>
                  </dd>
                </div>
              </dl>
            </Card>

            {/* Features */}
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-6">
                <WrenchScrewdriverIcon className="h-6 w-6 text-gray-400 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Features & Integrations
                </h2>
              </div>
              <dl className="space-y-6">
                <div>
                  <dt className="flex items-center text-sm font-medium text-gray-500 mb-2">
                    <FireIcon className="h-5 w-5 mr-2 text-orange-400" />
                    Firebase
                  </dt>
                  <dd className="mt-1">
                    <div className="space-y-2">
                      <div className="flex items-center bg-orange-50 rounded-lg p-2">
                        <span className={`h-2.5 w-2.5 rounded-full mr-2 ${app.config.firebaseEnabled ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                        <span className="text-sm text-gray-900">{app.config.firebaseEnabled ? 'Enabled' : 'Disabled'}</span>
                      </div>
                      {app.config.firebaseEnabled && app.config.firebaseConfig && (
                        <div className="pl-4 space-y-2">
                          <div className="flex items-center">
                            <ChartBarIcon className="h-4 w-4 mr-2 text-blue-500" />
                            <span className="text-sm text-gray-600">Analytics</span>
                            <span className={`ml-auto h-2 w-2 rounded-full ${app.config.firebaseConfig.analyticsEnabled ? 'bg-blue-400' : 'bg-gray-300'}`}></span>
                          </div>
                          <div className="flex items-center">
                            <ShieldCheckIcon className="h-4 w-4 mr-2 text-green-500" />
                            <span className="text-sm text-gray-600">Crashlytics</span>
                            <span className={`ml-auto h-2 w-2 rounded-full ${app.config.firebaseConfig.crashlyticsEnabled ? 'bg-blue-400' : 'bg-gray-300'}`}></span>
                          </div>
                          <div className="flex items-center">
                            <BellIcon className="h-4 w-4 mr-2 text-purple-500" />
                            <span className="text-sm text-gray-600">Push Notifications</span>
                            <span className={`ml-auto h-2 w-2 rounded-full ${app.config.firebaseConfig.messagingEnabled ? 'bg-blue-400' : 'bg-gray-300'}`}></span>
                          </div>
                        </div>
                      )}
                    </div>
                  </dd>
                </div>

                <div>
                  <dt className="flex items-center text-sm font-medium text-gray-500 mb-2">
                    <SignalIcon className="h-5 w-5 mr-2 text-blue-400" />
                    AppsFlyer
                  </dt>
                  <dd className="mt-1">
                    <div className="flex items-center bg-blue-50 rounded-lg p-2">
                      <span className={`h-2.5 w-2.5 rounded-full mr-2 ${app.config.appsflyerEnabled ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                      <span className="text-sm text-gray-900">{app.config.appsflyerEnabled ? 'Enabled' : 'Disabled'}</span>
                    </div>
                  </dd>
                </div>

                <div>
                  <dt className="flex items-center text-sm font-medium text-gray-500 mb-2">
                    <CogIcon className="h-5 w-5 mr-2 text-gray-400" />
                    App Features
                  </dt>
                  <dd className="mt-1">
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(app.config.features || {}).map(([key, value]) => (
                        <div key={key} className="flex items-center bg-gray-50 rounded-lg p-2">
                          <span className={`h-2.5 w-2.5 rounded-full mr-2 ${value ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                          <span className="text-sm text-gray-900">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </span>
                        </div>
                      ))}
                    </div>
                  </dd>
                </div>
              </dl>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}