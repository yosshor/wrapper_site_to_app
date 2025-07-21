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

export default function AppDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { showToast } = useToast();

  // Fetch app data
  const { data: appData, isLoading, error } = useQuery(
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

  if (isLoading || !appData?.data) {
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

  const app = appData.data;
  const status = app?.status || 'unknown';
  const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <>
      <Head>
        <title>{app.name} | Mobile App Generator</title>
        <meta name="description" content={app.description || `Details for ${app.name}`} />
      </Head>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {app.name}
              </h1>
              <p className="text-gray-600">
                {app.description || app.websiteUrl}
              </p>
            </div>
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => router.push('/apps')}
              >
                Back to Apps
              </Button>
              <Button
                onClick={() => router.push(`/apps/${app.id}/build`)}
              >
                Build App
              </Button>
            </div>
          </div>

          {/* App Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Basic Information */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Basic Information
              </h2>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Website URL</dt>
                  <dd className="mt-1 text-sm text-gray-900">{app.websiteUrl}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Package ID</dt>
                  <dd className="mt-1 text-sm text-gray-900">{app.androidPackageId}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Bundle ID</dt>
                  <dd className="mt-1 text-sm text-gray-900">{app.iosPackageId}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      status === 'active' ? 'bg-green-100 text-green-800' :
                      status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {statusLabel}
                    </span>
                  </dd>
                </div>
              </dl>
            </Card>

            {/* Features */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Features
              </h2>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Firebase</dt>
                  <dd className="mt-1">
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <span className={`h-2.5 w-2.5 rounded-full mr-2 ${app.config?.firebaseEnabled ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                        <span className="text-sm text-gray-900">{app.config?.firebaseEnabled ? 'Enabled' : 'Disabled'}</span>
                      </div>
                      {app.config?.firebaseEnabled && app.config?.firebaseConfig && (
                        <div className="pl-4 space-y-1">
                          <div className="flex items-center">
                            <span className={`h-2 w-2 rounded-full mr-2 ${app.config.firebaseConfig.analyticsEnabled ? 'bg-blue-400' : 'bg-gray-300'}`}></span>
                            <span className="text-sm text-gray-600">Analytics</span>
                          </div>
                          <div className="flex items-center">
                            <span className={`h-2 w-2 rounded-full mr-2 ${app.config.firebaseConfig.crashlyticsEnabled ? 'bg-blue-400' : 'bg-gray-300'}`}></span>
                            <span className="text-sm text-gray-600">Crashlytics</span>
                          </div>
                          <div className="flex items-center">
                            <span className={`h-2 w-2 rounded-full mr-2 ${app.config.firebaseConfig.messagingEnabled ? 'bg-blue-400' : 'bg-gray-300'}`}></span>
                            <span className="text-sm text-gray-600">Push Notifications</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">AppsFlyer</dt>
                  <dd className="mt-1">
                    <div className="flex items-center">
                      <span className={`h-2.5 w-2.5 rounded-full mr-2 ${app.config?.appsflyerEnabled ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                      <span className="text-sm text-gray-900">{app.config?.appsflyerEnabled ? 'Enabled' : 'Disabled'}</span>
                    </div>
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">App Features</dt>
                  <dd className="mt-1">
                    <div className="space-y-1">
                      {app.config?.features && Object.entries(app.config.features).map(([key, value]) => (
                        <div key={key} className="flex items-center">
                          <span className={`h-2 w-2 rounded-full mr-2 ${value ? 'bg-green-500' : 'bg-gray-300'}`}></span>
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