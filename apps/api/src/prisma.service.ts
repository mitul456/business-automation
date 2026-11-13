import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@omniflow/database';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('PrismaService');

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Database connected successfully');
    } catch (err: any) {
      this.logger.warn(`Database connection standby: ${err.message}. Health endpoint will report status.`);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
