import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors();

  // Global prefix for all routes
  app.setGlobalPrefix('api');

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Visakhapatnam City Police e-Complaint Service')
    .setDescription(
      'API for managing police complaints, tracking status, and police station information',
    )
    .setVersion('1.0')
    .addBasicAuth(
      {
        type: 'http',
        scheme: 'basic',
        description: 'Enter username:password for complaint creation',
      },
      'basic',
    )
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT token from /api/auth/login',
      },
      'bearer',
    )
    .addTag('auth', 'Authentication endpoints')
    .addTag('health', 'Health check endpoints')
    .addTag('complaints', 'Complaint management endpoints')
    .addTag('police-stations', 'Police station management endpoints')
    .addTag('officers', 'Officer management endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}/api`);
  console.log(`Swagger docs available at: http://localhost:${port}/docs`);
}
bootstrap();
