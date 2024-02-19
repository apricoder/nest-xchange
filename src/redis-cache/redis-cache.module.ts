import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule, CacheModuleOptions } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';

const redisCacheModule = CacheModule.register({
  imports: [ConfigModule],
  useFactory: async (
    configService: ConfigService,
  ): Promise<CacheModuleOptions> => {
    const host = configService.get<string>('redis.host');
    const port = configService.get<number>('redis.port');
    const password = configService.get<string>('redis.password');
    return {
      store: redisStore,
      url: `redis://:${password}@${host}:${port}`,
    };
  },
  inject: [ConfigService],
});

@Module({
  imports: [redisCacheModule],
  exports: [redisCacheModule],
})
export class RedisCacheModule {}
