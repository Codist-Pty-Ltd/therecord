import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

/** Production browser origins (explicit — never wildcard). */
const CORS_ALLOWED_ORIGINS = [
  'https://therecord.co.za',
  'https://www.therecord.co.za',
  'https://therecord.codist.co.za',
  'https://www.therecord.codist.co.za',
];

/** Local dev: compose binds 127.0.0.1:3090 but browsers treat localhost ≠ 127.0.0.1. */
const CORS_LOCAL_DEV_ORIGINS = [
  'http://localhost:3090',
  'http://localhost:3000',
  'http://127.0.0.1:3090',
  'http://127.0.0.1:3000',
];

function isLocalDevBrowserOrigin(origin: string): boolean {
  try {
    const { hostname, port, protocol } = new URL(origin);
    if (protocol !== 'http:') return false;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') return false;
    return port === '3090' || port === '3000';
  } catch {
    return false;
  }
}

function corsOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return true;
  if (CORS_ALLOWED_ORIGINS.includes(origin)) return true;
  if (CORS_LOCAL_DEV_ORIGINS.includes(origin)) return true;
  if (process.env.NODE_ENV !== 'production' && isLocalDevBrowserOrigin(origin)) {
    return true;
  }
  return false;
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: (origin, callback) => {
      if (corsOriginAllowed(origin)) {
        callback(null, origin ?? true);
        return;
      }
      callback(new Error(`CORS blocked origin: ${origin}`), false);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.enableShutdownHooks();

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('The Record API')
      .setDescription(
        'South African legal intelligence and news timeline platform. ' +
          'Tracks stories from incident → charges → court → outcome and ' +
          'maps events to the Constitution, statutes, and case law.',
      )
      .setVersion('0.1.0')
      .addTag('Stories', 'Story threads — the core unit of The Record')
      .addTag('Timeline', 'Events within a story, ordered chronologically')
      .addTag('People', 'People who appear in stories (accused, chairs, witnesses…)')
      .addTag('Legal', 'Statutes, law sections, and constitutional provisions')
      .addTag('Investigations', 'Commissions, inquiries and investigative bodies')
      .addTag('History', 'South African historical eras, events, laws, statistics')
      .addTag('search', 'Global search across all indexed entities')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  const port = Number(process.env.PORT ?? 3091);
  await app.listen(port, '0.0.0.0');

  const logger = new Logger('Bootstrap');
  logger.log(`The Record API listening on http://0.0.0.0:${port}/api`);
  if (!isProduction) {
    logger.log(`Swagger docs at       http://0.0.0.0:${port}/api/docs`);
    logger.log(`GraphQL playground at http://0.0.0.0:${port}/graphql`);
  }
}

void bootstrap();
