import { Module } from '@nestjs/common';
import { KnowledgeController } from './knowledge.controller';
import { KnowledgeService } from './knowledge.service';
import { PrismaService } from '../prisma.service';
import { AiProviderFactory } from '../ai-agent/providers/ai-provider.factory';

@Module({
  controllers: [KnowledgeController],
  providers: [KnowledgeService, PrismaService, AiProviderFactory],
  exports: [KnowledgeService, AiProviderFactory],
})
export class KnowledgeModule {}
