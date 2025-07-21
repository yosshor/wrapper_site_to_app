/**
 * @fileoverview Login Page Component
 * @author YosShor
 * @version 1.0.0
 * @description User authentication page with login form and error handling
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
import { LoginForm } from '@/types';

/**
 * Login Page Component
 * 
 * Handles user authentication with email and password.
 * Includes form validation, error handling, and redirect after successful login.
 * 
 * @returns {JSX.Element} Login page component
 */
export default function Login() {
  const router = useRouter();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginForm>();

  /**
   * Login mutation
   */
  const loginMutation = useMutation(
    (credentials: LoginForm) => api.login(credentials.email, credentials.password),
    {
      onSuccess: () => {
        showToast('Login successful!', 'success');
        router.push('/apps');
      },
      onError: (error: any) => {
        showToast(error.response?.data?.error || 'Login failed', 'error');
      }
    }
  );

  /**
   * Handle form submission
   * @param {LoginForm} data - Form data
   */
  const onSubmit = async (data: LoginForm) => {
    try {
      setIsLoading(true);
      await loginMutation.mutateAsync(data);
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Login | Mobile App Generator</title>
        <meta name="description" content="Log in to your Mobile App Generator account" />
      </Head>

      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h1 className="text-center text-3xl font-bold text-gray-900">
            Welcome Back
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link href="/auth/register" className="text-blue-600 hover:text-blue-500">
              Sign up
            </Link>
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <Card className="py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                  autoComplete="current-password"
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

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <Link href="/auth/forgot-password" className="text-blue-600 hover:text-blue-500">
                    Forgot your password?
                  </Link>
                </div>
              </div>

              <div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </Button>
              </div>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {/* TODO: Implement Google login */}}
                >
                  <span className="sr-only">Sign in with Google</span>
                  Google
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {/* TODO: Implement GitHub login */}}
                >
                  <span className="sr-only">Sign in with GitHub</span>
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