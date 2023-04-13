import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class AppService {
  makeCall(request: Request): any {
    console.log(request);
    const url = request.url.split('/')[2];
    const proxyUrl = process.env[url];
    if (!proxyUrl) {
      throw new HttpException(
        'Cannot process request.',
        HttpStatus.BAD_GATEWAY,
      );
    }
    // make call
    return {
      statusCode: HttpStatus.OK,
      message: proxyUrl,
    };
  }
}
