import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
      limit ? parseInt(limit, 10) : 100
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

  @Patch('conversations/:conversationId/assign')
  async assignMember(
    @Req() req: any,
    @Param('conversationId') conversationId: string,
    @Body() body: { memberId: string | null }
  ) {
    return this.inboxService.assignMember(req.tenantId, conversationId, body.memberId);
  }

  @Get('conversations/:conversationId/summary')
  async getSummary(
    @Req() req: any,
    @Param('conversationId') conversationId: string
  ) {
    return this.inboxService.generateConversationSummary(req.tenantId, conversationId);
  }

  @Post('customers/:customerId/tags')
  async addCustomerTag(
    @Req() req: any,
    @Param('customerId') customerId: string,
    @Body() body: { tag: string }
  ) {
    return this.inboxService.addCustomerTag(req.tenantId, customerId, body.tag);
  }

  @Delete('customers/:customerId/tags/:tag')
  async removeCustomerTag(
    @Req() req: any,
    @Param('customerId') customerId: string,
    @Param('tag') tag: string
  ) {
    return this.inboxService.removeCustomerTag(req.tenantId, customerId, tag);
  }

  @Post('conversations/:conversationId/quick-order')
  async createQuickOrder(
    @Req() req: any,
    @Param('conversationId') conversationId: string,
    @Body()
    body: {
      productId: string;
      productName: string;
      variantSize?: string;
      variantColor?: string;
      quantity: number;
      unitPrice: number;
      customerName: string;
      customerPhone: string;
      customerAddress: string;
      deliveryArea: 'INSIDE_DHAKA' | 'OUTSIDE_DHAKA';
      deliveryCost: number;
      notes?: string;
    }
  ) {
    return this.inboxService.createQuickOrder({
      tenantId: req.tenantId,
      conversationId,
      memberId: req.memberId,
      input: body,
    });
  }

  @Post('conversations/:conversationId/simulate-customer')
  async simulateCustomer(
    @Req() req: any,
    @Param('conversationId') conversationId: string,
    @Body()
    body: {
      content: string;
      contentType?: 'TEXT' | 'IMAGE' | 'AUDIO';
      mediaUrl?: string;
    }
  ) {
    return this.inboxService.simulateCustomerMessage({
      tenantId: req.tenantId,
      conversationId,
      content: body.content,
      contentType: body.contentType,
      mediaUrl: body.mediaUrl,
    });
  }

  @Post('conversations/:conversationId/ai-reply')
  async triggerAiReply(
    @Req() req: any,
    @Param('conversationId') conversationId: string,
    @Body()
    body: {
      userQuery?: string;
      imageUrl?: string;
      generateVoiceReply?: boolean;
    }
  ) {
    return this.inboxService.triggerAiReply({
      tenantId: req.tenantId,
      conversationId,
      userQuery: body.userQuery,
      imageUrl: body.imageUrl,
      generateVoiceReply: body.generateVoiceReply,
    });
  }
}
