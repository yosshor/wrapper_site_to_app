/**
 * @fileoverview Main App component for Mobile App Generator Frontend
 * @author YosShor
 * @version 1.0.0
 * 
 * Root component that wraps all pages with providers and global configurations.
 * Includes React Query, Toast notifications, and authentication context.
 */

import React from 'react';
import type { AppProps } from 'next/app';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import { Toaster } from 'react-hot-toast';
import { ToastProvider } from '@/components/ui/Toast';
import '@/styles/globals.css';

// Create Query Client with default options
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
    mutations: {
      retry: 1,
    },
  },
});

/**
 * Main App Component
 * 
 * Root component that provides global context and configuration for all pages.
 * Sets up React Query, toast notifications, and other global providers.
 * 
 * @component
 */
function MyApp({ Component, pageProps }: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        {/* Main application component */}
        <Component {...pageProps} />
        
        {/* Toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              style: {
                background: '#10b981',
              },
            },
            error: {
              duration: 5000,
              style: {
                background: '#ef4444',
              },
            },
          }}
        />
        
        {/* React Query DevTools (only in development) */}
        {process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default MyApp; 