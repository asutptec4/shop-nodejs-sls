import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

@Injectable()
export class AppService {
  makeCall(request: Request, response: Response, next: NextFunction): any {
    const url = request.url.split('/')[2].split('?')[0];
    const proxyUrl = process.env[url];
    if (!proxyUrl) {
      throw new HttpException(
        'Cannot process request.',
        HttpStatus.BAD_GATEWAY,
      );
    }
    return createProxyMiddleware({
      pathRewrite: function (path) {
        const parts = path.split('/');
        parts.splice(1, 1);
        return parts.join('/');
      },
      target: proxyUrl,
      changeOrigin: true,
    })(request, response, next);
  }
}
