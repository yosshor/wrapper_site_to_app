/**
 * @fileoverview App Creation Page - Form for creating new mobile apps
 * @author YosShor
 * @version 1.0.0
 * @description Allows users to configure and create new mobile apps from website URLs
 */

import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useForm } from 'react-hook-form';
import { useMutation } from 'react-query';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useToast } from '../../components/ui/Toast';
import api from '../../services/api';  // Fixed: Changed from named import to default import
import { AppConfig, AppFormData } from '../../types';


/**
 * App Creation Page Component
 * 
 * Provides a comprehensive form for users to configure their mobile app:
 * - Basic app information (name, description, website URL)
 * - Platform identifiers (package ID, bundle ID)
 * - Firebase configuration for analytics and crash reporting
 * - Appsflyer configuration for marketing attribution
 * - Feature toggles for various app capabilities
 */
export default function CreateApp() {
  const router = useRouter();
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid }
  } = useForm<AppFormData>({
    mode: 'onChange',
    defaultValues: {
      name: '',
      description: '',
      websiteUrl: '',
      packageId: '',
      bundleId: '',
      firebase: {
        enabled: true,
        config: {},
        features: {
          analytics: true,
          crashlytics: true,
          messaging: false
        }
      },
      appsflyer: {
        enabled: false,
        devKey: '',
        config: {}
      },
      features: {
        leadCapture: true,
        pushNotifications: false,
        offlineMode: false,
        customSplash: false,
        analytics: true
      }
    }
  });

  // Watch form values for dynamic updates
  const watchedName = watch('name');
  const watchedFirebaseEnabled = watch('firebase.enabled');
  const watchedAppsflyerEnabled = watch('appsflyer.enabled');

  /**
   * Create app mutation
   */
  const createAppMutation = useMutation(api.apps.create, {
    onSuccess: (response) => {
      showToast('App created successfully!', 'success');
      if (response?.data?.id) {
        router.push(`/apps/${response.data.id}`);
      } else {
        console.error('Invalid response format:', response);
        showToast('App created but redirect failed', 'error');
      }
    },
    onError: (error: any) => {
      showToast(error.response?.data?.error || 'Failed to create app', 'error');
    }
  });

  /**
   * Handle form submission
   * @param {AppFormData} data - Form data
   */
  const onSubmit = async (data: AppFormData) => {
    try {
      // Generate package/bundle IDs if not provided
      if (!data.packageId && data.name) {
        data.packageId = `com.webwrapper.${data.name.toLowerCase().replace(/\s+/g, '')}`;
      }
      if (!data.bundleId && data.packageId) {
        data.bundleId = data.packageId;
      }

      await createAppMutation.mutateAsync(data);
    } catch (error) {
      console.error('App creation failed:', error);
    }
  };

  /**
   * Auto-generate package ID from app name
   */
  const generatePackageId = () => {
    if (watchedName) {
      const packageId = `com.webwrapper.${watchedName.toLowerCase().replace(/[^a-zA-Z0-9]/g, '')}`;
      setValue('packageId', packageId);
      setValue('bundleId', packageId);
    }
  };

  /**
   * Validate URL format
   * @param {string} url - URL to validate
   * @returns {boolean|string} - True if valid, error message if invalid
   */
  const validateUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return 'Please enter a valid URL';
    }
  };

  return (
    <>
      <Head>
        <title>Create New App | Mobile App Generator</title>
        <meta name="description" content="Create a new mobile app from your website" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Create Your Mobile App
            </h1>
            <p className="text-xl text-gray-600">
              Transform your website into a professional mobile app in minutes
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center space-x-4">
              {[
                { step: 1, label: 'Basic Info' },
                { step: 2, label: 'Configuration' },
                { step: 3, label: 'Features' }
              ].map(({ step, label }) => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep >= step
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {step}
                  </div>
                  <span className="ml-2 text-sm text-gray-600">{label}</span>
                  {step < 3 && <div className="w-8 h-px bg-gray-300 ml-4" />}
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <Card className="p-8">
              {/* Step 1: Basic Information */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                    Basic Information
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <Input
                        label="App Name"
                        placeholder="My Awesome App"
                        error={errors.name?.message}
                        {...register('name', {
                          required: 'App name is required',
                          minLength: { value: 2, message: 'Name must be at least 2 characters' }
                        })}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Input
                        label="Website URL"
                        placeholder="https://www.example.com"
                        error={errors.websiteUrl?.message}
                        {...register('websiteUrl', {
                          required: 'Website URL is required',
                          validate: validateUrl
                        })}
                      />
                      <p className="mt-2 text-sm text-gray-500">
                        The website you want to wrap in your mobile app
                      </p>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        rows={3}
                        placeholder="Brief description of your app"
                        {...register('description')}
                      />
                    </div>

                    <div>
                      <Input
                        label="Android Package ID"
                        placeholder="com.example.myapp"
                        error={errors.packageId?.message}
                        {...register('packageId', {
                          required: 'Package ID is required',
                          pattern: {
                            value: /^[a-z][a-z0-9_]*(\.[a-z0-9_]+)*$/,
                            message: 'Invalid package ID format'
                          }
                        })}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={generatePackageId}
                        className="mt-2"
                      >
                        Auto-generate
                      </Button>
                    </div>

                    <div>
                      <Input
                        label="iOS Bundle ID"
                        placeholder="com.example.myapp"
                        error={errors.bundleId?.message}
                        {...register('bundleId')}
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Usually same as package ID
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      disabled={!watchedName || !watch('websiteUrl') || !watch('packageId')}
                    >
                      Next: Configuration
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 2: Configuration */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                    Service Configuration
                  </h2>

                  {/* Firebase Configuration */}
                  <div className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        Firebase Integration
                      </h3>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          {...register('firebase.enabled')}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    {watchedFirebaseEnabled && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              {...register('firebase.features.analytics')}
                            />
                            <span className="ml-2 text-sm text-gray-700">Analytics</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              {...register('firebase.features.crashlytics')}
                            />
                            <span className="ml-2 text-sm text-gray-700">Crashlytics</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              {...register('firebase.features.messaging')}
                            />
                            <span className="ml-2 text-sm text-gray-700">Push Notifications</span>
                          </label>
                        </div>
                        <p className="text-sm text-gray-500">
                          Firebase configuration will be set up during the build process
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Appsflyer Configuration */}
                  <div className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        AppsFlyer Integration
                      </h3>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          {...register('appsflyer.enabled')}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    {watchedAppsflyerEnabled && (
                      <div>
                        <Input
                          label="AppsFlyer Dev Key"
                          placeholder="Your AppsFlyer dev key"
                          error={errors.appsflyer?.devKey?.message}
                          {...register('appsflyer.devKey', {
                            required: watchedAppsflyerEnabled ? 'Dev key is required when AppsFlyer is enabled' : false
                          })}
                        />
                        <p className="mt-2 text-sm text-gray-500">
                          Get your dev key from your AppsFlyer dashboard
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentStep(1)}
                    >
                      Back
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                    >
                      Next: Features
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Features */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                    App Features
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900">Core Features</h3>
                      
                      <label className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          {...register('features.leadCapture')}
                        />
                        <div>
                          <span className="text-sm font-medium text-gray-700">Lead Capture</span>
                          <p className="text-xs text-gray-500">Collect user information when app opens</p>
                        </div>
                      </label>

                      <label className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          {...register('features.pushNotifications')}
                        />
                        <div>
                          <span className="text-sm font-medium text-gray-700">Push Notifications</span>
                          <p className="text-xs text-gray-500">Send notifications to users</p>
                        </div>
                      </label>

                      <label className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          {...register('features.analytics')}
                        />
                        <div>
                          <span className="text-sm font-medium text-gray-700">Analytics Tracking</span>
                          <p className="text-xs text-gray-500">Track user interactions and events</p>
                        </div>
                      </label>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900">Advanced Features</h3>
                      
                      <label className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          {...register('features.offlineMode')}
                        />
                        <div>
                          <span className="text-sm font-medium text-gray-700">Offline Mode</span>
                          <p className="text-xs text-gray-500">Cache content for offline viewing</p>
                        </div>
                      </label>

                      <label className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          {...register('features.customSplash')}
                        />
                        <div>
                          <span className="text-sm font-medium text-gray-700">Custom Splash Screen</span>
                          <p className="text-xs text-gray-500">Show custom loading screen on app start</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentStep(2)}
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={createAppMutation.isLoading}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600"
                    >
                      {createAppMutation.isLoading ? 'Creating App...' : 'Create App'}
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </form>
        </div>
      </div>
    </>
  );
} 