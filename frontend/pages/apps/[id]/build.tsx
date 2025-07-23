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

  // Request notification permission on component mount
  React.useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    // Check for persisted buildId or recent builds on page load
    const checkForExistingBuild = async () => {
      if (!id) return;
      
      // First check localStorage for persisted buildId
      const storedBuildId = localStorage.getItem(`buildId_${id}`);
      if (storedBuildId) {
        console.log('Found stored buildId:', storedBuildId);
        setBuildId(storedBuildId);
        return;
      }
      
      // If no stored buildId, check for recent builds from the API
      try {
        console.log('Checking for recent builds for app:', id);
        const response = await api.apps.getRecentBuilds(id as string);
        const recentBuild = response.data?.builds?.[0]; // Get most recent build
        
        if (recentBuild && (recentBuild.status === 'pending' || recentBuild.status === 'in_progress' || recentBuild.status === 'completed')) {
          console.log('Found recent build:', recentBuild);
          setBuildId(recentBuild._id);
          // Store it for future refreshes
          localStorage.setItem(`buildId_${id}`, recentBuild._id);
        }
      } catch (error) {
        console.log('No recent builds found or API error:', error);
      }
    };
    
    checkForExistingBuild();
  }, [id]);

  // Fetch app data
  const { data: appData, isLoading: appLoading } = useQuery(
    ['app', id],
    () => api.apps.get(id as string),
    {
      enabled: !!id,
      onError: (err: any) => {
        showToast(err.response?.data?.error || 'Failed to load app', 'error');
        console.error(err);
        router.push('/apps');
      }
    }
  );
  console.log( appData, appLoading);
  // Add this query to check build status
  const { data: buildStatus, isLoading: buildStatusLoading } = useQuery(
    ['build-status', buildId],
    () => api.apps.getBuildStatus(id as string, buildId as string),
    {
      enabled: !!buildId,
      refetchInterval: (data) => {
        const status = data?.data?.build?.status || data?.data?.status;
        console.log('Build status polling:', {
          status,
          fullData: data,
          buildId,
          appId: id
        });
        
        // Stop polling if build is completed or failed
        if (status === 'completed' || status === 'failed') {
          console.log('Stopping polling, build finished with status:', status);
          return false;
        }
        return 30000; // Poll every 3 seconds while building
      },
      onSuccess: (data) => {
        const status = data?.data?.build?.status || data?.data?.status;
        const buildFiles = data?.data?.build?.buildFiles || data?.data?.buildFiles;
        
        console.log('Build status update:', { status, buildFiles, data });
        
        if (status === 'completed') {
          showToast('🎉 Build completed successfully! Your APK is ready for download.', 'success');
          // Play success sound if available
          if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance('Build completed successfully');
            utterance.volume = 0.3;
            speechSynthesis.speak(utterance);
          }
          // Show browser notification if permission granted
          if (Notification.permission === 'granted') {
            new Notification('Build Complete! 🎉', {
              body: 'Your mobile app APK is ready for download',
              icon: '/favicon.ico'
            });
          }
          // Clean up localStorage after 10 minutes to avoid showing old completed builds
          setTimeout(() => {
            localStorage.removeItem(`buildId_${id}`);
          }, 10 * 60 * 1000);
        } else if (status === 'failed') {
          showToast('❌ Build failed. Check logs for details.', 'error');
          // Show browser notification for failure
          if (Notification.permission === 'granted') {
            new Notification('Build Failed ❌', {
              body: 'Check the build logs for error details',
              icon: '/favicon.ico'
            });
          }
          // Clean up localStorage for failed builds immediately
          setTimeout(() => {
            localStorage.removeItem(`buildId_${id}`);
          }, 2 * 60 * 1000); // Remove after 2 minutes
        }
      }
    }
  );

  // Update the build mutation
  const buildMutation = useMutation(
    (buildData: any) => api.apps.build(id as string, buildData),
    {
      onSuccess: (data) => {
        // Store buildId in localStorage and state
        const newBuildId = data.data.buildId;
        setBuildId(newBuildId);
        localStorage.setItem(`buildId_${id}`, newBuildId);
        showToast('Build started successfully!', 'success');
      },
      onError: (error: any) => {
        const errorMessage = error.response?.data?.error?.message || 'Failed to start build';
        console.error(error);
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
    // Show loading state immediately when build mutation is loading
    if (buildMutation.isLoading) {
      return (
        <Card className="mt-6 p-6">
          <h3 className="text-lg font-semibold mb-4">Build Status</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Status:</span>
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-800 flex items-center">
                  <div className="flex items-center mr-2">
                    <div className="relative">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div className="absolute top-0 left-0 w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>
                    </div>
                  </div>
                  Starting Build...
                </span>
              </div>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{width: '30%'}}></div>
            </div>
          </div>
        </Card>
      );
    }

    if (!buildId) return null;

    const status = buildStatus?.data?.build?.status || buildStatus?.data?.status;
    const error = buildStatus?.data?.build?.error || buildStatus?.data?.error;

    return (
      <Card className="mt-6 p-6">
        <h3 className="text-lg font-semibold mb-4">Build Status</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Status:</span>
            <div className="flex items-center space-x-2">
              {/* Loading spinner for pending/in_progress status */}
              {(status === 'pending' || status === 'in_progress') && (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
              )}
              
              <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center ${
                status === 'completed' ? 'bg-green-100 text-green-800' :
                status === 'failed' ? 'bg-red-100 text-red-800' :
                status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                'bg-blue-50 text-blue-800'
              }`}>
                {/* Blue pulsing light for pending status */}
                {status === 'pending' && (
                  <div className="flex items-center mr-2">
                    <div className="relative">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div className="absolute top-0 left-0 w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>
                    </div>
                  </div>
                )}
                
                {status === 'pending' ? 'Initializing Build...' :
                 status === 'in_progress' ? 'Building...' :
                 status === 'completed' ? 'Build Complete' :
                 status === 'failed' ? 'Build Failed' :
                 'Pending'}
              </span>
            </div>
          </div>

          {/* Progress indicator for in_progress */}
          {status === 'in_progress' && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
            </div>
          )}

          {/* Show error if build failed */}
          {status === 'failed' && error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-red-800">Build Error</h4>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Show build logs */}
          {(buildStatus?.data?.build?.logs?.length > 0 || buildStatus?.data?.logs?.length > 0) && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Build Logs:</h4>
              <div className="bg-gray-900 rounded-lg p-4 max-h-64 overflow-y-auto">
                {(buildStatus?.data?.build?.logs || buildStatus?.data?.logs)?.map((log: any, index: number) => (
                  <div key={index} className={`text-sm font-mono ${
                    log.level === 'error' ? 'text-red-400' :
                    log.level === 'warn' ? 'text-yellow-400' :
                    'text-green-400'
                  }`}>
                    <span className="text-gray-500 text-xs">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span className="ml-2">{log.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Show download button only if build is completed */}
          {status === 'completed' && (buildStatus?.data?.build?.buildFiles || buildStatus?.data?.buildFiles) && (
            <div className="space-y-2">
              {(buildStatus?.data?.build?.buildFiles?.android || buildStatus?.data?.buildFiles?.android) && (
                <Button
                  onClick={() => window.location.href = buildStatus?.data?.build?.buildFiles?.android || buildStatus?.data?.buildFiles?.android}
                  className="w-full bg-green-600 hover:bg-green-700 flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Android APK
                </Button>
              )}
              {(buildStatus?.data?.build?.buildFiles?.ios || buildStatus?.data?.buildFiles?.ios) && (
                <Button
                  onClick={() => window.location.href = buildStatus?.data?.build?.buildFiles?.ios || buildStatus?.data?.buildFiles?.ios}
                  className="w-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download iOS IPA
                </Button>
              )}
            </div>
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
          <div className="mt-8 flex justify-end space-x-4">
            {/* Debug: Manual refresh button */}
            {buildId && (
              <Button
                variant="outline"
                onClick={() => {
                  console.log('Manual refresh triggered for buildId:', buildId);
                  // Force refetch the build status
                  window.location.reload();
                }}
                className="flex items-center"
              >
                🔄 Refresh Status
              </Button>
            )}
            
            <Button
              onClick={handleBuild}
              disabled={buildMutation.isLoading || buildStatus?.data?.status === 'in_progress'}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {(buildMutation.isLoading || buildStatus?.data?.status === 'in_progress') && (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
              )}
              <RocketLaunchIcon className="h-5 w-5 mr-2" />
              {buildMutation.isLoading 
                ? 'Starting Build...' 
                : buildStatus?.data?.status === 'in_progress' 
                ? 'Building...' 
                : 'Start Build'}
            </Button>
          </div>
          {renderBuildStatus()}
        </div>
      </div>
    </>
  );
} 