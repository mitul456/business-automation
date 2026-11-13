import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { KnowledgeService } from './knowledge.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { DocSourceType, WorkspaceRole } from '@omniflow/shared';

@Controller('api/v1/knowledge')
@UseGuards(JwtAuthGuard, TenantGuard)
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  @Get('documents')
  async listDocuments(@Req() req: any) {
    return this.knowledgeService.listDocuments(req.tenantId);
  }

  @Get('documents/:documentId')
  async getDocument(@Req() req: any, @Param('documentId') documentId: string) {
    return this.knowledgeService.getDocument(req.tenantId, documentId);
  }

  @Post('documents')
  @UseGuards(RolesGuard)
  @Roles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER, WorkspaceRole.MANAGER)
  async addDocument(
    @Req() req: any,
    @Body()
    body: {
      title: string;
      content?: string;
      sourceType: DocSourceType;
      sourceUrl?: string;
      fileName?: string;
    }
  ) {
    return this.knowledgeService.addDocument({
      tenantId: req.tenantId,
      title: body.title,
      content: body.content,
      sourceType: body.sourceType,
      sourceUrl: body.sourceUrl,
      fileName: body.fileName,
    });
  }

  @Post('documents/:documentId/reindex')
  @UseGuards(RolesGuard)
  @Roles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER, WorkspaceRole.MANAGER)
  async reindexDocument(@Req() req: any, @Param('documentId') documentId: string) {
    return this.knowledgeService.reindexDocument(req.tenantId, documentId);
  }

  @Delete('documents/:documentId')
  @UseGuards(RolesGuard)
  @Roles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  async deleteDocument(@Req() req: any, @Param('documentId') documentId: string) {
    return this.knowledgeService.deleteDocument(req.tenantId, documentId);
  }

  @Post('search')
  async search(
    @Req() req: any,
    @Body() body: { query: string; topK?: number; minSimilarity?: number }
  ) {
    return this.knowledgeService.semanticSearch(
      req.tenantId,
      body.query,
      body.topK || 3,
      body.minSimilarity || 0.3
    );
  }
}
