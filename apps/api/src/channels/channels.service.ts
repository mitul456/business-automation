import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { InboxGateway } from '../inbox/inbox.gateway';
import { AiAgentService } from '../ai-agent/ai-agent.service';
import { EncryptionService, MetaGraphClient, WhatsAppCloudClient } from '@omniflow/integrations';
import {
  ChannelType,
  ChannelStatus,
  ConnectChannelInput,
  SenderType,
  MessageContentType,
  ConversationStatus,
  DeliveryStatus,
} from '@omniflow/shared';

@Injectable()
export class ChannelsService {
  private readonly logger = new Logger(ChannelsService.name);
  private readonly metaClient = new MetaGraphClient();
  private readonly waClient = new WhatsAppCloudClient();

  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: InboxGateway,
    private readonly aiAgentService: AiAgentService
  ) {}

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

    const channel = await this.prisma.channel.upsert({
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

    // If Meta / Facebook Page, subscribe webhook
    if (channel.type === ChannelType.FACEBOOK_PAGE) {
      try {
        await this.metaClient.subscribeAppToPage(input.accessToken, input.externalId);
      } catch (err: any) {
        this.logger.warn(`Could not subscribe page to webhook app: ${err.message}`);
      }
    }

    return channel;
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
   * Generates Meta OAuth Login URL
   */
  getMetaOAuthUrl(clientId?: string, redirectUri?: string, state?: string): string {
    const appId = clientId || process.env.META_APP_ID || '1234567890';
    const callback = redirectUri || `${process.env.APP_URL || 'http://localhost:3000'}/api/auth/meta/callback`;
    return this.metaClient.getOAuthUrl(appId, callback, state);
  }

  /**
   * Exchange code for Meta accounts (Pages & Instagram)
   */
  async exchangeMetaOAuthCode(code: string, redirectUri?: string) {
    const clientId = process.env.META_APP_ID || '';
    const clientSecret = process.env.META_APP_SECRET || '';
    const callback = redirectUri || `${process.env.APP_URL || 'http://localhost:3000'}/api/auth/meta/callback`;

    if (!clientId || !clientSecret) {
      // Sandbox development fallback accounts
      return [
        {
          id: 'page_apex_lifestyle',
          name: 'Apex Lifestyle Bangladesh',
          category: 'Retail & Fashion',
          type: ChannelType.FACEBOOK_PAGE,
          accessToken: 'mock_meta_token_page_123',
          instagram: { id: 'ig_apex_lifestyle', username: 'apex_lifestyle_bd' },
        },
      ];
    }

    const tokenRes = await this.metaClient.exchangeCodeForToken(clientId, clientSecret, callback, code);
    const longLived = await this.metaClient.getLongLivedUserToken(clientId, clientSecret, tokenRes.access_token);
    const accounts = await this.metaClient.getAccounts(longLived.access_token);

    return accounts.map((acc) => ({
      id: acc.id,
      name: acc.name,
      category: acc.category,
      type: ChannelType.FACEBOOK_PAGE,
      accessToken: acc.access_token,
      instagram: acc.instagram_business_account,
    }));
  }

  /**
   * Process incoming Meta webhook message event (Facebook Messenger & Instagram Direct)
   */
  async processInboundMetaWebhook(payload: any) {
    try {
      if (payload.object === 'page' || payload.object === 'instagram') {
        for (const entry of payload.entry || []) {
          const pageId = entry.id;
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
            // 1. Delivery or Read status updates
            if (messaging.delivery) {
              const mids = messaging.delivery.mids || [];
              for (const mid of mids) {
                await this.updateMessageDelivery(channel.tenantId, mid, DeliveryStatus.DELIVERED);
              }
              continue;
            }

            if (messaging.read) {
              const watermark = messaging.read.watermark;
              if (watermark) {
                this.logger.debug(`Messages read watermark: ${watermark}`);
              }
              continue;
            }

            // 2. Incoming customer message
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

  /**
   * Process incoming WhatsApp Business Cloud API webhook event
   */
  async processInboundWhatsAppWebhook(payload: any) {
    try {
      if (payload.object === 'whatsapp_business_account') {
        for (const entry of payload.entry || []) {
          for (const change of entry.changes || []) {
            if (change.field === 'messages') {
              const val = change.value;
              const phoneNumberId = val.metadata?.phone_number_id;

              const channel = await this.prisma.channel.findFirst({
                where: {
                  type: ChannelType.WHATSAPP_BUSINESS,
                  status: ChannelStatus.CONNECTED,
                  externalId: phoneNumberId,
                },
                include: { tenant: true },
              });

              if (!channel) {
                this.logger.warn(`No connected WhatsApp channel found for Phone Number ID: ${phoneNumberId}`);
                continue;
              }

              // 1. Process delivery statuses (sent, delivered, read, failed)
              for (const statusObj of val.statuses || []) {
                const wamid = statusObj.id;
                let status = DeliveryStatus.SENT;
                if (statusObj.status === 'delivered') status = DeliveryStatus.DELIVERED;
                else if (statusObj.status === 'read') status = DeliveryStatus.READ;
                else if (statusObj.status === 'failed') status = DeliveryStatus.FAILED;

                await this.updateMessageDelivery(channel.tenantId, wamid, status);
              }

              // 2. Process incoming messages
              for (const msg of val.messages || []) {
                const contact = (val.contacts || []).find((c: any) => c.wa_id === msg.from);
                const senderName = contact?.profile?.name || `Customer ${msg.from.slice(-4)}`;

                let text = '';
                let mediaUrl: string | undefined = undefined;
                let contentType = MessageContentType.TEXT;

                if (msg.type === 'text') {
                  text = msg.text?.body || '';
                } else if (msg.type === 'image') {
                  contentType = MessageContentType.IMAGE;
                  mediaUrl = msg.image?.link || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600';
                  text = msg.image?.caption || '';
                } else if (msg.type === 'audio' || msg.type === 'voice') {
                  contentType = MessageContentType.AUDIO;
                  mediaUrl = msg.audio?.link || msg.voice?.link;
                  text = '';
                } else if (msg.type === 'interactive') {
                  text = msg.interactive?.button_reply?.title || msg.interactive?.list_reply?.title || '';
                }

                await this.handleIncomingMessage({
                  channel,
                  senderPsid: msg.from,
                  customerPhone: `+${msg.from}`,
                  customerName: senderName,
                  messageText: text,
                  externalMsgId: msg.id,
                  contentType,
                  mediaUrl,
                });
              }
            }
          }
        }
      }
    } catch (err: any) {
      this.logger.error(`Error processing WhatsApp webhook: ${err.message}`, err.stack);
    }
  }

  private async updateMessageDelivery(tenantId: string, externalId: string, status: DeliveryStatus) {
    const msg = await this.prisma.message.findFirst({
      where: { tenantId, externalMessageId: externalId },
    });
    if (msg) {
      await this.prisma.message.update({
        where: { id: msg.id },
        data: { deliveryStatus: status },
      });

      this.gateway.emitDeliveryStatus({
        tenantId,
        conversationId: msg.conversationId,
        messageId: msg.id,
        status,
      });
    }
  }

  private async handleIncomingMessage(params: {
    channel: any;
    senderPsid: string;
    customerPhone?: string;
    customerName?: string;
    messageText?: string;
    attachments?: any[];
    externalMsgId?: string;
    contentType?: MessageContentType;
    mediaUrl?: string;
  }) {
    const {
      channel,
      senderPsid,
      customerPhone,
      customerName,
      messageText = '',
      attachments,
      externalMsgId,
    } = params;

    // 1. Fast Idempotency & Deduplication Check
    if (externalMsgId) {
      const existing = await this.prisma.message.findFirst({
        where: { tenantId: channel.tenantId, externalMessageId: externalMsgId },
      });
      if (existing) {
        this.logger.log(`[Deduplication] Message ${externalMsgId} already processed. Skipping.`);
        return;
      }
    }

    // 2. Find or create Customer
    let customer = await this.prisma.customer.findFirst({
      where: {
        tenantId: channel.tenantId,
        OR: [
          { notes: { contains: senderPsid } },
          ...(customerPhone ? [{ phone: customerPhone }] : []),
        ],
      },
    });

    if (!customer) {
      let resolvedName = customerName;
      let avatarUrl: string | undefined = undefined;

      if (!resolvedName && channel.type === ChannelType.FACEBOOK_PAGE) {
        const rawToken = EncryptionService.decrypt(channel.accessTokenEncrypted || '');
        const profile = await this.metaClient.getUserProfile(rawToken, senderPsid);
        resolvedName = profile.name || `${profile.first_name || 'Customer'} ${profile.last_name || ''}`.trim();
        avatarUrl = profile.profile_pic;
      }

      customer = await this.prisma.customer.create({
        data: {
          tenantId: channel.tenantId,
          name: resolvedName || `Customer ${senderPsid.slice(-4)}`,
          phone: customerPhone,
          avatarUrl,
          notes: `Meta PSID: ${senderPsid}`,
          tags: ['social-inquiry'],
        },
      });
    }

    // 3. Find or create Conversation
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

    // 4. Resolve Content Type & Media URL
    let contentType = params.contentType || MessageContentType.TEXT;
    let mediaUrl: string | undefined = params.mediaUrl;

    if (attachments && attachments.length > 0) {
      const firstAtt = attachments[0];
      mediaUrl = firstAtt.payload?.url;
      if (firstAtt.type === 'image') contentType = MessageContentType.IMAGE;
      else if (firstAtt.type === 'audio') contentType = MessageContentType.AUDIO;
      else if (firstAtt.type === 'video') contentType = MessageContentType.VIDEO;
      else contentType = MessageContentType.FILE;
    }

    // 5. Persist Customer Message
    const message = await this.prisma.message.create({
      data: {
        tenantId: channel.tenantId,
        conversationId: conversation.id,
        senderType: SenderType.CUSTOMER,
        content: messageText || (contentType === MessageContentType.AUDIO ? 'Voice Message' : 'Media Attachment'),
        contentType,
        mediaUrl,
        externalMessageId: externalMsgId,
        deliveryStatus: DeliveryStatus.DELIVERED,
      },
    });

    // 6. Broadcast via WebSocket in real-time
    this.gateway.emitNewMessage({
      conversationId: conversation.id,
      tenantId: channel.tenantId,
      message: {
        id: message.id,
        senderType: message.senderType as any,
        content: message.content,
        contentType: message.contentType as any,
        mediaUrl: message.mediaUrl,
        createdAt: message.createdAt.toISOString(),
        aiGenerated: false,
      },
    });

    this.gateway.emitConversationUpdate({
      conversationId: conversation.id,
      tenantId: channel.tenantId,
      status: conversation.status as unknown as ConversationStatus,
      unreadCount: conversation.unreadCount,
      lastMessageAt: (conversation.lastMessageAt || new Date()).toISOString(),
      assignedMemberId: conversation.assignedMemberId || undefined,
    });

    // 7. Check if AI should respond: only if BOT_ACTIVE and not HUMAN_HANDOVER
    if (conversation.status === ConversationStatus.BOT_ACTIVE && conversation.aiAssisted) {
      try {
        const aiResponse = await this.aiAgentService.generateResponse({
          tenantId: channel.tenantId,
          userQuery: messageText,
          imageUrl: contentType === MessageContentType.IMAGE ? mediaUrl : undefined,
          conversationId: conversation.id,
        });

        if (aiResponse.handoverRecommended) {
          // Pause AI & escalate to human
          await this.prisma.conversation.update({
            where: { id: conversation.id },
            data: { status: ConversationStatus.HUMAN_HANDOVER, aiAssisted: false },
          });

          this.gateway.emitHandoverChanged({
            conversationId: conversation.id,
            tenantId: channel.tenantId,
            status: ConversationStatus.HUMAN_HANDOVER,
            aiAssisted: false,
          });
        }

        // Save bot message
        const botMsg = await this.prisma.message.create({
          data: {
            tenantId: channel.tenantId,
            conversationId: conversation.id,
            senderType: SenderType.BOT,
            content: aiResponse.reply,
            contentType: MessageContentType.TEXT,
            aiGenerated: true,
            tokensUsed: aiResponse.tokensUsed,
            deliveryStatus: DeliveryStatus.SENT,
          },
        });

        // Broadcast Bot message
        this.gateway.emitNewMessage({
          conversationId: conversation.id,
          tenantId: channel.tenantId,
          message: {
            id: botMsg.id,
            senderType: botMsg.senderType as any,
            content: botMsg.content,
            contentType: botMsg.contentType as any,
            createdAt: botMsg.createdAt.toISOString(),
            aiGenerated: true,
          },
        });

        // Dispatch to external channel
        const rawToken = EncryptionService.decrypt(channel.accessTokenEncrypted || '');
        if (channel.type === ChannelType.FACEBOOK_PAGE && rawToken) {
          await this.metaClient.sendTextMessage(rawToken, senderPsid, aiResponse.reply);
        } else if (channel.type === ChannelType.WHATSAPP_BUSINESS && rawToken && customer.phone) {
          const config = channel.config as any;
          if (config?.phoneNumberId) {
            await this.waClient.sendTextMessage(config.phoneNumberId, rawToken, customer.phone, aiResponse.reply);
          }
        }
      } catch (err: any) {
        this.logger.error(`Failed to generate autonomous AI reply: ${err.message}`);
      }
    } else {
      this.logger.log(`[Handover Protected] Conversation ${conversation.id} is in HUMAN_HANDOVER mode. Automated AI reply skipped.`);
    }

    return { customer, conversation, message };
  }
}
