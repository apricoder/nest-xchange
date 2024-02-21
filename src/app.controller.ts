import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get(`/ping`)
  getPong(): string {
    return `pong`;
  }
}
