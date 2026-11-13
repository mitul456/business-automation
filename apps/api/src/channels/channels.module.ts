import { Module, forwardRef } from '@nestjs/common';
import { ChannelsController } from './channels.controller';
import { WebhooksController } from './webhooks.controller';
import { ChannelsService } from './channels.service';
import { InboxModule } from '../inbox/inbox.module';
import { AiAgentModule } from '../ai-agent/ai-agent.module';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [
    forwardRef(() => InboxModule),
    forwardRef(() => AiAgentModule),
  ],
  controllers: [ChannelsController, WebhooksController],
  providers: [ChannelsService, PrismaService],
  exports: [ChannelsService],
})
export class ChannelsModule {}
