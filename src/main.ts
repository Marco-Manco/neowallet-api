import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { GlobalExceptionFilter } from './shared/infrastructure/filters/global-exception.filter';
import { TransformInterceptor } from './shared/infrastructure/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) => {
        const messages = errors.map(
          (err) => `${err.property}: ${Object.values(err.constraints || {}).join(', ')}`,
        );
        return new Error(messages.join('; '));
      },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('NeoWallet API')
    .setDescription('The NeoWallet API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const documenFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, documenFactory);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
