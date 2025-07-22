/**
 * @fileoverview BuildService for handling automated mobile app generation
 * @author YosShor
 * @version 1.0.0
 * @description Service for orchestrating mobile app builds using Capacitor CLI
 */

import { Build } from '../models/Build';
import App from '../models/App';
import { exec } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class BuildService {
  // Change the path to look in the root directory, not in backend
  private readonly TEMPLATE_DIR = path.join(process.cwd(), '..', 'mobile-template');
  private readonly BUILDS_DIR = path.join(process.cwd(), '..', 'builds');
  private readonly OUTPUT_DIR = path.join(process.cwd(), '..', 'public', 'downloads');

  constructor() {
    this.initializeDirs();
  }

  private async initializeDirs() {
    await fs.ensureDir(this.BUILDS_DIR);
    await fs.ensureDir(this.OUTPUT_DIR);
  }

  async startBuild(buildId: string): Promise<void> {
    try {
      const build = await Build.findById(buildId).populate('appId');
      if (!build) throw new Error('Build not found');

      const app = build.appId as any;
      await this.updateBuildStatus(buildId, 'in_progress', 'Starting build process');

      // Create build directory
      const buildDir = path.join(this.BUILDS_DIR, buildId);
      await fs.ensureDir(buildDir);

      // Copy template
      await fs.copy(this.TEMPLATE_DIR, buildDir);
      await this.updateBuildStatus(buildId, 'in_progress', 'Template copied successfully');

      // Update Capacitor config
      await this.updateCapacitorConfig(buildDir, {
        appId: app.androidPackageId,
        appName: app.name,
        webDir: 'www',
        serverUrl: app.websiteUrl,
        iosAppId: app.iosPackageId || app.androidPackageId
      });
      await this.updateBuildStatus(buildId, 'in_progress', 'Configuration updated');

      // Install dependencies
      await this.updateBuildStatus(buildId, 'in_progress', 'Installing dependencies');
      await execAsync('npm install --legacy-peer-deps', { cwd: buildDir });

      // Build web assets and sync platforms
      await this.updateBuildStatus(buildId, 'in_progress', 'Building web assets');
      await execAsync('npm run build', { cwd: buildDir });

      // Build Android APK
      let androidApkPath: string | null = null;
      let iosIpaPath: string | null = null;

      try {
        await this.updateBuildStatus(buildId, 'in_progress', 'Building Android APK');
        androidApkPath = await this.buildAndroid(buildDir);
        await this.updateBuildStatus(buildId, 'in_progress', 'Android APK built successfully');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Android build failed:', errorMessage);
        await this.updateBuildStatus(buildId, 'in_progress', `Android build failed: ${errorMessage}`);
      }

      // Build iOS IPA if on macOS
      if (process.platform === 'darwin') {
        try {
          await this.updateBuildStatus(buildId, 'in_progress', 'Building iOS IPA');
          iosIpaPath = await this.buildIOS(buildDir);
          await this.updateBuildStatus(buildId, 'in_progress', 'iOS IPA built successfully');
        } catch (error) {
          await this.updateBuildStatus(buildId, 'in_progress', `iOS build failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      } else {
        await this.updateBuildStatus(buildId, 'in_progress', 'Skipping iOS build (requires macOS)');
      }

      // Check if at least one build succeeded (on Windows, we only expect Android to succeed)
      if (!androidApkPath) {
        if (process.platform === 'darwin' && !iosIpaPath) {
          throw new Error('Both Android and iOS builds failed');
        } else if (process.platform !== 'darwin') {
          throw new Error('Android build failed');
        }
      }

      // Copy artifacts to downloads
      const buildFiles: { android?: string; ios?: string } = {};

      if (androidApkPath) {
        const apkOutputPath = path.join(this.OUTPUT_DIR, `${buildId}.apk`);
        await fs.copy(androidApkPath, apkOutputPath);
        buildFiles.android = `/downloads/${buildId}.apk`;
      }

      if (iosIpaPath) {
        const ipaOutputPath = path.join(this.OUTPUT_DIR, `${buildId}.ipa`);
        await fs.copy(iosIpaPath, ipaOutputPath);
        buildFiles.ios = `/downloads/${buildId}.ipa`;
      }

      // Update build with success
      await Build.findByIdAndUpdate(buildId, {
        status: 'completed',
        buildFiles,
        completedAt: new Date(),
        $push: {
          logs: {
            timestamp: new Date(),
            message: 'Build completed successfully',
            level: 'info'
          }
        }
      });

      // Cleanup
      await fs.remove(buildDir);

    } catch (error) {
      console.error('Build failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      await Build.findByIdAndUpdate(buildId, {
        status: 'failed',
        error: errorMessage,
        completedAt: new Date(),
        $push: {
          logs: {
            timestamp: new Date(),
            message: `Build failed: ${errorMessage}`,
            level: 'error'
          }
        }
      });

      throw error;
    }
  }

  private async buildAndroid(buildDir: string): Promise<string> {
    try {
      // First sync the project
      await execAsync('npx cap sync android', { cwd: buildDir });
      
      // Build debug APK (more reliable than release)
      const gradlewCmd = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
      await execAsync(`cd android && ${gradlewCmd} assembleDebug`, { 
        cwd: buildDir,
        env: {
          ...process.env,
          ANDROID_HOME: process.env.ANDROID_SDK_ROOT || process.env.ANDROID_HOME
        }
      });

      // Check for debug APK first, then release
      const possibleApkPaths = [
        path.join(buildDir, 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk'),
        path.join(buildDir, 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk'),
        path.join(buildDir, 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release-unsigned.apk')
      ];

      for (const apkPath of possibleApkPaths) {
        if (await fs.pathExists(apkPath)) {
          return apkPath;
        }
      }

      // If no APK found, list the contents to debug
      const outputDir = path.join(buildDir, 'android', 'app', 'build', 'outputs', 'apk');
      if (await fs.pathExists(outputDir)) {
        try {
          const contents = await fs.readdir(outputDir);
          const debugInfo = contents.join(', ');
          throw new Error(`APK file not found. Available in outputs/apk: ${debugInfo}`);
        } catch (readError) {
          throw new Error('APK file not found and could not read output directory');
        }
      } else {
        throw new Error('APK output directory not found after build');
      }
    } catch (error: any) {
      // Log the full error for debugging
      console.error('Android build error:', error);
      throw new Error(`Android build failed: ${error.message || error}`);
    }
  }

  private async buildIOS(buildDir: string): Promise<string> {
    // First sync the project
    await execAsync('npx cap sync ios', { cwd: buildDir });
    
    // Then build using Capacitor
    await execAsync('npm run ios:build', { 
      cwd: buildDir,
      env: {
        ...process.env,
        DEVELOPER_DIR: process.env.XCODE_PATH // Optional, for specific Xcode version
      }
    });

    const ipaPath = path.join(buildDir, 'ios', 'App', 'build', 'App.ipa');
    if (!await fs.pathExists(ipaPath)) {
      throw new Error('IPA file not found after build');
    }

    return ipaPath;
  }

  private async updateCapacitorConfig(buildDir: string, config: {
    appId: string;
    appName: string;
    webDir: string;
    serverUrl: string;
    iosAppId: string;
  }): Promise<void> {
    // Update capacitor.config.ts
    const configPath = path.join(buildDir, 'capacitor.config.ts');
    let configContent = await fs.readFile(configPath, 'utf8');
    
    configContent = configContent
      .replace(/appId: ['"].*['"]/, `appId: '${config.appId}'`)
      .replace(/appName: ['"].*['"]/, `appName: '${config.appName}'`)
      .replace(/webDir: ['"].*['"]/, `webDir: '${config.webDir}'`);

    // Add iOS-specific configuration
    if (!configContent.includes('ios:')) {
      configContent = configContent.replace(
        'export default {',
        `export default {
  ios: {
    scheme: '${config.appName.replace(/\s+/g, '')}',
    bundleId: '${config.iosAppId}'
  },`
      );
    }

    await fs.writeFile(configPath, configContent);

    // Update package.json
    const packagePath = path.join(buildDir, 'package.json');
    const packageJson = await fs.readJson(packagePath);
    
    if (packageJson.capacitor) {
      packageJson.capacitor.appId = config.appId;
      packageJson.capacitor.appName = config.appName;
    }
    
    await fs.writeJson(packagePath, packageJson, { spaces: 2 });

    // Create or update index.html
    const srcDir = path.join(buildDir, 'src');
    await fs.ensureDir(srcDir);
    
    const indexContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <title>${config.appName}</title>
    <meta http-equiv="refresh" content="0; url=${config.serverUrl}">
</head>
<body>
    <p>Redirecting to ${config.serverUrl}...</p>
</body>
</html>`;

    await fs.writeFile(path.join(srcDir, 'index.html'), indexContent);
  }

  private async updateBuildStatus(buildId: string, status: string, message: string): Promise<void> {
    await Build.findByIdAndUpdate(buildId, {
      status,
      $push: {
        logs: {
          timestamp: new Date(),
          message,
          level: message.toLowerCase().includes('failed') ? 'error' : 'info'
        }
      }
    });
  }

  async getBuildStatus(buildId: string): Promise<any> {
    return Build.findById(buildId);
  }

  async getDownloadUrl(buildId: string): Promise<string | null> {
    const build = await Build.findById(buildId);
    return build?.buildFiles?.android || build?.buildFiles?.ios || null;
  }
}

export const buildService = new BuildService(); 
