import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✅ Database connected successfully');
      
      // Create tables if they don't exist
      await this.createTablesIfNotExist();
      this.logger.log('✅ Database schema verified');
    } catch (error) {
      this.logger.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('🔌 Database disconnected');
  }

  private async createTablesIfNotExist() {
    try {
      // Create users table
      await this.$executeRaw`
        CREATE TABLE IF NOT EXISTS "users" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "email" TEXT NOT NULL UNIQUE,
          "name" TEXT,
          "role" TEXT NOT NULL DEFAULT 'USER',
          "organizationId" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `;

      // Create scans table
      await this.$executeRaw`
        CREATE TABLE IF NOT EXISTS "scans" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "url" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "organizationId" TEXT,
          "status" TEXT NOT NULL DEFAULT 'PENDING',
          "results" JSONB,
          "errorMessage" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "completedAt" TIMESTAMP(3),
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `;

      this.logger.log('📋 Database tables created/verified');
    } catch (error) {
      this.logger.error('❌ Failed to create database tables:', error);
      throw error;
    }
  }
}
