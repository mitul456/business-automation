import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { EncryptionService, MetaGraphClient } from '@omniflow/integrations';
import {
  ChannelType,
  ChannelStatus,
  ConnectChannelInput,
  SenderType,
  MessageContentType,
  ConversationStatus,
} from '@omniflow/shared';

@Injectable()
export class ChannelsService {
  private readonly logger = new Logger(ChannelsService.name);
  private readonly metaClient = new MetaGraphClient();

  constructor(private readonly prisma: PrismaService) {}

  async listChannels(tenantId: string) {
    return this.prisma.channel.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: { conversations: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async connectChannel(tenantId: string, input: ConnectChannelInput) {
    const encryptedToken = EncryptionService.encrypt(input.accessToken);

    return this.prisma.channel.upsert({
      where: {
        tenantId_type_externalId: {
          tenantId,
          type: input.type,
          externalId: input.externalId,
        },
      },
      update: {
        name: input.name,
        accessTokenEncrypted: encryptedToken,
        status: ChannelStatus.CONNECTED,
        config: input.config || {},
        lastSyncedAt: new Date(),
      },
      create: {
        tenantId,
        type: input.type,
        name: input.name,
        externalId: input.externalId,
        accessTokenEncrypted: encryptedToken,
        status: ChannelStatus.CONNECTED,
        config: input.config || {},
      },
    });
  }

  async disconnectChannel(tenantId: string, channelId: string) {
    const channel = await this.prisma.channel.findFirst({
      where: { id: channelId, tenantId },
    });
    if (!channel) throw new NotFoundException('Channel not found');

    return this.prisma.channel.update({
      where: { id: channelId },
      data: { status: ChannelStatus.DISCONNECTED },
    });
  }

  /**
   * Process incoming Meta webhook message event (Facebook Messenger / Instagram / WhatsApp)
   */
  async processInboundMetaWebhook(payload: any) {
    try {
      if (payload.object === 'page') {
        for (const entry of payload.entry || []) {
          const pageId = entry.id;
          // Find matching channel in database
          const channel = await this.prisma.channel.findFirst({
            where: {
              externalId: pageId,
              status: ChannelStatus.CONNECTED,
            },
            include: { tenant: true },
          });

          if (!channel) {
            this.logger.warn(`No connected channel found for Page ID: ${pageId}`);
            continue;
          }

          for (const messaging of entry.messaging || []) {
            if (messaging.message && !messaging.message.is_echo) {
              await this.handleIncomingMessage({
                channel,
                senderPsid: messaging.sender.id,
                messageText: messaging.message.text,
                attachments: messaging.message.attachments,
                externalMsgId: messaging.message.mid,
              });
            }
          }
        }
      }
    } catch (err: any) {
      this.logger.error(`Error processing Meta webhook: ${err.message}`, err.stack);
    }
  }

  private async handleIncomingMessage(params: {
    channel: any;
    senderPsid: string;
    messageText?: string;
    attachments?: any[];
    externalMsgId?: string;
  }) {
    const { channel, senderPsid, messageText, attachments, externalMsgId } = params;

    // 1. Find or create Customer
    let customer = await this.prisma.customer.findFirst({
      where: {
        tenantId: channel.tenantId,
        notes: { contains: senderPsid },
      },
    });

    if (!customer) {
      // Try to get profile from Meta
      const rawToken = EncryptionService.decrypt(channel.accessTokenEncrypted || '');
      const profile = await this.metaClient.getUserProfile(rawToken, senderPsid);

      customer = await this.prisma.customer.create({
        data: {
          tenantId: channel.tenantId,
          name: profile.name || `${profile.first_name || 'Customer'} ${profile.last_name || ''}`.trim() || `User ${senderPsid.slice(-4)}`,
          avatarUrl: profile.profile_pic,
          notes: `Meta PSID: ${senderPsid}`,
          tags: ['social-lead'],
        },
      });
    }

    // 2. Find or create Conversation
    let conversation = await this.prisma.conversation.findFirst({
      where: {
        tenantId: channel.tenantId,
        channelId: channel.id,
        customerId: customer.id,
      },
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          tenantId: channel.tenantId,
          channelId: channel.id,
          customerId: customer.id,
          status: ConversationStatus.BOT_ACTIVE,
          unreadCount: 1,
          lastMessagePreview: messageText || 'Media Attachment',
        },
      });
    } else {
      conversation = await this.prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          unreadCount: { increment: 1 },
          lastMessagePreview: messageText || 'Media Attachment',
          lastMessageAt: new Date(),
        },
      });
    }

    // 3. Determine content type & media URL
    let contentType = MessageContentType.TEXT;
    let mediaUrl: string | undefined = undefined;

    if (attachments && attachments.length > 0) {
      const firstAtt = attachments[0];
      mediaUrl = firstAtt.payload?.url;
      if (firstAtt.type === 'image') contentType = MessageContentType.IMAGE;
      else if (firstAtt.type === 'audio') contentType = MessageContentType.AUDIO;
      else if (firstAtt.type === 'video') contentType = MessageContentType.VIDEO;
      else contentType = MessageContentType.FILE;
    }

    // 4. Save Customer Message
    const message = await this.prisma.message.create({
      data: {
        tenantId: channel.tenantId,
        conversationId: conversation.id,
        senderType: SenderType.CUSTOMER,
        content: messageText || (contentType === MessageContentType.AUDIO ? 'Voice Message' : 'Shared photo'),
        contentType,
        mediaUrl,
        externalMessageId: externalMsgId,
      },
    });

    return { customer, conversation, message };
  }
}
