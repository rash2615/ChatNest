import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Activer la validation globale
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  
  // Activer CORS pour permettre les connexions WebSocket depuis le frontend
  app.enableCors({
    origin: '*',
    credentials: true,
  });
  
  await app.listen(3000);
  console.log('Application is running on: http://localhost:3000');
  console.log('Database: SQLite (chatnest.db)');
}
bootstrap();

