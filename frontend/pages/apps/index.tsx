/**
 * @fileoverview Apps Dashboard - List and manage user's mobile apps
 * @author YosShor
 * @version 1.0.0
 * @description Main dashboard for viewing, searching, and managing user's mobile apps
 */

import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  EllipsisVerticalIcon,
  PlayIcon,
  PauseIcon,
  DocumentDuplicateIcon,
  TrashIcon,
  EyeIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import api from '@/services/api';
import { App, ApiResponse, PaginatedResponse } from '@/types';
import { formatDate, cn } from '@/utils';

interface AppResponse extends ApiResponse {
  data: {
    status: 'active' | 'inactive';
  };
}

/**
 * Apps Dashboard Component
 * 
 * Provides comprehensive app management interface:
 * - List all user apps with pagination and search
 * - Quick actions for each app (view, build, duplicate, delete)
 * - Status indicators and statistics
 * - Bulk operations support
 * - Real-time status updates
 */
export default function AppsDashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [appToDelete, setAppToDelete] = useState<App | null>(null);
  const [page, setPage] = useState(1);

  /**
   * Fetch apps query with search and filters
   */
  const { data: appsData, isLoading, error } = useQuery<PaginatedResponse<App>>(
    ['apps', page, searchQuery, statusFilter],
    () => api.apps.list({
      page,
      limit: 12,
      search: searchQuery || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined
    }),
    {
      keepPreviousData: true,
      staleTime: 30000 // 30 seconds
    }
  );

  /**
   * Delete app mutation
   */
  const deleteAppMutation = useMutation(
    (appId: string) => api.apps.delete(appId),
    {
      onSuccess: () => {
        showToast('App deleted successfully', 'success');
        queryClient.invalidateQueries(['apps']);
        setDeleteModalOpen(false);
        setAppToDelete(null);
      },
      onError: (error: any) => {
        showToast(error.response?.data?.error || 'Failed to delete app', 'error');
      }
    }
  );

  /**
   * Toggle app status mutation
   */
  const toggleStatusMutation = useMutation<ApiResponse, Error, string>(
    (appId: string) => api.apps.toggleStatus(appId),
    {
      onSuccess: (data) => {
        showToast(`App status updated successfully`, 'success');
        queryClient.invalidateQueries(['apps']);
      },
      onError: (error: any) => {
        showToast(error.response?.data?.error || 'Failed to update app status', 'error');
      }
    }
  );

  /**
   * Duplicate app mutation
   */
  const duplicateAppMutation = useMutation(
    (data: { appId: string; name: string; packageId: string; bundleId: string }) =>
      api.apps.duplicate(data.appId, data),
    {
      onSuccess: (data: any) => {
        showToast('App duplicated successfully', 'success');
        queryClient.invalidateQueries(['apps']);
          router.push(`/apps/${data.data.app._id}`);
      },
      onError: (error: any) => {
        showToast(error.response?.data?.error || 'Failed to duplicate app', 'error');
      } 
    }
  );

  /**
   * Handle app deletion
   * @param {App} app - App to delete
   */
  const handleDeleteApp = (app: App) => {
    setAppToDelete(app);
    setDeleteModalOpen(true);
  };

  /**
   * Confirm app deletion
   */
  const confirmDeleteApp = () => {
    if (appToDelete && typeof appToDelete._id === 'string') {
      deleteAppMutation.mutate(appToDelete._id);
    } else {
      console.error('No app selected for deletion or invalid app ID');
      showToast('No app selected for deletion.', 'error');
    }
  };

  /**
   * Handle app status toggle
   * @param {string} appId - App ID to toggle
   */
  const handleToggleStatus = (appId: string) => {
    toggleStatusMutation.mutate(appId);
  };

  /**
   * Handle app duplication
   * @param {App} app - App to duplicate
   */
  const handleDuplicateApp = (app: App) => {
    const name = `${app.name} (Copy)`;
    const packageId = `${app.packageId}.copy`;
    const bundleId = `${app.bundleId}.copy`;

    duplicateAppMutation.mutate({
      appId: app._id,
      name,
      packageId,
      bundleId
    });
  };

  /**
   * Navigate to build page
   * @param {string} appId - App ID to build
   */
  const handleBuildApp = (appId: string) => {
    console.log('Building app:', appId);
    router.push(`/apps/${appId}/build`);
  };

  /**
   * Get status badge styling
   * @param {string} status - App status
   * @returns {string} CSS classes for status badge
   */
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Failed to load apps</h2>
          <p className="text-gray-600 mb-4">Please try again later</p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>My Apps | Mobile App Generator</title>
        <meta name="description" content="Manage your mobile apps" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Apps</h1>
              <p className="text-gray-600 mt-2">
                Manage and monitor your mobile applications
              </p>
            </div>
            <Link href="/apps/create">
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600">
                <PlusIcon className="h-5 w-5 mr-2" />
                Create New App
              </Button>
            </Link>
          </div>

          {/* Filters and Search */}
          <Card className="p-6 mb-8">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search apps..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </Card>

          {/* Apps Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="p-6 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </Card>
              ))}
            </div>
          ) : appsData?.data?.apps?.length ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                {appsData.data.apps.map((app: App) => (
                  console.log('App:', app),
                  <Card key={app._id} className="p-6 hover:shadow-lg transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {app.name}
                        </h3>
                        <span className={cn(
                          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                          getStatusBadge(app.status)
                        )}>
                          {app.status}
                        </span>
                      </div>

                      <div className="relative">
                        <button
                          className="p-1 rounded-full hover:bg-gray-100"
                          onClick={() => {
                            // Toggle dropdown menu logic would go here
                          }}
                        >
                          <EllipsisVerticalIcon className="h-5 w-5 text-gray-500" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <p className="text-sm text-gray-600 truncate">
                        {app.websiteUrl}
                      </p>
                      <p className="text-sm text-gray-500">
                        Package: {app.packageId}
                      </p>
                      <p className="text-xs text-gray-400">
                        Created {formatDate(app.createdAt)}
                      </p>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex space-x-2">
                      <Link href={`/apps/${app._id}`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                        >
                          <EyeIcon className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </Link>

                      <Button
                        size="sm"
                        onClick={() => {
                          console.log('Building app:', app._id);
                          handleBuildApp(app._id);
                        }}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                      >
                        <PlayIcon className="h-4 w-4 mr-1" />
                        Build
                      </Button>
                    </div>

                    {/* Additional Actions */}
                    <div className="flex justify-between mt-3 pt-3 border-t border-gray-200">
                      <button
                        onClick={() => handleToggleStatus(app._id)}
                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                        disabled={toggleStatusMutation.isLoading}
                      >
                        {app.status === 'active' ? (
                          <PauseIcon className="h-4 w-4 mr-1" />
                        ) : (
                          <PlayIcon className="h-4 w-4 mr-1" />
                        )}
                        {app.status === 'active' ? 'Pause' : 'Activate'}
                      </button>

                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleDuplicateApp(app)}
                          className="text-sm text-gray-600 hover:text-gray-800"
                          disabled={duplicateAppMutation.isLoading}
                        >
                          <DocumentDuplicateIcon className="h-4 w-4" />
                        </button>

                        <Link href={`/apps/${app._id}/stats`}>
                          <ChartBarIcon className="h-4 w-4 text-gray-600 hover:text-gray-800" />
                        </Link>

                        <button
                          onClick={() => handleDeleteApp(app)}
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {appsData.pagination && appsData.pagination.pages > 1 && (
                <div className="flex justify-center items-center space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setPage(page - 1)}
                    disabled={page <= 1}
                  >
                    Previous
                  </Button>

                  <span className="px-4 py-2 text-sm text-gray-700">
                    Page {page} of {appsData.pagination.pages}
                  </span>

                  <Button
                    variant="outline"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= appsData.pagination.pages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          ) : (
            <Card className="p-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="mb-6">
                  <PlusIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No apps found
                  </h3>
                  <p className="text-gray-500">
                    {searchQuery || statusFilter !== 'all'
                      ? 'Try adjusting your search or filters'
                      : 'Get started by creating your first mobile app'
                    }
                  </p>
                </div>

                {!searchQuery && statusFilter === 'all' && (
                  <Link href="/apps/create">
                    <Button className="bg-gradient-to-r from-blue-600 to-indigo-600">
                      <PlusIcon className="h-5 w-5 mr-2" />
                      Create Your First App
                    </Button>
                  </Link>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete App"
      >
        <div className="p-6">
          <p className="text-gray-600 mb-6">
            Are you sure you want to delete "{appToDelete?.name}"? This action cannot be undone.
          </p>

          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDeleteApp}
              disabled={deleteAppMutation.isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteAppMutation.isLoading ? 'Deleting...' : 'Delete App'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
} 