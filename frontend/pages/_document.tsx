/**
 * @fileoverview Custom Document component for Mobile App Generator Frontend
 * @author YosShor
 * @version 1.0.0
 * 
 * Custom Document component that allows customization of the HTML document structure.
 * Includes meta tags, fonts, and other head elements.
 */

import { Html, Head, Main, NextScript } from 'next/document';

/**
 * Custom Document Component
 * 
 * Extends the default Next.js Document to customize the HTML document structure.
 * Includes custom fonts, meta tags, and other head elements.
 * 
 * @component
 */
export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Favicon and App Icons */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        
        {/* Meta Tags */}
        <meta name="description" content="Generate mobile apps from website URLs with Firebase and Appsflyer integration" />
        <meta name="keywords" content="mobile app generator, webview, firebase, appsflyer, android, ios" />
        <meta name="author" content="YosShor" />
        <meta name="robots" content="index, follow" />
        
        {/* Open Graph / Social Media */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Mobile App Generator" />
        <meta property="og:description" content="Generate mobile apps from website URLs with Firebase and Appsflyer integration" />
        <meta property="og:image" content="/og-image.png" />
        <meta property="og:site_name" content="Mobile App Generator" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Mobile App Generator" />
        <meta name="twitter:description" content="Generate mobile apps from website URLs with Firebase and Appsflyer integration" />
        <meta name="twitter:image" content="/og-image.png" />
        
        {/* Theme Color */}
        <meta name="theme-color" content="#3b82f6" />
        <meta name="msapplication-TileColor" content="#3b82f6" />
        
        {/* Preconnect to External Domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Google Fonts - already included in globals.css but adding preload for performance */}
        <link
          rel="preload"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap"
          as="style"
          onLoad="this.onload=null;this.rel='stylesheet'"
        />
        <noscript>
          <link
            href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap"
            rel="stylesheet"
          />
        </noscript>
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
        
        {/* Portal container for modals */}
        <div id="modal-portal" />
      </body>
    </Html>
  );
} 