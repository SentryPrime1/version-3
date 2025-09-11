// apps/backend/src/accessibility/accessibility.module.ts
import { Module } from '@nestjs/common';
import { AccessibilityScanner } from './accessibility-scanner.service';

@Module({
  providers: [AccessibilityScanner],
  exports: [AccessibilityScanner],
})
export class AccessibilityModule {
  constructor() {
    console.log('🔍 AccessibilityModule initialized');
  }
}

