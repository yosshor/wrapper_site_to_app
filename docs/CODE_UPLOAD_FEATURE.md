# Website Code Upload Feature

## Overview

The Mobile App Generator now supports uploading your actual website code (ZIP file) instead of just wrapping a website URL. This provides better performance, more control, and mobile-specific optimizations.

## How It Works

### 1. **Code Upload Process**
- Upload a ZIP file containing your website files (HTML, CSS, JS, images)
- Our system automatically extracts and analyzes your code
- Performs mobile optimization analysis
- Generates optimization suggestions
- Creates a mobile-optimized version of your website

### 2. **Code Analysis**
The system analyzes your website code for:
- **File Structure**: Counts HTML, CSS, JS, and image files
- **Mobile Compatibility**: Checks for responsive design, viewport meta tags
- **Performance**: Identifies optimization opportunities
- **Features**: Detects forms, images, external links, custom fonts

### 3. **Optimization Suggestions**
Based on the analysis, the system provides suggestions for:
- Adding responsive design with CSS media queries
- Optimizing images for mobile devices
- Minifying CSS and JavaScript for better performance
- Adding mobile-specific enhancements

## Usage Instructions

### Step 1: Prepare Your Website Code
1. Create a ZIP file containing your website files
2. Include all HTML, CSS, JS, and image files
3. Maintain the original folder structure
4. Ensure your main HTML file is in the root or clearly identified

### Step 2: Upload Your Code
1. Go to the "Create App" page
2. Select "Upload Website Code" option
3. Click the upload area and select your ZIP file
4. Wait for the upload and analysis to complete

### Step 3: Configure Your App
1. Fill in the basic app information (name, description, package IDs)
2. Configure Firebase and AppsFlyer settings if needed
3. Enable desired features (offline mode, push notifications, etc.)
4. Submit to create your app

## Benefits Over URL Wrapping

### **Better Performance**
- Direct access to your code for optimization
- No external website dependencies
- Faster loading times
- Better caching control

### **More Control**
- Custom mobile optimizations
- Platform-specific enhancements
- Better error handling
- Offline functionality

### **Enhanced Features**
- Native mobile UI improvements
- Better touch interactions
- Optimized for mobile screens
- Improved accessibility

## Technical Details

### **Supported File Types**
- HTML files (.html, .htm)
- CSS files (.css)
- JavaScript files (.js)
- Image files (.jpg, .jpeg, .png, .gif, .svg, .webp)
- Other web assets

### **File Size Limits**
- Maximum ZIP file size: 50MB
- Individual file size: No specific limit
- Recommended: Keep under 20MB for faster processing

### **Processing Steps**
1. **Extraction**: ZIP file is extracted to secure directory
2. **Analysis**: Code is scanned for structure and features
3. **Optimization**: Mobile-specific enhancements are applied
4. **Integration**: Optimized code is integrated into mobile app template
5. **Build**: App is built with the optimized code

## Example ZIP Structure
```
my-website.zip
├── index.html
├── about.html
├── contact.html
├── css/
│   ├── style.css
│   └── responsive.css
├── js/
│   ├── main.js
│   └── utils.js
├── images/
│   ├── logo.png
│   ├── hero.jpg
│   └── icons/
└── assets/
    └── fonts/
```

## Troubleshooting

### **Common Issues**
1. **File too large**: Compress images or remove unnecessary files
2. **Invalid ZIP**: Ensure the file is a valid ZIP archive
3. **Missing files**: Include all necessary HTML, CSS, and JS files
4. **Analysis errors**: Check that your HTML files are valid

### **Best Practices**
1. **Optimize images** before uploading
2. **Minify CSS/JS** for better performance
3. **Test locally** before uploading
4. **Keep structure simple** for better analysis
5. **Include a clear entry point** (index.html)

## Future Enhancements

### **Planned Features**
- **Advanced Code Analysis**: Deeper analysis of JavaScript frameworks
- **Custom Optimizations**: User-defined optimization rules
- **Performance Metrics**: Detailed performance analysis reports
- **A/B Testing**: Compare different optimization strategies
- **Version Control**: Track changes and rollback capabilities

### **Integration Features**
- **GitHub Integration**: Direct import from GitHub repositories
- **FTP/SFTP Support**: Import from web servers
- **CMS Integration**: Direct import from popular CMS platforms
- **API Integration**: Import via API endpoints

## Support

If you encounter any issues with the code upload feature:
1. Check the file size and format
2. Ensure all required files are included
3. Verify your ZIP file is not corrupted
4. Contact support with error details

---

*This feature is designed to provide a more sophisticated approach to mobile app generation, giving you full control over your website's mobile experience.* 