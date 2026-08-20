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

  app.enableCors({
    origin: config.get<string>('FRONTEND_URL', 'http://localhost:5173'),
    credentials: true,
  });

  app.setGlobalPrefix(apiPrefix);

  if (process.env.STORAGE_PROVIDER !== 'r2') {
    const storagePath = join(
      process.cwd(),
      process.env.STORAGE_LOCAL_PATH || './storage',
    );
    app.useStaticAssets(storagePath, { prefix: '/images' });
  }

  app.use(express.json({ limit: '10mb' }));

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
