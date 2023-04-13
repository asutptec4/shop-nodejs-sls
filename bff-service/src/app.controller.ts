import {
  All,
  Controller,
  Get,
  HttpStatus,
  Next,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

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
  serve(
    @Req() request: Request,
    @Res() res: Response,
    @Next() next: NextFunction,
  ): any {
    return this.appService.makeCall(request, res, next);
  }
}
