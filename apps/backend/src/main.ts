import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { PrismaService } from './database/prisma.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for frontend communication
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Enable global validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Initialize database schema at startup
  const prismaService = app.get(PrismaService);
  try {
    await prismaService.$executeRaw`SELECT 1`; // Test connection
    console.log('✅ Database connection verified');
    
    // Push schema to database (creates tables if they don't exist)
    await prismaService.$executeRaw`
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
    
    await prismaService.$executeRaw`
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
    
    console.log('✅ Database schema initialized');
  } catch (error) {
    console.error('❌ Database setup error:', error);
  }

  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  console.log(`🚀 SentryPrime v2 Backend running on port ${port}`);
  console.log(`📊 Database integration: ENABLED`);
}

bootstrap();
