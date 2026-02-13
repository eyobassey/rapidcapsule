import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, LoggerService } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as bodyParser from 'body-parser';
import helmet from 'helmet';
import * as cors from 'cors';
import * as morgan from 'morgan';
import { ValidateInputPipe } from './core/pipes/validation.pipes';
import { ResponseInterceptor } from './core/interceptors/response.interceptors';
import { MongoExceptions } from './core/exceptions/mongo.exceptions';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = <number>(<unknown>process.env.PORT);
  const logger: LoggerService = new Logger();

  app.use(helmet());
  app.use(cors({ exposedHeaders: 'X-Paystack-Key' }));
  app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(morgan('dev'));
  app.setGlobalPrefix('api');

  // Swagger / OpenAPI setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Rapid Capsule API')
    .setDescription(
      'Telemedicine platform API — Patient, Specialist, and Admin endpoints\n\nAuthored by Bassey Eyo (eyobassey@gmail.com)',
    )
    .setVersion('2.1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT token',
      },
      'JWT-auth',
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-trial-token',
        in: 'header',
        description: 'Trial access token',
      },
      'Trial-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  // handle all user input validation globally
  app.useGlobalPipes(
    new ValidateInputPipe({
      forbidUnknownValues: false,
    }),
  );
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new MongoExceptions());
  await app.listen(port, () => {
    logger.log(`Server running on port ${port}`);
    logger.log(`Swagger docs available at http://localhost:${port}/api/docs`);
  });
}
bootstrap();
