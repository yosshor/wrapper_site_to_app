/**
 * @fileoverview Registration Page Component
 * @author YosShor
 * @version 1.0.0
 * @description User registration page with form validation and error handling
 */

import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { useMutation } from 'react-query';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import api from '@/services/api';

interface RegisterForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

/**
 * Registration Page Component
 * 
 * Handles new user registration with form validation and error handling.
 * Includes password confirmation and email validation.
 * 
 * @returns {JSX.Element} Registration page component
 */
export default function Register() {
  const router = useRouter();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<RegisterForm>();

  const password = watch('password');

  /**
   * Registration mutation
   */
  const registerMutation = useMutation(
    (data: RegisterForm) => api.register({
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName
    }),
    {
      onSuccess: () => {
        showToast('Registration successful!', 'success');
        router.push('/apps');
      },
      onError: (error: any) => {
        showToast(error.response?.data?.error || 'Registration failed', 'error');
      }
    }
  );

  /**
   * Handle form submission
   * @param {RegisterForm} data - Form data
   */
  const onSubmit = async (data: RegisterForm) => {
    try {
      setIsLoading(true);
      await registerMutation.mutateAsync(data);
    } catch (error) {
      console.error('Registration failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Register | Mobile App Generator</title>
        <meta name="description" content="Create your Mobile App Generator account" />
      </Head>

      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h1 className="text-center text-3xl font-bold text-gray-900">
            Create Your Account
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-blue-600 hover:text-blue-500">
              Sign in
            </Link>
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <Card className="py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <Input
                    label="First Name"
                    autoComplete="given-name"
                    error={errors.firstName?.message}
                    {...register('firstName', {
                      required: 'First name is required',
                      minLength: {
                        value: 2,
                        message: 'First name must be at least 2 characters'
                      }
                    })}
                  />
                </div>

                <div>
                  <Input
                    label="Last Name"
                    autoComplete="family-name"
                    error={errors.lastName?.message}
                    {...register('lastName', {
                      required: 'Last name is required',
                      minLength: {
                        value: 2,
                        message: 'Last name must be at least 2 characters'
                      }
                    })}
                  />
                </div>
              </div>

              <div>
                <Input
                  label="Email Address"
                  type="email"
                  autoComplete="email"
                  error={errors.email?.message}
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: 'Please enter a valid email'
                    }
                  })}
                />
              </div>

              <div>
                <Input
                  label="Password"
                  type="password"
                  autoComplete="new-password"
                  error={errors.password?.message}
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters'
                    }
                  })}
                />
              </div>

              <div>
                <Input
                  label="Confirm Password"
                  type="password"
                  autoComplete="new-password"
                  error={errors.confirmPassword?.message}
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: value =>
                      value === password || 'Passwords do not match'
                  })}
                />
              </div>

              <div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </div>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {/* TODO: Implement Google signup */}}
                >
                  <span className="sr-only">Sign up with Google</span>
                  Google
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {/* TODO: Implement GitHub signup */}}
                >
                  <span className="sr-only">Sign up with GitHub</span>
                  GitHub
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
} 