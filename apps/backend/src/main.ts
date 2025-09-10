// apps/backend/src/main.ts
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

const PORT = Number(process.env.PORT || 3000);

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  try {
    logger.log('🚀 Starting NestJS application...');
    logger.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.log(`🔗 Database URL configured: ${process.env.DATABASE_URL ? 'YES' : 'NO'}`);
    
    const app = await NestFactory.create(AppModule, { 
      logger: ['log', 'error', 'warn', 'debug'] 
    });
    
    app.enableCors();
    
    logger.log('🔧 Application created successfully');
    logger.log(`🌐 Starting server on port ${PORT}...`);
    
    await app.listen(PORT, '0.0.0.0');

    logger.log(`🚀 NestJS application started on http://0.0.0.0:${PORT}`);
    logger.log(`🏥 Health check available at http://0.0.0.0:${PORT}/health`);
    logger.log(`📋 Scans API available at http://0.0.0.0:${PORT}/scans`);
    
  } catch (err) {
    logger.error('❌ Failed to start NestJS application:', err);
    if (err instanceof Error) {
      logger.error('Stack trace:', err.stack);
    }
    process.exit(1);
  }
}

bootstrap();

