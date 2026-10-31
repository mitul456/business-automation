import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { InboxGateway } from './inbox.gateway';
import { EncryptionService, MetaGraphClient, WhatsAppCloudClient } from '@omniflow/integrations';
import {
  ConversationStatus,
  SenderType,
  MessageContentType,
  SendMessageInput,
  Priority,
  ChannelType,
} from '@omniflow/shared';

@Injectable()
export class InboxService {
  private readonly logger = new Logger(InboxService.name);
  private readonly metaClient = new MetaGraphClient();
  private readonly waClient = new WhatsAppCloudClient();

  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: InboxGateway
  ) {}

  async listConversations(params: {
    tenantId: string;
    channelId?: string;
    status?: ConversationStatus;
    assignedMemberId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { tenantId, channelId, status, assignedMemberId, search, page = 1, limit = 25 } = params;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };
    if (channelId) where.channelId = channelId;
    if (status) where.status = status;
    if (assignedMemberId) where.assignedMemberId = assignedMemberId;

    if (search) {
      where.OR = [
        { customer: { name: { contains: search } } },
        { customer: { phone: { contains: search } } },
        { lastMessagePreview: { contains: search } },
      ];
    }

    const [conversations, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where,
        include: {
          customer: true,
          channel: {
            select: { id: true, name: true, type: true },
          },
          assignedMember: {
            include: {
              user: { select: { id: true, name: true, avatarUrl: true } },
            },
          },
        },
        orderBy: { lastMessageAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.conversation.count({ where }),
    ]);

    return {
      conversations,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getConversation(tenantId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, tenantId },
      include: {
        customer: {
          include: {
            orders: {
              orderBy: { createdAt: 'desc' },
              take: 5,
            },
          },
        },
        channel: true,
        assignedMember: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
      },
    });

    if (!conversation) throw new NotFoundException('Conversation not found');

    // Mark as read
    if (conversation.unreadCount > 0) {
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: { unreadCount: 0 },
      });
    }

    return conversation;
  }

  async getMessages(tenantId: string, conversationId: string, limit = 50) {
    return this.prisma.message.findMany({
      where: { tenantId, conversationId },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
  }

  async sendMessage(params: {
    tenantId: string;
    memberId?: string;
    input: SendMessageInput;
  }) {
    const { tenantId, memberId, input } = params;

    const conversation = await this.prisma.conversation.findFirst({
      where: { id: input.conversationId, tenantId },
      include: { channel: true, customer: true },
    });

    if (!conversation) throw new NotFoundException('Conversation not found');

    // 1. Create message in database
    const message = await this.prisma.message.create({
      data: {
        tenantId,
        conversationId: input.conversationId,
        senderType: SenderType.AGENT,
        senderId: memberId,
        content: input.content,
        contentType: input.contentType as MessageContentType,
        mediaUrl: input.mediaUrl,
        aiGenerated: false,
      },
    });

    // 2. Update conversation preview
    await this.prisma.conversation.update({
      where: { id: input.conversationId },
      data: {
        lastMessagePreview: input.content,
        lastMessageAt: new Date(),
      },
    });

    // 3. Emit real-time WebSocket event
    this.gateway.emitNewMessage({
      conversationId: input.conversationId,
      tenantId,
      message: {
        id: message.id,
        senderType: message.senderType as any,
        senderId: message.senderId,
        content: message.content,
        contentType: message.contentType as any,
        mediaUrl: message.mediaUrl,
        createdAt: message.createdAt.toISOString(),
        aiGenerated: false,
      },
    });

    // 4. Dispatch to external channel (Meta/WhatsApp) if credentials exist
    try {
      const channel = conversation.channel;
      const rawToken = EncryptionService.decrypt(channel.accessTokenEncrypted || '');

      if (channel.type === ChannelType.FACEBOOK_PAGE && rawToken && conversation.customer.notes?.includes('Meta PSID:')) {
        const psidMatch = conversation.customer.notes.match(/Meta PSID:\s*([^\s]+)/);
        if (psidMatch && psidMatch[1]) {
          await this.metaClient.sendTextMessage(rawToken, psidMatch[1], input.content);
        }
      } else if (channel.type === ChannelType.WHATSAPP_BUSINESS && rawToken && conversation.customer.phone) {
        const config = channel.config as any;
        if (config?.phoneNumberId) {
          await this.waClient.sendTextMessage(config.phoneNumberId, rawToken, conversation.customer.phone, input.content);
        }
      }
    } catch (err: any) {
      this.logger.warn(`Could not dispatch external message: ${err.message}`);
    }

    return message;
  }

  /**
   * Human Handover Protocol: Take over from AI
   */
  async takeOver(tenantId: string, conversationId: string, memberId: string) {
    const updated = await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        status: ConversationStatus.HUMAN_HANDOVER,
        assignedMemberId: memberId,
        aiAssisted: false,
      },
      include: { assignedMember: { include: { user: true } } },
    });

    // System message
    await this.prisma.message.create({
      data: {
        tenantId,
        conversationId,
        senderType: SenderType.SYSTEM,
        content: 'Human agent took over this conversation. AI response is paused.',
        contentType: MessageContentType.TEXT,
      },
    });

    this.gateway.emitConversationUpdate({
      conversationId,
      tenantId,
      status: ConversationStatus.HUMAN_HANDOVER,
      unreadCount: updated.unreadCount,
      lastMessageAt: updated.lastMessageAt.toISOString(),
      assignedMemberId: memberId,
    });

    return updated;
  }

  /**
   * Return conversation back to AI Assistant
   */
  async returnToAi(tenantId: string, conversationId: string) {
    const updated = await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        status: ConversationStatus.BOT_ACTIVE,
        aiAssisted: true,
      },
    });

    // System message
    await this.prisma.message.create({
      data: {
        tenantId,
        conversationId,
        senderType: SenderType.SYSTEM,
        content: 'AI Assistant reactivated for this conversation.',
        contentType: MessageContentType.TEXT,
      },
    });

    this.gateway.emitConversationUpdate({
      conversationId,
      tenantId,
      status: ConversationStatus.BOT_ACTIVE,
      unreadCount: updated.unreadCount,
      lastMessageAt: updated.lastMessageAt.toISOString(),
      assignedMemberId: updated.assignedMemberId,
    });

    return updated;
  }
}
