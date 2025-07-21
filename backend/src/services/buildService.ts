/**
 * @fileoverview BuildService for handling automated mobile app generation
 * @author YosShor
 * @version 1.0.0
 * @description Service for orchestrating mobile app builds using Capacitor CLI
 */

import { Build } from '../models/Build';
import App from '../models/App';
import { exec, spawn, ChildProcess } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import { promisify } from 'util';
import archiver from 'archiver';

const execAsync = promisify(exec);

/**
 * BuildService Class
 * 
 * Handles the complete build lifecycle for mobile apps:
 * - Template preparation and customization
 * - Asset processing and optimization
 * - Capacitor build orchestration
 * - Build artifact management
 * - Real-time logging and status updates
 */
export class BuildService {
  private activeBuilds: Map<string, ChildProcess> = new Map();
  private buildQueue: string[] = [];
  private isProcessingQueue = false;
  
  // Build configuration constants
  private readonly TEMPLATE_DIR = path.join(process.cwd(), 'mobile-template');
  private readonly BUILDS_DIR = path.join(process.cwd(), 'builds');
  private readonly ASSETS_DIR = path.join(process.cwd(), 'uploads/assets');
  
  constructor() {
    this.ensureDirectoriesExist();
    this.startQueueProcessor();
  }

  /**
   * Ensures required directories exist for build operations
   */
  private async ensureDirectoriesExist(): Promise<void> {
    try {
      await fs.ensureDir(this.BUILDS_DIR);
      await fs.ensureDir(this.ASSETS_DIR);
      await fs.ensureDir(path.join(this.BUILDS_DIR, 'artifacts'));
    } catch (error) {
      console.error('Failed to create build directories:', error);
    }
  }

  /**
   * Starts the build queue processor for handling multiple builds
   */
  private startQueueProcessor(): void {
    setInterval(async () => {
      if (!this.isProcessingQueue && this.buildQueue.length > 0) {
        this.isProcessingQueue = true;
        const buildId = this.buildQueue.shift()!;
        await this.processBuild(buildId);
        this.isProcessingQueue = false;
      }
    }, 5000); // Check queue every 5 seconds
  }

  /**
   * Initiates a new build process
   * @param {string} buildId - The build ID to process
   * @returns {Promise<void>}
   */
  async startBuild(buildId: string): Promise<void> {
    this.buildQueue.push(buildId);
    await this.updateBuildStatus(buildId, 'queued', 'Build queued for processing');
  }

  /**
   * Processes a single build from start to finish
   * @param {string} buildId - The build ID to process
   */
  private async processBuild(buildId: string): Promise<void> {
    let build: any;
    
    try {
      // Get build details from database
      build = await Build.findById(buildId).populate('appId');
      if (!build) {
        throw new Error('Build not found');
      }

      await this.updateBuildStatus(buildId, 'building', 'Starting build process...');
      
      // Create build workspace
      const buildDir = path.join(this.BUILDS_DIR, buildId);
      await this.setupBuildWorkspace(buildDir, build);
      
      // Process and customize template
      await this.customizeTemplate(buildDir, build);
      
      // Process assets (icons, splash screens)
      await this.processAssets(buildDir, build);
      
      // Generate platform-specific builds
      const artifacts = await this.generateBuilds(buildDir, build);
      
      // Package and store artifacts
      await this.packageArtifacts(buildId, artifacts);
      
      await this.updateBuildStatus(buildId, 'completed', 'Build completed successfully');
      
      // Clean up build directory (optional, for disk space management)
      await this.cleanupBuildDirectory(buildDir);
      
    } catch (error) {
      console.error(`Build ${buildId} failed:`, error);
      await this.updateBuildStatus(
        buildId, 
        'failed', 
        `Build failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Sets up the build workspace by copying and preparing the template
   * @param {string} buildDir - Build directory path
   * @param {any} build - Build configuration object
   */
  private async setupBuildWorkspace(buildDir: string, build: any): Promise<void> {
    await this.logBuildStep(build._id, 'info', 'Setting up build workspace...');
    
    // Copy template to build directory
    await fs.copy(this.TEMPLATE_DIR, buildDir);
    
    // Install dependencies
    await this.logBuildStep(build._id, 'info', 'Installing dependencies...');
    await execAsync('npm install', { cwd: buildDir });
    
    await this.logBuildStep(build._id, 'info', 'Workspace setup completed');
  }

  /**
   * Customizes the template with app-specific configuration
   * @param {string} buildDir - Build directory path
   * @param {any} build - Build configuration object
   */
  private async customizeTemplate(buildDir: string, build: any): Promise<void> {
    await this.logBuildStep(build._id, 'info', 'Customizing app template...');
    
    const config = build.config;
    
    // Update capacitor.config.ts
    await this.updateCapacitorConfig(buildDir, config);
    
    // Update index.html with app configuration
    await this.updateIndexHtml(buildDir, config);
    
    // Update Firebase configuration
    await this.updateFirebaseConfig(buildDir, config);
    
    // Update Appsflyer configuration
    await this.updateAppsflyerConfig(buildDir, config);
    
    await this.logBuildStep(build._id, 'info', 'Template customization completed');
  }

  /**
   * Updates Capacitor configuration file
   * @param {string} buildDir - Build directory path
   * @param {any} config - App configuration
   */
  private async updateCapacitorConfig(buildDir: string, config: any): Promise<void> {
    const configPath = path.join(buildDir, 'capacitor.config.ts');
    let configContent = await fs.readFile(configPath, 'utf8');
    
    // Replace placeholders with actual values
    configContent = configContent
      .replace(/\{\{APP_ID\}\}/g, config.packageId || config.bundleId)
      .replace(/\{\{APP_NAME\}\}/g, config.name)
      .replace(/\{\{SERVER_URL\}\}/g, config.websiteUrl);
    
    await fs.writeFile(configPath, configContent);
  }

  /**
   * Updates index.html with app-specific configuration
   * @param {string} buildDir - Build directory path
   * @param {any} config - App configuration
   */
  private async updateIndexHtml(buildDir: string, config: any): Promise<void> {
    const htmlPath = path.join(buildDir, 'src', 'index.html');
    let htmlContent = await fs.readFile(htmlPath, 'utf8');
    
    // Replace placeholders
    htmlContent = htmlContent
      .replace(/\{\{APP_NAME\}\}/g, config.name)
      .replace(/\{\{WEBSITE_URL\}\}/g, config.websiteUrl)
      .replace(/\{\{PACKAGE_ID\}\}/g, config.packageId)
      .replace(/\{\{BUNDLE_ID\}\}/g, config.bundleId)
      .replace(/\{\{VERSION\}\}/g, config.version || '1.0.0')
      .replace(/\{\{DESCRIPTION\}\}/g, config.description || config.name);
    
    await fs.writeFile(htmlPath, htmlContent);
  }

  /**
   * Updates Firebase configuration
   * @param {string} buildDir - Build directory path
   * @param {any} config - App configuration
   */
  private async updateFirebaseConfig(buildDir: string, config: any): Promise<void> {
    if (!config.firebase?.enabled) return;
    
    const firebaseConfigPath = path.join(buildDir, 'src', 'firebase-config.js');
    let firebaseContent = await fs.readFile(firebaseConfigPath, 'utf8');
    
    // Replace Firebase configuration
    if (config.firebase?.config) {
      const firebaseConfigStr = JSON.stringify(config.firebase.config, null, 2);
      firebaseContent = firebaseContent.replace(
        /const firebaseConfig = \{[\s\S]*?\};/,
        `const firebaseConfig = ${firebaseConfigStr};`
      );
    }
    
    await fs.writeFile(firebaseConfigPath, firebaseContent);
  }

  /**
   * Updates Appsflyer configuration
   * @param {string} buildDir - Build directory path
   * @param {any} config - App configuration
   */
  private async updateAppsflyerConfig(buildDir: string, config: any): Promise<void> {
    if (!config.appsflyer?.enabled) return;
    
    const htmlPath = path.join(buildDir, 'src', 'index.html');
    let htmlContent = await fs.readFile(htmlPath, 'utf8');
    
    // Replace Appsflyer configuration
    if (config.appsflyer?.devKey) {
      htmlContent = htmlContent.replace(
        /\{\{APPSFLYER_DEV_KEY\}\}/g,
        config.appsflyer.devKey
      );
    }
    
    await fs.writeFile(htmlPath, htmlContent);
  }

  /**
   * Processes and optimizes app assets (icons, splash screens)
   * @param {string} buildDir - Build directory path
   * @param {any} build - Build configuration object
   */
  private async processAssets(buildDir: string, build: any): Promise<void> {
    await this.logBuildStep(build._id, 'info', 'Processing app assets...');
    
    const config = build.config;
    
    // Process app icon
    if (config.appIcon) {
      await this.processAppIcon(buildDir, config.appIcon);
    }
    
    // Process splash screen
    if (config.splashScreen) {
      await this.processSplashScreen(buildDir, config.splashScreen);
    }
    
    await this.logBuildStep(build._id, 'info', 'Asset processing completed');
  }

  /**
   * Processes app icon for different platforms and sizes
   * @param {string} buildDir - Build directory path
   * @param {string} iconPath - Path to the uploaded icon
   */
  private async processAppIcon(buildDir: string, iconPath: string): Promise<void> {
    // Copy the icon to the assets directory
    const targetIconPath = path.join(buildDir, 'src', 'assets', 'icon.png');
    await fs.copy(iconPath, targetIconPath);
    
    // TODO: Generate different icon sizes for Android and iOS
    // This would typically use a tool like sharp for image processing
  }

  /**
   * Processes splash screen for different platforms and sizes
   * @param {string} buildDir - Build directory path
   * @param {string} splashPath - Path to the uploaded splash screen
   */
  private async processSplashScreen(buildDir: string, splashPath: string): Promise<void> {
    // Copy the splash screen to the assets directory
    const targetSplashPath = path.join(buildDir, 'src', 'assets', 'splash.png');
    await fs.copy(splashPath, targetSplashPath);
    
    // TODO: Generate different splash screen sizes for Android and iOS
  }

  /**
   * Generates platform-specific builds
   * @param {string} buildDir - Build directory path
   * @param {any} build - Build configuration object
   * @returns {Promise<string[]>} Array of generated artifact paths
   */
  private async generateBuilds(buildDir: string, build: any): Promise<string[]> {
    const artifacts: string[] = [];
    const platform = build.platform;
    const buildType = build.buildType;
    
    await this.logBuildStep(build._id, 'info', `Building for platform: ${platform}`);
    
    // Build web assets first
    await this.logBuildStep(build._id, 'info', 'Building web assets...');
    await execAsync('npm run build', { cwd: buildDir });
    
    // Sync with Capacitor
    await this.logBuildStep(build._id, 'info', 'Syncing with Capacitor...');
    await execAsync('npx cap sync', { cwd: buildDir });
    
    if (platform === 'android' || platform === 'both') {
      const androidArtifact = await this.buildAndroid(buildDir, build, buildType);
      if (androidArtifact) artifacts.push(androidArtifact);
    }
    
    if (platform === 'ios' || platform === 'both') {
      const iosArtifact = await this.buildIOS(buildDir, build, buildType);
      if (iosArtifact) artifacts.push(iosArtifact);
    }
    
    return artifacts;
  }

  /**
   * Builds Android APK
   * @param {string} buildDir - Build directory path
   * @param {any} build - Build configuration object
   * @param {string} buildType - Build type (debug|release)
   * @returns {Promise<string|null>} Path to generated APK
   */
  private async buildAndroid(buildDir: string, build: any, buildType: string): Promise<string | null> {
    try {
      await this.logBuildStep(build._id, 'info', 'Building Android APK...');
      
      const androidDir = path.join(buildDir, 'android');
      
      // Build APK using Gradle
      const gradleCommand = buildType === 'release' ? 'assembleRelease' : 'assembleDebug';
      await execAsync(`./gradlew ${gradleCommand}`, { cwd: androidDir });
      
      // Find generated APK
      const apkDir = path.join(androidDir, 'app', 'build', 'outputs', 'apk', buildType);
      const apkFiles = await fs.readdir(apkDir);
      const apkFile = apkFiles.find(file => file.endsWith('.apk'));
      
      if (apkFile) {
        const apkPath = path.join(apkDir, apkFile);
        await this.logBuildStep(build._id, 'info', `Android APK generated: ${apkFile}`);
        return apkPath;
      }
      
      throw new Error('APK file not found after build');
      
    } catch (error) {
      await this.logBuildStep(build._id, 'error', `Android build failed: ${error}`);
      return null;
    }
  }

  /**
   * Builds iOS IPA
   * @param {string} buildDir - Build directory path
   * @param {any} build - Build configuration object
   * @param {string} buildType - Build type (debug|release)
   * @returns {Promise<string|null>} Path to generated IPA
   */
  private async buildIOS(buildDir: string, build: any, buildType: string): Promise<string | null> {
    try {
      await this.logBuildStep(build._id, 'info', 'Building iOS IPA...');
      
      // Note: iOS builds require macOS and Xcode
      // This is a simplified implementation
      const iosDir = path.join(buildDir, 'ios');
      
      // For demonstration, we'll create a placeholder
      // In a real implementation, you'd use xcodebuild
      const ipaPath = path.join(iosDir, `${build.config.name}.ipa`);
      await fs.writeFile(ipaPath, 'Placeholder IPA file');
      
      await this.logBuildStep(build._id, 'info', `iOS IPA generated (placeholder): ${build.config.name}.ipa`);
      return ipaPath;
      
    } catch (error) {
      await this.logBuildStep(build._id, 'error', `iOS build failed: ${error}`);
      return null;
    }
  }

  /**
   * Packages build artifacts into downloadable archives
   * @param {string} buildId - Build ID
   * @param {string[]} artifacts - Array of artifact paths
   */
  private async packageArtifacts(buildId: string, artifacts: string[]): Promise<void> {
    const artifactsDir = path.join(this.BUILDS_DIR, 'artifacts', buildId);
    await fs.ensureDir(artifactsDir);
    
    for (const artifact of artifacts) {
      const filename = path.basename(artifact);
      const targetPath = path.join(artifactsDir, filename);
      await fs.copy(artifact, targetPath);
    }
  }

  /**
   * Gets download URL for build artifact
   * @param {string} buildId - Build ID
   * @param {string} platform - Platform (android|ios)
   * @returns {Promise<string|null>} Download URL or null if not found
   */
  async getDownloadUrl(buildId: string, platform?: string): Promise<string | null> {
    const artifactsDir = path.join(this.BUILDS_DIR, 'artifacts', buildId);
    
    if (!await fs.pathExists(artifactsDir)) {
      return null;
    }
    
    const files = await fs.readdir(artifactsDir);
    let targetFile: string | undefined;
    
    if (platform === 'android') {
      targetFile = files.find(file => file.endsWith('.apk'));
    } else if (platform === 'ios') {
      targetFile = files.find(file => file.endsWith('.ipa'));
    } else {
      targetFile = files[0]; // Return first available file
    }
    
    if (targetFile) {
      return `/downloads/${buildId}/${targetFile}`;
    }
    
    return null;
  }

  /**
   * Cancels a running build
   * @param {string} buildId - Build ID to cancel
   * @returns {Promise<boolean>} Success status
   */
  async cancelBuild(buildId: string): Promise<boolean> {
    const process = this.activeBuilds.get(buildId);
    if (process) {
      process.kill();
      this.activeBuilds.delete(buildId);
      return true;
    }
    
    // Remove from queue if not yet started
    const queueIndex = this.buildQueue.indexOf(buildId);
    if (queueIndex > -1) {
      this.buildQueue.splice(queueIndex, 1);
      return true;
    }
    
    return false;
  }

  /**
   * Updates build status in database
   * @param {string} buildId - Build ID
   * @param {string} status - New status
   * @param {string} message - Status message
   */
  private async updateBuildStatus(buildId: string, status: string, message: string): Promise<void> {
    try {
      const updateData: any = { 
        status,
        $push: {
          logs: {
            timestamp: new Date(),
            level: 'info',
            message
          }
        }
      };
      
      if (status === 'completed' || status === 'failed' || status === 'cancelled') {
        updateData.completedAt = new Date();
      }
      
      await Build.findByIdAndUpdate(buildId, updateData);
    } catch (error) {
      console.error('Failed to update build status:', error);
    }
  }

  /**
   * Logs a build step with timestamp and level
   * @param {string} buildId - Build ID
   * @param {string} level - Log level (info|warn|error)
   * @param {string} message - Log message
   */
  private async logBuildStep(buildId: string, level: string, message: string): Promise<void> {
    try {
      await Build.findByIdAndUpdate(buildId, {
        $push: {
          logs: {
            timestamp: new Date(),
            level,
            message
          }
        }
      });
    } catch (error) {
      console.error('Failed to log build step:', error);
    }
  }

  /**
   * Cleans up build directory to save disk space
   * @param {string} buildDir - Build directory path
   */
  private async cleanupBuildDirectory(buildDir: string): Promise<void> {
    try {
      // Keep only essential files, remove build artifacts and node_modules
      const keepFiles = ['package.json', 'capacitor.config.ts'];
      const buildContents = await fs.readdir(buildDir);
      
      for (const item of buildContents) {
        if (!keepFiles.includes(item)) {
          await fs.remove(path.join(buildDir, item));
        }
      }
    } catch (error) {
      console.error('Failed to cleanup build directory:', error);
    }
  }
} 
