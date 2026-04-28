import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

const CORS_ALLOWED_ORIGINS = [
  'http://localhost:3090',
  'http://localhost:3000',
  'https://therecord.codist.co.za',
];

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: CORS_ALLOWED_ORIGINS,
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
  }
}

void bootstrap();
