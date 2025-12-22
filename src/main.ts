import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Servir les fichiers statiques depuis le dossier public
  app.useStaticAssets(join(__dirname, '..', 'public'));
  
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
  
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Interface web: http://localhost:${port}/index.html`);
  console.log('Database: SQLite (chatnest.db)');
  console.log('WebSocket namespace: /chat');
}
bootstrap();

