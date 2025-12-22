import { Controller, Get, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { Response } from 'express';
import { join } from 'path';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('index.html')
  serveIndex(@Res() res: Response) {
    // En développement, servir depuis le dossier source
    // En production, servir depuis dist/public
    const isDev = process.env.NODE_ENV !== 'production';
    const publicPath = isDev 
      ? join(process.cwd(), 'public', 'index.html')
      : join(__dirname, '..', 'public', 'index.html');
    res.sendFile(publicPath);
  }
}

