import { Module } from '@nestjs/common';
import { InboxController } from './inbox.controller';
import { InboxService } from './inbox.service';
import { InboxGateway } from './inbox.gateway';
import { PrismaService } from '../prisma.service';
import { OrdersModule } from '../orders/orders.module';
import { AiAgentModule } from '../ai-agent/ai-agent.module';

@Module({
  imports: [OrdersModule, AiAgentModule],
  controllers: [InboxController],
  providers: [InboxService, InboxGateway, PrismaService],
  exports: [InboxService, InboxGateway],
})
export class InboxModule {}
