/**
 * @fileoverview Home page for Mobile App Generator Frontend
 * @author YosShor
 * @version 1.0.0
 * 
 * Landing page that showcases the platform features and allows users to get started.
 * Includes hero section, features overview, and call-to-action elements.
 */

import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Smartphone, 
  Globe, 
  Zap, 
  BarChart3, 
  Shield, 
  Download,
  CheckCircle,
  ArrowRight,
  Play,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

/**
 * Home Page Component
 * 
 * Landing page that introduces users to the Mobile App Generator platform.
 * Showcases features, benefits, and guides users to get started.
 * 
 * @component
 */
export default function Home() {
  // Animation variants for page elements
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  const staggerChildren = {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  // Platform features data
  const features = [
    {
      icon: Globe,
      title: 'URL to Mobile App',
      description: 'Convert any website into a fully functional mobile application with advanced WebView implementation.',
    },
    {
      icon: Smartphone,
      title: 'Cross-Platform Support',
      description: 'Generate both Android APK and iOS IPA files from a single configuration.',
    },
    {
      icon: BarChart3,
      title: 'Advanced Analytics',
      description: 'Built-in Firebase Analytics and Appsflyer integration for comprehensive user tracking.',
    },
    {
      icon: Zap,
      title: 'Lead Capture',
      description: 'Automatically capture user data and sync with Google Sheets and MongoDB.',
    },
    {
      icon: Shield,
      title: 'Store Compliant',
      description: 'Apps generated follow Google Play and App Store guidelines for approval.',
    },
    {
      icon: Download,
      title: 'One-Click Download',
      description: 'Download ready-to-publish APK and IPA files directly from the platform.',
    },
  ];

  // Process steps
  const steps = [
    {
      step: '01',
      title: 'Enter Website URL',
      description: 'Provide the URL of the website you want to convert into a mobile app.',
    },
    {
      step: '02',
      title: 'Customize App Details',
      description: 'Set app name, package ID, icon, splash screen, and configure features.',
    },
    {
      step: '03',
      title: 'Generate & Download',
      description: 'Click generate and download your ready-to-publish mobile app files.',
    },
  ];

  return (
    <>
      <Head>
        <title>Mobile App Generator - Convert Websites to Mobile Apps</title>
        <meta 
          name="description" 
          content="Transform any website into a mobile app with Firebase and Appsflyer integration. Generate Android APK and iOS IPA files easily." 
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <h1 className="text-xl font-bold text-gradient">
                    MobileGen
                  </h1>
                </div>
              </div>

              {/* Navigation */}
              <nav className="hidden md:flex space-x-8">
                <Link href="#features" className="text-gray-600 hover:text-primary-600 transition-colors">
                  Features
                </Link>
                <Link href="#process" className="text-gray-600 hover:text-primary-600 transition-colors">
                  How it Works
                </Link>
                <Link href="#pricing" className="text-gray-600 hover:text-primary-600 transition-colors">
                  Pricing
                </Link>
              </nav>

              {/* Actions */}
              <div className="flex items-center space-x-4">
                <Link href="/auth/login">
                  <Button variant="secondary" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button variant="primary" size="sm">
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 sm:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="initial"
              animate="animate"
              variants={staggerChildren}
              className="text-center"
            >
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6"
              >
                Convert Websites to
                <span className="text-gradient block">
                  Mobile Apps
                </span>
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-xl text-gray-600 max-w-3xl mx-auto mb-10"
              >
                Transform any website into a professional mobile application with Firebase integration, 
                Appsflyer analytics, and automated lead capture. Generate Android and iOS apps in minutes.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              >
                <Link href="/auth/register">
                  <Button size="lg" className="px-8 py-4">
                    Start Building Now
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                
                <Button variant="secondary" size="lg" className="px-8 py-4">
                  <Play className="mr-2 w-5 h-5" />
                  Watch Demo
                </Button>
              </motion.div>

              {/* Trust indicators */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                variants={staggerChildren}
                className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-16 text-sm text-gray-500"
              >
                <div className="flex items-center">
                  <Star className="w-4 h-4 text-yellow-400 mr-1" />
                  <span>Store Compliant</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                  <span>Firebase Ready</span>
                </div>
                <div className="flex items-center">
                  <Shield className="w-4 h-4 text-blue-500 mr-1" />
                  <span>Secure & Reliable</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={staggerChildren}
              className="text-center mb-16"
            >
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4"
              >
                Everything You Need
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-xl text-gray-600 max-w-2xl mx-auto"
              >
                Powerful features to create professional mobile apps from your websites
              </motion.p>
            </motion.div>

            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={staggerChildren}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {features.map((feature, index) => (
                <motion.div key={index} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}>
                  <Card variant="elevated" padding="lg" className="h-full">
                    <div className="flex items-center mb-4">
                      <div className="p-3 bg-primary-100 rounded-lg mr-4">
                        <feature.icon className="w-6 h-6 text-primary-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {feature.title}
                      </h3>
                    </div>
                    <p className="text-gray-600">
                      {feature.description}
                    </p>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Process Section */}
        <section id="process" className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={staggerChildren}
              className="text-center mb-16"
            >
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4"
              >
                How It Works
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-xl text-gray-600 max-w-2xl mx-auto"
              >
                Simple 3-step process to convert your website into a mobile app
              </motion.p>
            </motion.div>

            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={staggerChildren}
              className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12"
            >
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="text-center relative"
                >
                  {/* Step number */}
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 text-white rounded-full text-2xl font-bold mb-6">
                    {step.step}
                  </div>
                  
                  {/* Connector line */}
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-8 left-1/2 w-full h-0.5 bg-gray-300 transform translate-x-1/2"></div>
                  )}
                  
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {step.title}
                  </h3>
                  <p className="text-gray-600">
                    {step.description}
                  </p>
                </motion.div>
              ))}
            </motion.div>

            {/* CTA */}
            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={staggerChildren}
              className="text-center mt-16"
            >
              <Link href="/auth/register">
                <Button size="lg" className="px-8 py-4">
                  Start Your First App
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-4">MobileGen</h3>
              <p className="text-gray-400 mb-8">
                Convert websites to mobile apps with Firebase and Appsflyer integration
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
                <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
                <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
                  Terms of Service
                </Link>
                <Link href="/contact" className="text-gray-400 hover:text-white transition-colors">
                  Contact
                </Link>
              </div>
              
              <p className="text-gray-500 text-sm">
                © 2025 MobileGen. Built with ❤️ by YosShor
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
} 