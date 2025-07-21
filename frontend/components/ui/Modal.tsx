/**
 * @fileoverview Modal component for Mobile App Generator Frontend
 * @author YosShor
 * @version 1.0.0
 * 
 * Reusable modal component with overlay, animations, and keyboard handling.
 * Supports different sizes and custom styling.
 */

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/utils';
import { ModalProps } from '@/types';
import { Button } from './Button';

/**
 * Modal Component
 * 
 * A flexible modal component with overlay and animations.
 * Automatically handles focus management and keyboard interactions.
 * 
 * @component
 * @example
 * <Modal isOpen={isOpen} onClose={onClose} title="Confirm Action">
 *   <p>Are you sure you want to proceed?</p>
 * </Modal>
 */
const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}) => {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Size styles
  const sizeStyles = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  // Animation variants
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const modalVariants = {
    hidden: { 
      opacity: 0,
      scale: 0.95,
      y: -20,
    },
    visible: { 
      opacity: 1,
      scale: 1,
      y: 0,
    },
  };

  if (!isOpen) return null;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={cn(
              'relative bg-white rounded-xl shadow-large border border-gray-200 w-full',
              sizeStyles[size]
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            {title && (
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  {title}
                </h3>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
            
            {/* Content */}
            <div className={cn(
              'p-6',
              title ? '' : 'relative'
            )}>
              {!title && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 hover:bg-gray-100"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  // Render modal in portal
  return createPortal(modalContent, document.body);
};

export default Modal; 