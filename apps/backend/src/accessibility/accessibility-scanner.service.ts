// apps/backend/src/accessibility/accessibility-scanner.service.ts
import { Injectable, Logger } from '@nestjs/common';
import puppeteer, { Browser, Page } from 'puppeteer';
import { AxePuppeteer } from '@axe-core/puppeteer';
import { AxeResults, Result as AxeViolation } from 'axe-core';

export interface AccessibilityViolation {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  description: string;
  help: string;
  helpUrl: string;
  tags: string[];
  nodes: {
    html: string;
    target: string[];
    failureSummary: string;
  }[];
}

export interface AccessibilityScanResult {
  url: string;
  timestamp: Date;
  violations: AccessibilityViolation[];
  violationCount: {
    critical: number;
    serious: number;
    moderate: number;
    minor: number;
  };
  complianceScore: number;
  passedRules: number;
  failedRules: number;
  scanDuration: number;
}

@Injectable()
export class AccessibilityScanner {
  private readonly logger = new Logger(AccessibilityScanner.name);
  private browser: Browser | null = null;

  constructor() {
    this.logger.log('🔍 AccessibilityScanner service initialized');
  }

  async onModuleInit() {
    try {
      this.logger.log('🚀 Initializing Puppeteer browser...');
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      });
      this.logger.log('✅ Puppeteer browser initialized successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.logger.error(`❌ Failed to initialize Puppeteer: ${errorMessage}`);
    }
  }

  async onModuleDestroy() {
    if (this.browser) {
      await this.browser.close();
      this.logger.log('🔒 Puppeteer browser closed');
    }
  }

  async scanWebsite(url: string): Promise<AccessibilityScanResult> {
    const startTime = Date.now();
    this.logger.log(`🔍 Starting accessibility scan for: ${url}`);

    let page: Page | null = null;

    try {
      // Ensure browser is available
      if (!this.browser) {
        await this.onModuleInit();
      }

      if (!this.browser) {
        throw new Error('Failed to initialize browser');
      }

      // Create new page
      page = await this.browser.newPage();
      
      // Set viewport and user agent
      await page.setViewport({ width: 1280, height: 720 });
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

      // Navigate to the URL
      this.logger.log(`📄 Loading page: ${url}`);
      await page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });

      // Wait for page to be fully loaded
      await page.waitForTimeout(2000);

      // Run axe-core accessibility analysis
      this.logger.log('🔬 Running axe-core accessibility analysis...');
      const axeResults: AxeResults = await new AxePuppeteer(page).analyze();

      // Process results
      const scanResult = await this.processAxeResults(url, axeResults, startTime);
      
      this.logger.log(`✅ Accessibility scan completed for ${url}`);
      this.logger.log(`📊 Found ${scanResult.violations.length} violations`);
      this.logger.log(`🎯 Compliance score: ${scanResult.complianceScore}%`);

      return scanResult;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.logger.error(`❌ Accessibility scan failed for ${url}: ${errorMessage}`);
      throw new Error(`Accessibility scan failed: ${errorMessage}`);
    } finally {
      if (page) {
        await page.close();
      }
    }
  }

  private async processAxeResults(
    url: string, 
    axeResults: AxeResults, 
    startTime: number
  ): Promise<AccessibilityScanResult> {
    
    const scanDuration = Date.now() - startTime;

    // Convert axe violations to our format with proper type handling
    const violations: AccessibilityViolation[] = axeResults.violations.map((violation: AxeViolation) => ({
      id: violation.id,
      impact: violation.impact as 'minor' | 'moderate' | 'serious' | 'critical',
      description: violation.description,
      help: violation.help,
      helpUrl: violation.helpUrl,
      tags: violation.tags,
      nodes: violation.nodes.map(node => ({
        html: node.html,
        target: Array.isArray(node.target) ? node.target.map(t => String(t)) : [String(node.target)],
        failureSummary: node.failureSummary || 'No failure summary available'
      }))
    }));

    // Count violations by severity
    const violationCount = {
      critical: violations.filter(v => v.impact === 'critical').length,
      serious: violations.filter(v => v.impact === 'serious').length,
      moderate: violations.filter(v => v.impact === 'moderate').length,
      minor: violations.filter(v => v.impact === 'minor').length,
    };

    // Calculate compliance score (0-100)
    const totalRules = axeResults.passes.length + axeResults.violations.length;
    const passedRules = axeResults.passes.length;
    const complianceScore = totalRules > 0 ? Math.round((passedRules / totalRules) * 100) : 0;

    return {
      url,
      timestamp: new Date(),
      violations,
      violationCount,
      complianceScore,
      passedRules: axeResults.passes.length,
      failedRules: axeResults.violations.length,
      scanDuration
    };
  }

  async isHealthy(): Promise<boolean> {
    try {
      if (!this.browser) {
        await this.onModuleInit();
      }
      return this.browser !== null;
    } catch (error) {
      this.logger.error('Health check failed:', error);
      return false;
    }
  }

  async getServiceStats() {
    return {
      browserInitialized: this.browser !== null,
      timestamp: new Date().toISOString(),
      service: 'AccessibilityScanner',
      version: '1.0.0'
    };
  }
}

