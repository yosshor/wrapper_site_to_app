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
      // First verify template exists
      if (!await fs.pathExists(this.TEMPLATE_DIR)) {
        throw new Error(`Template directory not found at: ${this.TEMPLATE_DIR}`);
      }

      const build = await Build.findById(buildId).populate('appId');
      if (!build) throw new Error('Build not found');

      const app = build.appId as any;
      await this.updateBuildStatus(buildId, 'in_progress', 'Starting build process');

      // Create build directory
      const buildDir = path.join(this.BUILDS_DIR, buildId);
      await fs.ensureDir(buildDir);

      // Copy template
      await fs.copy(this.TEMPLATE_DIR, buildDir);
      console.log('Template copied to:', buildDir);

      // Update Capacitor config
      await this.updateCapacitorConfig(buildDir, {
        appId: app.androidPackageId,
        appName: app.name,
        webDir: 'www',
        serverUrl: app.websiteUrl
      });

      // Install dependencies
      await this.updateBuildStatus(buildId, 'in_progress', 'Installing dependencies');
      console.log('Installing dependencies in:', buildDir);
      await execAsync('npm install', { cwd: buildDir });

      // Build web assets
      await this.updateBuildStatus(buildId, 'in_progress', 'Building web assets');
      console.log('Building web assets in:', buildDir);
      await execAsync('npm run build', { cwd: buildDir });

      // Sync Capacitor
      await this.updateBuildStatus(buildId, 'in_progress', 'Syncing Capacitor');
      console.log('Syncing Capacitor in:', buildDir);
      await execAsync('npx cap sync android', { cwd: buildDir });

      // Build Android APK
      await this.updateBuildStatus(buildId, 'in_progress', 'Building Android APK');
      const androidDir = path.join(buildDir, 'android');
      console.log('Building APK in:', androidDir);
      
      // Run Gradle build
      await execAsync('./gradlew assembleRelease', { 
        cwd: androidDir,
        env: {
          ...process.env,
          ANDROID_HOME: process.env.ANDROID_SDK_ROOT || process.env.ANDROID_HOME
        }
      });

      // Copy APK to downloads
      const apkPath = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
      const outputPath = path.join(this.OUTPUT_DIR, `${buildId}.apk`);
      
      if (await fs.pathExists(apkPath)) {
        await fs.copy(apkPath, outputPath);
        console.log('APK copied to:', outputPath);

        // Update build with success
        await this.updateBuildStatus(buildId, 'completed', 'Build completed successfully');
        await Build.findByIdAndUpdate(buildId, {
          buildUrl: `/downloads/${buildId}.apk`,
          completedAt: new Date()
        });
      } else {
        throw new Error('APK file not found after build');
      }

      // Cleanup
      await fs.remove(buildDir);

    } catch (error) {
      console.error('Build failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Update build with failure status and detailed error
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

      throw error; // Re-throw to be caught by the API route
    }
  }

  private async updateCapacitorConfig(buildDir: string, config: {
    appId: string;
    appName: string;
    webDir: string;
    serverUrl: string;
  }): Promise<void> {
    // Update capacitor.config.ts
    const configPath = path.join(buildDir, 'capacitor.config.ts');
    let configContent = await fs.readFile(configPath, 'utf8');
    
    configContent = configContent
      .replace(/appId: ['"].*['"]/, `appId: '${config.appId}'`)
      .replace(/appName: ['"].*['"]/, `appName: '${config.appName}'`)
      .replace(/webDir: ['"].*['"]/, `webDir: '${config.webDir}'`);

    await fs.writeFile(configPath, configContent);

    // Update package.json
    const packagePath = path.join(buildDir, 'package.json');
    const packageJson = await fs.readJson(packagePath);
    
    if (packageJson.capacitor) {
      packageJson.capacitor.appId = config.appId;
      packageJson.capacitor.appName = config.appName;
    }
    
    await fs.writeJson(packagePath, packageJson, { spaces: 2 });

    // Update index.html with website URL
    const srcDir = path.join(buildDir, 'src');
    await fs.ensureDir(srcDir);
    
    const indexPath = path.join(srcDir, 'index.html');
    if (!await fs.pathExists(indexPath)) {
      // Create basic index.html if it doesn't exist
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
      await fs.writeFile(indexPath, indexContent);
    } else {
      // Update existing index.html
      let indexContent = await fs.readFile(indexPath, 'utf8');
      if (!indexContent.includes('meta http-equiv="refresh"')) {
        indexContent = indexContent.replace('</head>', 
          `    <meta http-equiv="refresh" content="0; url=${config.serverUrl}">\n</head>`);
        await fs.writeFile(indexPath, indexContent);
      }
    }
  }

  private async updateBuildStatus(buildId: string, status: string, message: string): Promise<void> {
    await Build.findByIdAndUpdate(buildId, {
      status,
      $push: {
        logs: {
          timestamp: new Date(),
          message,
          level: status === 'failed' ? 'error' : 'info'
        }
      }
    });
  }

  async getBuildStatus(buildId: string): Promise<any> {
    return Build.findById(buildId);
  }

  async getDownloadUrl(buildId: string): Promise<string | null> {
    const build = await Build.findById(buildId);
    return build?.buildUrl || null;
  }
}

export const buildService = new BuildService(); 
