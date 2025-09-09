import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from './health.controller';

const useDb =
  process.env.SKIP_DB?.toLowerCase() !== 'true' &&
  !!(
    process.env.DATABASE_URL ||
    (process.env.DB_HOST &&
      process.env.DB_PORT &&
      process.env.DB_USER &&
      process.env.DB_PASSWORD &&
      process.env.DB_NAME)
  );

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ...(useDb
      ? [
          TypeOrmModule.forRootAsync({
            useFactory: () => {
              const url = process.env.DATABASE_URL;
              return url
                ? {
                    type: 'postgres',
                    url,
                    autoLoadEntities: true,
                    synchronize: false,
                    retryAttempts: 2,
                    retryDelay: 1000,
                  }
                : {
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
                  };
            },
          }),
        ]
      : []),
  ],
  controllers: [HealthController],
})
export class AppModule {}
