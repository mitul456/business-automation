import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { KnowledgeService } from './knowledge.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { DocSourceType } from '@omniflow/shared';

@Controller('api/v1/knowledge')
@UseGuards(JwtAuthGuard, TenantGuard)
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  @Get('documents')
  async listDocuments(@Req() req: any) {
    return this.knowledgeService.listDocuments(req.tenantId);
  }

  @Post('documents')
  async addDocument(
    @Req() req: any,
    @Body()
    body: {
      title: string;
      content: string;
      sourceType: DocSourceType;
      sourceUrl?: string;
    }
  ) {
    return this.knowledgeService.addDocument({
      tenantId: req.tenantId,
      title: body.title,
      content: body.content,
      sourceType: body.sourceType,
      sourceUrl: body.sourceUrl,
    });
  }

  @Delete('documents/:documentId')
  async deleteDocument(@Req() req: any, @Param('documentId') documentId: string) {
    return this.knowledgeService.deleteDocument(req.tenantId, documentId);
  }
}
