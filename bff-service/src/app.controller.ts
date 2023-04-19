import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import {
  All,
  Controller,
  Get,
  HttpStatus,
  Next,
  Req,
  Res,
  UseInterceptors,
} from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

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

  @CacheTTL(2 * 60 * 1000)
  @UseInterceptors(CacheInterceptor)
  @Get('api-proxy/products')
  cachedServe(@Req() req: Request): any {
    return this.appService.makeGetHttpCall(req);
  }

  @All('api-proxy/*')
  serve(
    @Req() req: Request,
    @Res() res: Response,
    @Next() next: NextFunction,
  ): void {
    this.appService.processRequest(req, res, next);
  }
}
