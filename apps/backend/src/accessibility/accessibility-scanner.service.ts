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
    total: number;
  };
  complianceScore: number; // 0-100, higher is better
  wcagLevel: 'AA' | 'AAA';
  passedRules: number;
  totalRules: number;
  scanDuration: number; // milliseconds
}

@Injectable()
export class AccessibilityScannerService {
  private readonly logger = new Logger(AccessibilityScannerService.name);
  private browser: Browser | null = null;

  async onModuleInit() {
    this.logger.log('🚀 Initializing Accessibility Scanner Service...');
    await this.initializeBrowser();
  }

  async onModuleDestroy() {
    this.logger.log('🔄 Shutting down Accessibility Scanner Service...');
    await this.closeBrowser();
  }

  private async initializeBrowser(): Promise<void> {
    try {
      this.logger.log('🌐 Launching Puppeteer browser...');
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
      this.logger.log('✅ Puppeteer browser launched successfully');
    } catch (error) {
      this.logger.error('❌ Failed to launch Puppeteer browser:', error);
      throw error;
    }
  }

  private async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.logger.log('✅ Puppeteer browser closed');
    }
  }

  async scanWebsite(url: string): Promise<AccessibilityScanResult> {
    const startTime = Date.now();
    this.logger.log(`🔍 Starting accessibility scan for: ${url}`);

    if (!this.browser) {
      await this.initializeBrowser();
    }

    let page: Page | null = null;

    try {
      // Create new page
      page = await this.browser!.newPage();
      
      // Set viewport for consistent scanning
      await page.setViewport({ width: 1280, height: 720 });
      
      // Set user agent
      await page.setUserAgent('SentryPrime-ADA-Scanner/1.0');

      this.logger.log(`📄 Loading page: ${url}`);
      
      // Navigate to the page with timeout
      await page.goto(url, { 
        waitUntil: 'networkidle2', 
        timeout: 30000 
      });

      this.logger.log('🔬 Running axe-core accessibility analysis...');

      // Run axe-core accessibility analysis
      const axeResults: AxeResults = await new AxePuppeteer(page)
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();

      const scanDuration = Date.now() - startTime;

      // Process results
      const result = this.processAxeResults(url, axeResults, scanDuration);
      
      this.logger.log(`✅ Scan completed for ${url} in ${scanDuration}ms`);
      this.logger.log(`📊 Found ${result.violationCount.total} violations (Critical: ${result.violationCount.critical}, Serious: ${result.violationCount.serious})`);
      this.logger.log(`🎯 Compliance Score: ${result.complianceScore}/100`);

      return result;

    } catch (error) {
      this.logger.error(`❌ Accessibility scan failed for ${url}:`, error);
      throw new Error(`Accessibility scan failed: ${error.message}`);
    } finally {
      if (page) {
        await page.close();
      }
    }
  }

  private processAxeResults(
    url: string, 
    axeResults: AxeResults, 
    scanDuration: number
  ): AccessibilityScanResult {
    
    // Convert axe violations to our format
    const violations: AccessibilityViolation[] = axeResults.violations.map((violation: AxeViolation) => ({
      id: violation.id,
      impact: violation.impact as 'minor' | 'moderate' | 'serious' | 'critical',
      description: violation.description,
      help: violation.help,
      helpUrl: violation.helpUrl,
      tags: violation.tags,
      nodes: violation.nodes.map(node => ({
        html: node.html,
        target: node.target,
        failureSummary: node.failureSummary || 'No failure summary available'
      }))
    }));

    // Count violations by severity
    const violationCount = {
      critical: violations.filter(v => v.impact === 'critical').length,
      serious: violations.filter(v => v.impact === 'serious').length,
      moderate: violations.filter(v => v.impact === 'moderate').length,
      minor: violations.filter(v => v.impact === 'minor').length,
      total: violations.length
    };

    // Calculate compliance score (0-100)
    const totalRules = axeResults.passes.length + violations.length;
    const passedRules = axeResults.passes.length;
    
    // Weight violations by severity for scoring
    const weightedViolations = 
      (violationCount.critical * 4) + 
      (violationCount.serious * 3) + 
      (violationCount.moderate * 2) + 
      (violationCount.minor * 1);

    // Calculate score (higher is better)
    const maxPossibleScore = totalRules * 4; // If all rules were critical violations
    const actualScore = maxPossibleScore - weightedViolations;
    const complianceScore = Math.max(0, Math.round((actualScore / maxPossibleScore) * 100));

    return {
      url,
      timestamp: new Date(),
      violations,
      violationCount,
      complianceScore,
      wcagLevel: 'AA', // We're testing WCAG 2.1 AA compliance
      passedRules,
      totalRules,
      scanDuration
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      this.logger.log('🧪 Testing accessibility scanner connection...');
      
      if (!this.browser) {
        await this.initializeBrowser();
      }

      const page = await this.browser!.newPage();
      await page.goto('data:text/html,<html><body><h1>Test</h1></body></html>');
      await page.close();
      
      this.logger.log('✅ Accessibility scanner test successful');
      return true;
    } catch (error) {
      this.logger.error('❌ Accessibility scanner test failed:', error);
      return false;
    }
  }

  async getServiceStatus(): Promise<{
    status: 'healthy' | 'unhealthy';
    browserReady: boolean;
    lastError?: string;
  }> {
    try {
      const browserReady = this.browser !== null;
      const testPassed = await this.testConnection();
      
      return {
        status: testPassed ? 'healthy' : 'unhealthy',
        browserReady,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        browserReady: false,
        lastError: error.message
      };
    }
  }
}

