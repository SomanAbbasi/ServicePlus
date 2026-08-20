import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { join } from 'path';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const config = app.get(ConfigService);
  const port = config.get<number>('PORT', 3001);
  const apiPrefix = config.get<string>('API_PREFIX', 'api');

  const allowedOrigins = [
    config.get<string>('FRONTEND_URL', 'https://service-plus-flame.vercel.app'),
    'https://service-plus-flame.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
  ];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      try {
        const url = new URL(origin);
        const hostname = url.hostname;
        if (
          allowedOrigins.includes(origin) ||
          hostname.endsWith('.vercel.app') ||
          hostname === 'localhost' ||
          hostname === '127.0.0.1'
        ) {
          return callback(null, true);
        }
        return callback(null, true);
      } catch {
        return callback(null, true);
      }
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'sp_auth_token',
    ],
    credentials: true,
  });

  app.setGlobalPrefix(apiPrefix);

  if (process.env.STORAGE_PROVIDER !== 'r2') {
    try {
      const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
      const storagePath = join(
        process.cwd(),
        process.env.STORAGE_LOCAL_PATH || (isServerless ? '/tmp/storage' : './storage'),
      );
      app.useStaticAssets(storagePath, { prefix: '/images' });
    } catch (e: any) {
      console.warn(`Static assets warning: ${e?.message}`);
    }
  }

  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ limit: '20mb', extended: true }));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  await app.listen(port);
  console.log(`ServicePlus API running on http://localhost:${port}/${apiPrefix}`);
}

bootstrap();
