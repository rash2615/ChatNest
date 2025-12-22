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
    const isDev = process.env.NODE_ENV !== 'production';
    const publicPath = isDev 
      ? join(process.cwd(), 'public', 'index.html')
      : join(__dirname, '..', 'public', 'index.html');
    res.sendFile(publicPath);
  }

  @Get('login.html')
  serveLogin(@Res() res: Response) {
    const isDev = process.env.NODE_ENV !== 'production';
    const publicPath = isDev 
      ? join(process.cwd(), 'public', 'login.html')
      : join(__dirname, '..', 'public', 'login.html');
    res.sendFile(publicPath);
  }

  @Get('register.html')
  serveRegister(@Res() res: Response) {
    const isDev = process.env.NODE_ENV !== 'production';
    const publicPath = isDev 
      ? join(process.cwd(), 'public', 'register.html')
      : join(__dirname, '..', 'public', 'register.html');
    res.sendFile(publicPath);
  }

  @Get('chat.html')
  serveChat(@Res() res: Response) {
    const isDev = process.env.NODE_ENV !== 'production';
    const publicPath = isDev 
      ? join(process.cwd(), 'public', 'chat.html')
      : join(__dirname, '..', 'public', 'chat.html');
    res.sendFile(publicPath);
  }
}

