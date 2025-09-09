// apps/backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

// If you have feature modules, import them here
// import { HealthModule } from './health/health.module';

const useDb =
  process.env.SKIP_DB?.toLowerCase() !== 'true' &&
  !!(
    process.env.DATABASE_URL ||
    (process.env.DB_HOST && process.env.DB_PORT && process.env.DB_USER && process.env.DB_PASSWORD && process.env.DB_NAME)
  );

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Only include TypeORM when DB is configured (so the app can still boot)
    ...(useDb
      ? [
          TypeOrmModule.forRootAsync({
            useFactory: () => {
              // Prefer DATABASE_URL if present; fall back to discrete vars.
              const url = process.env.DATABASE_URL;
              if (url) {
                return {
                  type: 'postgres',
                  url,
                  // Keep these conservative in prod; change as needed
                  autoLoadEntities: true,
                  synchronize: false,
                  // Don’t block app start forever if DB is unreachable
                  retryAttempts: 2,
                  retryDelay: 1000,
                } as any;
              }
              // Discrete config
              return {
                type: 'postgres',
                host: process.env.DB_HOST,
                port: Number(process.env.DB_PORT || 5432),
                username: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                database: process.env.DB_NAME,
                autoLoadEntities: true,
                synchronize: false,
                retryAttempts: 2,
                retryDelay: 1000,
              } as any;
            },
          }),
        ]
      : []),
    // HealthModule, other modules...
  ],
})
export class AppModule {}
