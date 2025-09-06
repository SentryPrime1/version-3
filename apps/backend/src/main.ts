import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  
  const port = process.env.PORT || 3000;
  
  // Configure CORS with environment-based origins
  const origins = (process.env.CORS_ORIGINS || '').split(',').filter(Boolean);
  app.enableCors(origins.length ? { origin: origins } : {});
  
  // Bind to all interfaces for Railway deployment
  await app.listen(Number(port), '0.0.0.0');
  
  logger.log(`Application is running on: http://0.0.0.0:${port}`);
}

bootstrap();

