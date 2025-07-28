/**
 * @fileoverview Contact page for Mobile App Generator Frontend
 * @author YosShor
 * @version 1.0.0
 * 
 * Contact page that provides multiple ways for users to get in touch.
 * Includes contact form, contact information, and support options.
 */

import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Mail, 
  Phone, 
  MapPin, 
  MessageSquare, 
  Send,
  CheckCircle,
  Clock,
  Globe,
  ArrowLeft,
  User,
  Building,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';

/**
 * Contact Form Data Interface
 * 
 * @interface ContactFormData
 */
interface ContactFormData {
  name: string;
  email: string;
  company?: string;
  subject: string;
  message: string;
}

/**
 * Contact Page Component
 * 
 * Provides multiple contact methods including a contact form,
 * contact information, and support options.
 * 
 * @component
 */
export default function Contact() {
  // Form state
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    company: '',
    subject: '',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errors, setErrors] = useState<Partial<ContactFormData>>({});

  // Animation variants
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

  // Contact information
  const contactInfo = [
    {
      icon: Mail,
      title: 'Email Support',
      description: 'Get help with technical issues',
      value: 'support@mobilegen.com',
      link: 'mailto:support@mobilegen.com',
    },
    {
      icon: MessageSquare,
      title: 'Live Chat',
      description: 'Chat with our support team',
      value: 'Available 24/7',
      link: '#',
    },
    {
      icon: Phone,
      title: 'Phone Support',
      description: 'Call us for urgent issues',
      value: '+1 (555) 123-4567',
      link: 'tel:+15551234567',
    },
    {
      icon: MapPin,
      title: 'Office Address',
      description: 'Visit our headquarters',
      value: '123 Tech Street, San Francisco, CA 94105',
      link: 'https://maps.google.com',
    },
  ];

  // Support categories
  const supportCategories = [
    {
      title: 'Technical Support',
      description: 'Help with app generation, builds, and technical issues',
      icon: Building,
    },
    {
      title: 'Account & Billing',
      description: 'Questions about your account, billing, or subscriptions',
      icon: User,
    },
    {
      title: 'Feature Requests',
      description: 'Suggest new features or improvements to the platform',
      icon: Globe,
    },
    {
      title: 'Partnership',
      description: 'Business partnerships and enterprise inquiries',
      icon: Building,
    },
  ];

  /**
   * Handle form input changes
   * 
   * @param {React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>} e - Input change event
   */
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error when user starts typing
    if (errors[name as keyof ContactFormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  /**
   * Validate form data
   * 
   * @returns {boolean} Whether the form is valid
   */
  const validateForm = (): boolean => {
    const newErrors: Partial<ContactFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.length < 10) {
      newErrors.message = 'Message must be at least 10 characters long';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   * 
   * @param {React.FormEvent} e - Form submission event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSubmitSuccess(true);
      setFormData({
        name: '',
        email: '',
        company: '',
        subject: '',
        message: '',
      });
      
      // Reset success message after 5 seconds
      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (error) {
      console.error('Failed to submit contact form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Contact Us - MobileGen</title>
        <meta name="description" content="Get in touch with the MobileGen team for support, questions, or partnership inquiries." />
        <meta name="keywords" content="contact, support, help, mobile app generator" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <Link href="/" className="flex items-center space-x-2">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
                <span className="text-lg font-semibold text-gray-900">Back to Home</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="initial"
              animate="animate"
              variants={staggerChildren}
              className="text-center"
            >
              <motion.h1
                variants={fadeInUp}
                className="text-4xl sm:text-5xl font-bold mb-6"
              >
                Get in Touch
              </motion.h1>
              <motion.p
                variants={fadeInUp}
                className="text-xl text-blue-100 max-w-2xl mx-auto"
              >
                Have questions about MobileGen? We're here to help. Reach out to our team for support, questions, or partnership inquiries.
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* Contact Information */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={staggerChildren}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
            >
              {contactInfo.map((info, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="text-center"
                >
                  <Card variant="elevated" padding="md" className="h-full">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                        <info.icon className="w-6 h-6 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {info.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        {info.description}
                      </p>
                      <Link
                        href={info.link}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        {info.value}
                      </Link>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Contact Form */}
              <motion.div
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
                variants={staggerChildren}
              >
                <Card variant="elevated" padding="lg">
                  <CardHeader
                    title="Send us a Message"
                    subtitle="Fill out the form below and we'll get back to you within 24 hours"
                  />
                  <CardContent>
                    {submitSuccess && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md"
                      >
                        <div className="flex items-center">
                          <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                          <span className="text-green-800 font-medium">
                            Thank you! Your message has been sent successfully. We'll get back to you soon.
                          </span>
                        </div>
                      </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                          label="Full Name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          error={errors.name}
                          placeholder="Enter your full name"
                          required
                        />
                        <Input
                          label="Email Address"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          error={errors.email}
                          placeholder="Enter your email address"
                          required
                        />
                      </div>

                      <Input
                        label="Company (Optional)"
                        name="company"
                        value={formData.company}
                        onChange={handleInputChange}
                        placeholder="Enter your company name"
                      />

                      <Input
                        label="Subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        error={errors.subject}
                        placeholder="What is this regarding?"
                        required
                      />

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Message
                        </label>
                        <textarea
                          name="message"
                          value={formData.message}
                          onChange={handleInputChange}
                          rows={6}
                          className={`block w-full rounded-md shadow-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${
                            errors.message ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                          }`}
                          placeholder="Tell us how we can help you..."
                          required
                        />
                        {errors.message && (
                          <p className="mt-1 text-sm text-red-600">{errors.message}</p>
                        )}
                      </div>

                      <Button
                        type="submit"
                        size="lg"
                        className="w-full"
                        isLoading={isSubmitting}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Send Message
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Support Categories */}
              <motion.div
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
                variants={staggerChildren}
              >
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                      How can we help?
                    </h2>
                    <p className="text-gray-600 mb-8">
                      Choose the category that best describes your inquiry for faster assistance.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {supportCategories.map((category, index) => (
                      <motion.div
                        key={index}
                        variants={fadeInUp}
                        className="p-6 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors cursor-pointer"
                      >
                        <div className="flex items-start space-x-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <category.icon className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              {category.title}
                            </h3>
                            <p className="text-gray-600">
                              {category.description}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Response Time */}
                  <Card variant="outlined" padding="md">
                    <div className="flex items-center space-x-3">
                      <Clock className="w-5 h-5 text-blue-600" />
                      <div>
                        <h4 className="font-semibold text-gray-900">Response Time</h4>
                        <p className="text-sm text-gray-600">
                          We typically respond within 24 hours during business days
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={staggerChildren}
              className="text-center mb-12"
            >
              <motion.h2
                variants={fadeInUp}
                className="text-3xl font-bold text-gray-900 mb-4"
              >
                Frequently Asked Questions
              </motion.h2>
              <motion.p
                variants={fadeInUp}
                className="text-xl text-gray-600"
              >
                Quick answers to common questions
              </motion.p>
            </motion.div>

            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={staggerChildren}
              className="space-y-6"
            >
              {[
                {
                  question: "How long does it take to generate a mobile app?",
                  answer: "App generation typically takes 5-10 minutes depending on the complexity and features enabled."
                },
                {
                  question: "What file formats do you support for app icons?",
                  answer: "We support PNG, JPG, and SVG formats. For best results, use PNG with transparent background."
                },
                {
                  question: "Can I customize the app's appearance?",
                  answer: "Yes! You can customize the app icon, splash screen, colors, and various UI elements."
                },
                {
                  question: "Do you provide technical support?",
                  answer: "Yes, we offer comprehensive technical support via email, live chat, and phone."
                }
              ].map((faq, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="bg-gray-50 rounded-lg p-6"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {faq.question}
                  </h3>
                  <p className="text-gray-600">
                    {faq.answer}
                  </p>
                </motion.div>
              ))}
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