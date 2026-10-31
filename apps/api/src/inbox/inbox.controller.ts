import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { InboxService } from './inbox.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import {
  ConversationStatus,
  SendMessageInput,
} from '@omniflow/shared';

@Controller('api/v1/inbox')
@UseGuards(JwtAuthGuard, TenantGuard)
export class InboxController {
  constructor(private readonly inboxService: InboxService) {}

  @Get('conversations')
  async listConversations(
    @Req() req: any,
    @Query('channelId') channelId?: string,
    @Query('status') status?: ConversationStatus,
    @Query('assignedMemberId') assignedMemberId?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    return this.inboxService.listConversations({
      tenantId: req.tenantId,
      channelId,
      status,
      assignedMemberId,
      search,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 25,
    });
  }

  @Get('conversations/:conversationId')
  async getConversation(
    @Req() req: any,
    @Param('conversationId') conversationId: string
  ) {
    return this.inboxService.getConversation(req.tenantId, conversationId);
  }

  @Get('conversations/:conversationId/messages')
  async getMessages(
    @Req() req: any,
    @Param('conversationId') conversationId: string,
    @Query('limit') limit?: string
  ) {
    return this.inboxService.getMessages(
      req.tenantId,
      conversationId,
      limit ? parseInt(limit, 10) : 50
    );
  }

  @Post('messages')
  async sendMessage(@Req() req: any, @Body() body: SendMessageInput) {
    return this.inboxService.sendMessage({
      tenantId: req.tenantId,
      memberId: req.memberId,
      input: body,
    });
  }

  @Post('conversations/:conversationId/takeover')
  async takeOver(
    @Req() req: any,
    @Param('conversationId') conversationId: string
  ) {
    return this.inboxService.takeOver(req.tenantId, conversationId, req.memberId);
  }

  @Post('conversations/:conversationId/return-to-ai')
  async returnToAi(
    @Req() req: any,
    @Param('conversationId') conversationId: string
  ) {
    return this.inboxService.returnToAi(req.tenantId, conversationId);
  }
}
