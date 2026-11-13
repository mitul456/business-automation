import { Module } from '@nestjs/common';
import { AiAgentController } from './ai-agent.controller';
import { AiAgentService } from './ai-agent.service';
import { AiPipelineService } from './ai-pipeline.service';
import { AiProviderFactory } from './providers/ai-provider.factory';
import { KnowledgeModule } from '../knowledge/knowledge.module';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [KnowledgeModule],
  controllers: [AiAgentController],
  providers: [
    AiAgentService,
    AiPipelineService,
    AiProviderFactory,
    PrismaService,
  ],
  exports: [AiAgentService, AiPipelineService, AiProviderFactory],
})
export class AiAgentModule {}
