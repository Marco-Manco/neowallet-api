import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
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
