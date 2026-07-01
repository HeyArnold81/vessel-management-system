import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  root() {
    return {
      status: 'ok',
      service: 'vessel-management-api',
      message: 'HarbourOS API is running.',
      links: {
        health: '/api/health',
        docs: '/api/docs',
      },
    };
  }
}
