/**
 * @fileoverview Input Component
 * @author YosShor
 * @version 1.0.0
 * @description Reusable form input component with label and error handling
 */

import React, { forwardRef } from 'react';
import { cn } from '@/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

/**
 * Input Component
 * 
 * A styled form input component with label and error message support.
 * Includes focus states, error states, and accessibility features.
 * 
 * @component
 * @example
 * <Input
 *   label="Email"
 *   type="email"
 *   error="Please enter a valid email"
 *   {...register('email')}
 * />
 */
const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, type = 'text', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <input
          type={type}
          className={cn(
            'block w-full rounded-md shadow-sm',
            'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
            error && 'border-red-300 focus:border-red-500 focus:ring-red-500',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input }; 