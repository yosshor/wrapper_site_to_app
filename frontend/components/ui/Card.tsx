/**
 * @fileoverview Card Component
 * @author YosShor
 * @version 1.0.0
 * @description Reusable card component with different variants and padding options
 */

import React from 'react';
import { cn } from '@/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

/**
 * Card Component
 * 
 * A styled card component with different variants and padding options.
 * Includes elevation, border, and hover states.
 * 
 * @component
 * @example
 * <Card
 *   variant="elevated"
 *   padding="md"
 *   className="hover:shadow-lg"
 * >
 *   Card content
 * </Card>
 */
const Card: React.FC<CardProps> = ({
  className,
  variant = 'default',
  padding = 'md',
  children,
  ...props
}) => {
  // Base styles
  const baseStyles = 'rounded-lg transition-shadow duration-200';

  // Variant styles
  const variantStyles = {
    default: 'bg-white',
    elevated: 'bg-white shadow-md hover:shadow-lg',
    outlined: 'bg-white border border-gray-200'
  };

  // Padding styles
  const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  return (
    <div
      className={cn(
        baseStyles,
        variantStyles[variant],
        paddingStyles[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export { Card };

/**
 * Card Header Component
 * 
 * Header section for card content with title and optional actions.
 */
interface CardHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  subtitle,
  actions,
  className,
}) => {
  return (
    <div className={cn('flex items-start justify-between mb-4', className)}>
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {subtitle && (
          <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center space-x-2">
          {actions}
        </div>
      )}
    </div>
  );
};

/**
 * Card Content Component
 * 
 * Main content area of the card.
 */
interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export const CardContent: React.FC<CardContentProps> = ({
  children,
  className,
}) => {
  return (
    <div className={cn('text-gray-700', className)}>
      {children}
    </div>
  );
};

/**
 * Card Footer Component
 * 
 * Footer section for card actions or additional information.
 */
interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
  divider?: boolean;
}

export const CardFooter: React.FC<CardFooterProps> = ({
  children,
  className,
  divider = true,
}) => {
  return (
    <div className={cn(
      'mt-4',
      divider && 'pt-4 border-t border-gray-200',
      className
    )}>
      {children}
    </div>
  );
}; 