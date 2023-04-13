import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { createProxyMiddleware, RequestHandler } from 'http-proxy-middleware';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AppService {
  private proxyMap: Map<string, RequestHandler> = new Map();

  constructor(private readonly httpService: HttpService) {}

  processRequest(
    request: Request,
    response: Response,
    next: NextFunction,
  ): void {
    const url = request.url.split('/')[2].split('?')[0];
    const proxyUrl = process.env[url];
    if (!proxyUrl) {
      throw new HttpException(
        'Cannot process request.',
        HttpStatus.BAD_GATEWAY,
      );
    }
    const handler = this.getOrCreateHandler(proxyUrl);
    handler(request, response, next);
  }

  private getOrCreateHandler(proxyUrl: string): RequestHandler {
    const savedHandler = this.proxyMap.get(proxyUrl);
    if (savedHandler) {
      return savedHandler;
    }
    const handler = createProxyMiddleware({
      pathRewrite: function (path) {
        const parts = path.split('/');
        parts.splice(1, 1);
        return parts.join('/');
      },
      target: proxyUrl,
      changeOrigin: true,
    });
    this.proxyMap.set(proxyUrl, handler);
    return handler;
  }

  async makeGetHttpCall(request: Request): Promise<any> {
    const url = request.url.split('/')[2].split('?')[0];
    const proxyUrl = process.env[url];
    if (!proxyUrl) {
      throw new HttpException(
        'Cannot process request.',
        HttpStatus.BAD_GATEWAY,
      );
    }
    const { data } = await firstValueFrom(
      this.httpService.get(
        proxyUrl + request.originalUrl.replace('/api-proxy', ''),
      ),
    );
    return data;
  }
}
