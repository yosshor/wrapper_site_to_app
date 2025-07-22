import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useQuery, useMutation } from 'react-query';
import {
  ArrowLeftIcon,
  RocketLaunchIcon,
  CogIcon,
  DevicePhoneMobileIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import api from '@/services/api';

export default function BuildApp() {
  const router = useRouter();
  const { id } = router.query;
  const { showToast } = useToast();
  const [selectedPlatform, setSelectedPlatform] = useState<'android' | 'ios'>('android');
  const [buildConfig, setBuildConfig] = useState({
    debug: false,
    release: true,
    optimizeAssets: true,
    minify: true,
  });
  const [buildId, setBuildId] = useState<string | null>(null);

  // Fetch app data
  const { data: appData, isLoading: appLoading } = useQuery(
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

  // Add this query to check build status
  const { data: buildStatus, isLoading: buildStatusLoading } = useQuery(
    ['build-status', buildId],
    () => api.apps.getBuildStatus(id as string, buildId),
    {
      enabled: !!buildId,
      refetchInterval: (data) => {
        // Stop polling if build is completed or failed
        if (data?.data?.status === 'completed' || data?.data?.status === 'failed') {
          return false;
        }
        return 5000; // Poll every 5 seconds while building
      }
    }
  );

  // Update the build mutation
  const buildMutation = useMutation(
    (buildData: any) => api.apps.build(id as string, buildData),
    {
      onSuccess: (data) => {
        // Don't show success toast yet, just start polling for status
        setBuildId(data.data.buildId);
      },
      onError: (error: any) => {
        const errorMessage = error.response?.data?.error?.message || 'Failed to start build';
        showToast(errorMessage, 'error');
      }
    }
  );

  const handleBuild = async () => {
    buildMutation.mutate({
      platform: selectedPlatform,
      config: {
        ...buildConfig,
        timestamp: new Date().toISOString(),
        version: '1.0.0', // You might want to manage this differently
      },
    });
  };

  // Add this to render build status
  const renderBuildStatus = () => {
    if (!buildId) return null;

    const status = buildStatus?.data?.status;
    const error = buildStatus?.data?.error;

    return (
      <Card className="mt-6 p-6">
        <h3 className="text-lg font-semibold mb-4">Build Status</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Status:</span>
            <span className={`px-2 py-1 rounded-full text-sm ${
              status === 'completed' ? 'bg-green-100 text-green-800' :
              status === 'failed' ? 'bg-red-100 text-red-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {status || 'pending'}
            </span>
          </div>

          {/* Show error if build failed */}
          {status === 'failed' && error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Show build logs */}
          {buildStatus?.data?.logs?.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Build Logs:</h4>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                {buildStatus.data.logs.map((log: any, index: number) => (
                  <p key={index} className={`text-sm ${
                    log.level === 'error' ? 'text-red-600' :
                    log.level === 'warn' ? 'text-yellow-600' :
                    'text-gray-600'
                  }`}>
                    {new Date(log.timestamp).toLocaleTimeString()}: {log.message}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Show download button only if build is completed */}
          {status === 'completed' && buildStatus?.data?.buildUrl && (
            <Button
              onClick={() => window.location.href = buildStatus.data.buildUrl}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Download APK
            </Button>
          )}
        </div>
      </Card>
    );
  };

  if (appLoading) {
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

  const app = appData?.data?.app;

  return (
    <>
      <Head>
        <title>Build App | Mobile App Generator</title>
        <meta name="description" content="Build your mobile app" />
      </Head>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Build App</h1>
              <p className="text-gray-600 mt-2">Configure and start your app build</p>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push(`/apps/${id}`)}
              className="flex items-center"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Back to App
            </Button>
          </div>

          {/* App Info */}
          <Card className="mb-8 p-6">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 rounded-lg p-3">
                <DevicePhoneMobileIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{app?.name}</h2>
                <p className="text-gray-600">{app?.websiteUrl}</p>
              </div>
            </div>
          </Card>

          {/* Build Configuration */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-6 flex items-center">
                <DevicePhoneMobileIcon className="h-5 w-5 mr-2 text-gray-400" />
                Platform Selection
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setSelectedPlatform('android')}
                  className={`p-4 rounded-lg border-2 ${
                    selectedPlatform === 'android'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <DevicePhoneMobileIcon className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                    <p className="font-medium">Android</p>
                    <p className="text-sm text-gray-500">{app?.androidPackageId}</p>
                  </div>
                </button>
                <button
                  onClick={() => setSelectedPlatform('ios')}
                  className={`p-4 rounded-lg border-2 ${
                    selectedPlatform === 'ios'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <DevicePhoneMobileIcon className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                    <p className="font-medium">iOS</p>
                    <p className="text-sm text-gray-500">{app?.iosPackageId}</p>
                  </div>
                </button>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-6 flex items-center">
                <CogIcon className="h-5 w-5 mr-2 text-gray-400" />
                Build Options
              </h3>
              <div className="space-y-4">
                {Object.entries(buildConfig).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) =>
                          setBuildConfig((prev) => ({
                            ...prev,
                            [key]: e.target.checked,
                          }))
                        }
                        className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-gray-700 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    </label>
                    <CheckCircleIcon className={`h-5 w-5 ${value ? 'text-green-500' : 'text-gray-300'}`} />
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Build Button */}
          <div className="mt-8 flex justify-end">
            <Button
              onClick={handleBuild}
              disabled={buildMutation.isLoading}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center px-6 py-3"
            >
              <RocketLaunchIcon className="h-5 w-5 mr-2" />
              {buildMutation.isLoading ? 'Starting Build...' : 'Start Build'}
            </Button>
          </div>
          {renderBuildStatus()}
        </div>
      </div>
    </>
  );
} 