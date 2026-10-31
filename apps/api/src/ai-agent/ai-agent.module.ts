import { Module } from '@nestjs/common';
import { AiAgentController } from './ai-agent.controller';
import { AiAgentService } from './ai-agent.service';
import { KnowledgeModule } from '../knowledge/knowledge.module';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [KnowledgeModule],
  controllers: [AiAgentController],
  providers: [AiAgentService, PrismaService],
  exports: [AiAgentService],
})
export class AiAgentModule {}
