/**
 * @fileoverview API service for Mobile App Generator Frontend
 * @author YosShor
 * @version 1.0.0
 * 
 * Main API service that handles all communication with the backend.
 * Includes authentication, error handling, and request/response processing.
 */

import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import toast from 'react-hot-toast';
import { ApiResponse, PaginatedResponse } from '@/types';

// API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';  // Use direct backend URL
const API_TIMEOUT = 30000; // 30 seconds

/**
 * API Service Class
 * 
 * Handles all HTTP communication with the backend API.
 * Provides methods for authentication, app management, and build operations.
 */
class ApiService {
  private client: AxiosInstance;

  constructor() {
    // Create axios instance with base configuration
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for authentication
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        // Log request URL for debugging
        console.log('Request URL:', config.url);
        return config;
      },
      (error) => {
        console.error('Request error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      (error: AxiosError) => {
        this.handleApiError(error);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get authentication token from storage
   * @returns Authentication token or null
   */
  private getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  /**
   * Set authentication token in storage
   * @param token - Authentication token
   */
  private setAuthToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  /**
   * Remove authentication token from storage
   */
  private removeAuthToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  /**
   * Handle API errors and display appropriate messages
   * @param error - Axios error object
   */
  private handleApiError(error: AxiosError): void {
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          toast.error('Authentication required. Please log in.');
          this.removeAuthToken();
          // Redirect to login page
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/login';
          }
          break;
        case 403:
          toast.error('Access denied. You do not have permission to perform this action.');
          break;
        case 404:
          toast.error('Resource not found.');
          break;
        case 429:
          toast.error('Too many requests. Please try again later.');
          break;
        case 500:
          toast.error('Server error. Please try again later.');
          break;
        default:
          const errorMessage = (data as any)?.error || 'An unexpected error occurred.';
          toast.error(errorMessage);
      }
    } else if (error.request) {
      toast.error('Network error. Please check your connection.');
    } else {
      toast.error('An unexpected error occurred.');
    }
  }

  // ============================================================================
  // AUTHENTICATION METHODS
  // ============================================================================

  /**
   * User login
   * @param email - User email
   * @param password - User password
   * @returns Login response with user data and token
   */
  async login(email: string, password: string): Promise<ApiResponse> {
    const response = await this.client.post('/auth/login', { email, password });
    
    if (response.data.success && response.data.data.token) {
      this.setAuthToken(response.data.data.token);
    }
    
    return response.data;
  }

  /**
   * User registration
   * @param userData - User registration data
   * @returns Registration response
   */
  async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<ApiResponse> {
    const response = await this.client.post('/auth/register', userData);
    
    if (response.data.success && response.data.data.token) {
      this.setAuthToken(response.data.data.token);
    }
    
    return response.data;
  }

  /**
   * User logout
   * @returns Logout response
   */
  async logout(): Promise<ApiResponse> {
    try {
      const response = await this.client.post('/auth/logout');
      return response.data;
    } finally {
      this.removeAuthToken();
    }
  }

  // ============================================================================
  // APP MANAGEMENT METHODS
  // ============================================================================

  apps = {
    /**
     * Get all user apps
     * @param params - Query parameters
     * @returns Paginated list of apps
     */
    list: async (params?: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
    }): Promise<PaginatedResponse> => {
      const response = await this.client.get('/apps', { params });
      return response.data;
    },

    /**
     * Get app by ID
     * @param appId - App ID
     * @returns App data
     */
    get: async (appId: string): Promise<ApiResponse> => {
      const response = await this.client.get(`/apps/${appId}`);
      return response.data;
    },

    /**
     * Create new app
     * @param appData - App creation data
     * @returns Created app data
     */
    create: async (appData: any): Promise<ApiResponse> => {
      console.log('Creating app with data:', appData);
      const response = await this.client.post('/apps', appData);
      console.log('Create app response:', response.data);
      return response.data;
    },

    /**
     * Update app
     * @param appId - App ID
     * @param appData - Updated app data
     * @returns Updated app data
     */
    update: async (appId: string, appData: any): Promise<ApiResponse> => {
      const response = await this.client.put(`/apps/${appId}`, appData);
      return response.data;
    },

    /**
     * Delete app
     * @param appId - App ID
     * @returns Deletion response
     */
    delete: async (appId: string): Promise<ApiResponse> => {
      const response = await this.client.delete(`/apps/${appId}`);
      return response.data;
    },

    /**
     * Duplicate app
     * @param appId - App ID
     * @param config - Duplication config
     * @returns Duplicated app data
     */
    duplicate: async (appId: string, config: any): Promise<ApiResponse> => {
      const response = await this.client.post(`/apps/${appId}/duplicate`, config);
      return response.data;
    },

    /**
     * Toggle app status
     * @param appId - App ID
     * @returns Updated app data
     */
    toggleStatus: async (appId: string): Promise<ApiResponse> => {
      const response = await this.client.post(`/apps/${appId}/toggle-status`);
      return response.data;
    },

    /**
     * Get app statistics
     * @param appId - App ID
     * @returns App statistics
     */
    getStats: async (appId: string): Promise<ApiResponse> => {
      const response = await this.client.get(`/apps/${appId}/stats`);
      return response.data;
    },

    /**
     * Start a new build
     * @param appId - App ID
     * @param buildData - Build configuration data
     * @returns Build response
     */
    build: async (appId: string, buildData: any): Promise<ApiResponse> => {
      const response = await this.client.post(`/apps/${appId}/build`, buildData);
      return response.data;
    },

    getBuildStatus: async (appId: string, buildId: string): Promise<ApiResponse> => {
      const response = await this.client.get(`/apps/${appId}/builds/${buildId}`);
      return response.data;
    },

    downloadBuild: async (appId: string, buildId: string): Promise<any> => {
      const response = await this.client.get(`/apps/${appId}/builds/${buildId}/download`, {
        responseType: 'blob'
      });
      return response;
    },
  };

  // ============================================================================
  // BUILD MANAGEMENT METHODS
  // ============================================================================


  builds = {
    /**
     * Trigger app build
     * @param appId - App ID
     * @param platform - Target platform (android/ios)
     * @returns Build initiation response
     */
    create: async (appId: string, platform: 'android' | 'ios'): Promise<ApiResponse> => {
      const response = await this.client.post(`/builds`, { appId, platform });
      return response.data;
    },

    /**
     * Get build status
     * @param buildId - Build ID
     * @returns Build status data
     */
    getStatus: async (buildId: string): Promise<ApiResponse> => {
      const response = await this.client.get(`/builds/${buildId}`);
      return response.data;
    },

    /**
     * Get build logs
     * @param buildId - Build ID
     * @returns Build logs
     */
    getLogs: async (buildId: string): Promise<ApiResponse> => {
      const response = await this.client.get(`/builds/${buildId}/logs`);
      return response.data;
    },

    /**
     * Cancel build
     * @param buildId - Build ID
     * @returns Cancellation response
     */
    cancel: async (buildId: string): Promise<ApiResponse> => {
      const response = await this.client.post(`/builds/${buildId}/cancel`);
      return response.data;
    },

    /**
     * Download build
     * @param buildId - Build ID
     * @returns Download URL
     */
    download: async (buildId: string): Promise<string> => {
      const response = await this.client.get(`/builds/${buildId}/download`, {
        responseType: 'blob',
      });
      return URL.createObjectURL(new Blob([response.data]));
    },
  };

  // ============================================================================
  // DASHBOARD METHODS
  // ============================================================================

  /**
   * Get dashboard statistics
   * @returns Dashboard stats
   */
  async getDashboardStats(): Promise<ApiResponse> {
    const response = await this.client.get('/dashboard/stats');
    return response.data;
  }

  async getLeads(type: string, page: number, limit: number): Promise<ApiResponse> {
    const response = await this.client.get(`/dashboard/leads?type=${type}&page=${page}&limit=${limit}`);
    return response.data;
  }
}

// Create and export API service instance
const apiService = new ApiService();
export default apiService; 


