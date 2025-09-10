// apps/backend/src/main.ts
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const PORT = Number(process.env.PORT || 3000);

  try {
    const app = await NestFactory.create(AppModule, { 
      logger: ['log', 'error', 'warn'] 
    });
    
    app.enableCors();
    
    await app.listen(PORT, '0.0.0.0');
    
    logger.log(`🚀 NestJS application started on http://0.0.0.0:${PORT}`);
    logger.log(`🏥 Health check available at http://0.0.0.0:${PORT}/health`);
    
  } catch (err) {
    logger.error('Failed to start NestJS application:', err);
    process.exit(1);
  }
}

bootstrap();
