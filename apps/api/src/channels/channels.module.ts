import { Module } from '@nestjs/common';
import { ChannelsController } from './channels.controller';
import { WebhooksController } from './webhooks.controller';
import { ChannelsService } from './channels.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [ChannelsController, WebhooksController],
  providers: [ChannelsService, PrismaService],
  exports: [ChannelsService],
})
export class ChannelsModule {}
