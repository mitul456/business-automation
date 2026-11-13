import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { StructuredLogger } from './common/logger/structured-logger.service';
import { validateServerEnv } from '@omniflow/shared';

async function bootstrap() {
  // Validate Server Environment Variables
  const env = validateServerEnv();

  const logger = new StructuredLogger();
  const app = await NestFactory.create(AppModule, {
    logger,
  });

  // cPanel Passenger Sub-URI Normalization Middleware
  // If mounted at /api in cPanel Setup Node.js App, Passenger may strip the /api prefix from req.url
  app.use((req: any, res: any, next: any) => {
    if (req.url.startsWith('/v1/') && !req.url.startsWith('/api/')) {
      req.url = '/api' + req.url;
    }
    next();
  });

  // Security Headers Middleware
  app.use((req: any, res: any, next: any) => {
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // Global Middlewares & Interceptors
  const configuredOrigin = process.env.APP_BASE_URL || 'https://omniflow.antcodes.dev';
  const allowedOrigins = [
    configuredOrigin,
    'https://omniflow.antcodes.dev',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ];

  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    })
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  // Swagger API Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('OmniFlow AI SaaS API')
    .setDescription('Commercial-grade Omnichannel AI Business Automation Platform API documentation')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || env.PORT || 4000;
  await app.listen(port);
  logger.log(`🚀 OmniFlow Backend API is running on: ${port}`);
  logger.log(`📚 Swagger API Documentation available at: http://localhost:${port}/api/docs`);
}

bootstrap();
