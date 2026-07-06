import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cors from 'cors';
import { ValidationPipe } from '@nestjs/common';
import { useContainer } from 'class-validator';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cors({
    origin: '*',
    credentials: true,
  }));

  app.setGlobalPrefix('api/v1');
   app.useGlobalPipes(new ValidationPipe({
    transform: true,        // ← OBLIGATOIRE pour que @Type() fonctionne
    whitelist: true,
  }));

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`Server running on port ${port}`);
}
bootstrap();
