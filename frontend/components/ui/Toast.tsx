/**
 * @fileoverview Toast Component and Hook
 * @author YosShor
 * @version 1.0.0
 * @description Toast notification system with different variants and auto-dismiss
 */

import React from 'react';
import { toast, ToastOptions } from 'react-hot-toast';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

/**
 * Toast Context
 * 
 * Context for managing toast notifications across the application.
 */
const ToastContext = React.createContext<ToastContextType>({
  showToast: () => {},
});

/**
 * Toast Provider Component
 * 
 * Provides toast notification functionality to child components.
 * 
 * @component
 * @example
 * <ToastProvider>
 *   <App />
 * </ToastProvider>
 */
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const showToast = (message: string, type: ToastType = 'info') => {
    const options: ToastOptions = {
      duration: 4000,
      position: 'top-right',
    };

    switch (type) {
      case 'success':
        toast.success(message, options);
        break;
      case 'error':
        toast.error(message, {
          ...options,
          duration: 5000,
        });
        break;
      case 'warning':
        toast(message, {
          ...options,
          icon: '⚠️',
        });
        break;
      default:
        toast(message, options);
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
    </ToastContext.Provider>
  );
};

/**
 * useToast Hook
 * 
 * Custom hook for using toast notifications in components.
 * 
 * @returns {Object} Toast functions and state
 * @example
 * const { showToast } = useToast();
 * showToast('Operation successful!', 'success');
 */
export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}; 