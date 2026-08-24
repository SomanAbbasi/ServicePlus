import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    await this.connectWithRetry();
  }

  async connectWithRetry(retries = 5, delay = 2000) {
    for (let i = 0; i < retries; i++) {
      try {
        await this.$connect();
        this.logger.log('Prisma connected to database successfully.');
        return;
      } catch (err: any) {
        this.logger.warn(`Prisma connection attempt ${i + 1}/${retries} failed: ${err.message}`);
        if (i === retries - 1) throw err;
        await new Promise((res) => setTimeout(res, delay));
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
