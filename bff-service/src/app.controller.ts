import { All, Controller, Get, HttpStatus, Req } from '@nestjs/common';
import { Request } from 'express';

import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get(['', 'ping'])
  healthCheck(): any {
    return {
      statusCode: HttpStatus.OK,
      message: 'OK',
    };
  }

  @All('api-proxy/*')
  serve(@Req() request: Request): any {
    return this.appService.makeCall(request);
  }
}
