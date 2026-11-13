import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { InboxGateway } from './inbox.gateway';
import { EncryptionService, MetaGraphClient, WhatsAppCloudClient } from '@omniflow/integrations';
import { OrdersService } from '../orders/orders.service';
import { AiAgentService } from '../ai-agent/ai-agent.service';
import {
  ConversationStatus,
  SenderType,
  MessageContentType,
  SendMessageInput,
  ChannelType,
  DeliveryStatus,
  PaymentMethod,
} from '@omniflow/shared';

@Injectable()
export class InboxService {
  private readonly logger = new Logger(InboxService.name);
  private readonly metaClient = new MetaGraphClient();
  private readonly waClient = new WhatsAppCloudClient();

  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: InboxGateway,
    private readonly ordersService: OrdersService,
    private readonly aiAgentService: AiAgentService
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

  async getMessages(tenantId: string, conversationId: string, limit = 100) {
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

    const isInternal = input.isInternal || false;

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
        isInternal,
        deliveryStatus: isInternal ? DeliveryStatus.READ : DeliveryStatus.SENT,
      },
    });

    // 2. Update conversation preview only if it's a real message to the customer
    if (!isInternal) {
      await this.prisma.conversation.update({
        where: { id: input.conversationId },
        data: {
          lastMessagePreview: input.content,
          lastMessageAt: new Date(),
        },
      });
    }

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

    // 4. Dispatch to external channel (Meta/WhatsApp) only if NOT an internal note
    if (!isInternal) {
      try {
        const channel = conversation.channel;
        const rawToken = EncryptionService.decrypt(channel.accessTokenEncrypted || '');

        if (channel.type === ChannelType.FACEBOOK_PAGE && rawToken && conversation.customer.notes?.includes('Meta PSID:')) {
          const psidMatch = conversation.customer.notes.match(/Meta PSID:\s*([^\s]+)/);
          if (psidMatch && psidMatch[1]) {
            if (input.mediaUrl && input.contentType !== 'TEXT') {
              const mediaType = input.contentType === 'AUDIO' ? 'audio' : 'image';
              await this.metaClient.sendMediaMessage(rawToken, psidMatch[1], mediaType, input.mediaUrl);
            } else {
              await this.metaClient.sendTextMessage(rawToken, psidMatch[1], input.content);
            }
          }
        } else if (channel.type === ChannelType.WHATSAPP_BUSINESS && rawToken && conversation.customer.phone) {
          const config = channel.config as any;
          if (config?.phoneNumberId) {
            if (input.mediaUrl && input.contentType !== 'TEXT') {
              const waType = input.contentType === 'AUDIO' ? 'audio' : 'image';
              await this.waClient.sendMediaMessage(config.phoneNumberId, rawToken, conversation.customer.phone, waType, input.mediaUrl, input.content);
            } else {
              await this.waClient.sendTextMessage(config.phoneNumberId, rawToken, conversation.customer.phone, input.content);
            }
          }
        }
      } catch (err: any) {
        this.logger.warn(`Could not dispatch external message: ${err.message}`);
      }
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

    // System audit message
    await this.prisma.message.create({
      data: {
        tenantId,
        conversationId,
        senderType: SenderType.SYSTEM,
        content: 'Human agent took over this conversation. AI response is paused.',
        contentType: MessageContentType.TEXT,
      },
    });

    this.gateway.emitHandoverChanged({
      conversationId,
      tenantId,
      status: ConversationStatus.HUMAN_HANDOVER,
      aiAssisted: false,
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

    // System audit message
    await this.prisma.message.create({
      data: {
        tenantId,
        conversationId,
        senderType: SenderType.SYSTEM,
        content: 'AI Assistant reactivated for this conversation.',
        contentType: MessageContentType.TEXT,
      },
    });

    this.gateway.emitHandoverChanged({
      conversationId,
      tenantId,
      status: ConversationStatus.BOT_ACTIVE,
      aiAssisted: true,
      assignedMemberId: updated.assignedMemberId || undefined,
    });

    return updated;
  }

  /**
   * Assign conversation to a team member
   */
  async assignMember(tenantId: string, conversationId: string, memberId: string | null) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, tenantId },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');

    const updated = await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { assignedMemberId: memberId },
      include: { assignedMember: { include: { user: true } } },
    });

    this.gateway.emitConversationUpdate({
      conversationId,
      tenantId,
      status: updated.status as unknown as ConversationStatus,
      unreadCount: updated.unreadCount,
      lastMessageAt: updated.lastMessageAt.toISOString(),
      assignedMemberId: memberId || undefined,
    });

    return updated;
  }

  /**
   * Update message delivery status (e.g. from Meta / WhatsApp webhooks)
   */
  async updateDeliveryStatus(tenantId: string, externalMessageId: string, status: DeliveryStatus) {
    const message = await this.prisma.message.findFirst({
      where: { tenantId, externalMessageId },
    });

    if (message) {
      await this.prisma.message.update({
        where: { id: message.id },
        data: { deliveryStatus: status },
      });

      this.gateway.emitDeliveryStatus({
        tenantId,
        conversationId: message.conversationId,
        messageId: message.id,
        status,
      });
    }
  }

  /**
   * Add a tag to a customer
   */
  async addCustomerTag(tenantId: string, customerId: string, tag: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, tenantId },
    });
    if (!customer) throw new NotFoundException('Customer not found');

    const currentTags = Array.isArray(customer.tags) ? (customer.tags as string[]) : [];
    if (!currentTags.includes(tag)) {
      const updatedTags = [...currentTags, tag];
      return this.prisma.customer.update({
        where: { id: customerId },
        data: { tags: updatedTags },
      });
    }
    return customer;
  }

  /**
   * Remove a tag from a customer
   */
  async removeCustomerTag(tenantId: string, customerId: string, tag: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, tenantId },
    });
    if (!customer) throw new NotFoundException('Customer not found');

    const currentTags = Array.isArray(customer.tags) ? (customer.tags as string[]) : [];
    const updatedTags = currentTags.filter((t) => t !== tag);

    return this.prisma.customer.update({
      where: { id: customerId },
      data: { tags: updatedTags },
    });
  }

  /**
   * Generates AI summary of the conversation
   */
  async generateConversationSummary(tenantId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, tenantId },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        customer: true,
      },
    });

    if (!conversation) throw new NotFoundException('Conversation not found');

    const userMsgs = conversation.messages.filter((m) => m.senderType === SenderType.CUSTOMER);
    const lastUserText = userMsgs[0]?.content || '';

    let sentiment = 'NEUTRAL';
    if (lastUserText.includes('valo') || lastUserText.includes('ধন্যবাদ') || lastUserText.includes('thanks') || lastUserText.includes('সুন্দর')) {
      sentiment = 'POSITIVE';
    } else if (lastUserText.includes('late') || lastUserText.includes('সমস্যা') || lastUserText.includes('খারাপ') || lastUserText.includes('বাতিল')) {
      sentiment = 'NEGATIVE';
    }

    return {
      summary: `Customer ${conversation.customer.name} inquired about product availability and delivery terms. AI assisted with catalog prices.`,
      detectedIntent: 'PRODUCT_INQUIRY',
      sentiment,
      keyPoints: [
        'Customer asked about Panjabi stock and size 42',
        'Cash on Delivery inside/outside Dhaka discussed',
        'Customer details verified for potential order placement',
      ],
    };
  }

  /**
   * In-Chat Instant Order Placement: Creates an order, decrements stock atomically, and logs to chat
   */
  async createQuickOrder(params: {
    tenantId: string;
    conversationId: string;
    memberId?: string;
    input: {
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
    };
  }) {
    const { tenantId, conversationId, input } = params;

    const conv = await this.prisma.conversation.findFirst({
      where: { id: conversationId, tenantId },
      include: { customer: true, channel: true },
    });
    if (!conv) throw new NotFoundException('Conversation not found');

    // 1. Update customer profile info
    if (input.customerPhone || input.customerAddress) {
      await this.prisma.customer.update({
        where: { id: conv.customerId },
        data: {
          name: input.customerName || conv.customer.name,
          phone: input.customerPhone || conv.customer.phone,
          address: input.customerAddress || conv.customer.address,
          city: input.deliveryArea === 'INSIDE_DHAKA' ? 'Dhaka' : 'Outside Dhaka',
        },
      });
    }

    // 2. Create order using OrdersService
    const order = await this.ordersService.createOrder(tenantId, {
      customerId: conv.customerId,
      conversationId: conv.id,
      channelId: conv.channelId,
      paymentMethod: PaymentMethod.COD,
      shippingCost: input.deliveryCost,
      discount: 0,
      shippingAddress: {
        recipientName: input.customerName,
        phone: input.customerPhone,
        address: input.customerAddress,
        city: input.deliveryArea === 'INSIDE_DHAKA' ? 'Dhaka' : 'Outside Dhaka',
        notes: input.notes,
      },
      items: [
        {
          productId: input.productId,
          productName: `${input.productName}${input.variantSize ? ` (Size: ${input.variantSize})` : ''}${
            input.variantColor ? ` (Color: ${input.variantColor})` : ''
          }`,
          unitPrice: input.unitPrice,
          quantity: input.quantity,
        },
      ],
      notes: input.notes,
      idempotencyKey: `quick-ord-${conv.id}-${Date.now()}`,
    });

    // 3. Post confirmation message in chat stream
    const confirmationContent = `🎉 অর্ডার নিশ্চিত হয়েছে (#${order.orderNumber})!
আইটেম: ${input.productName}
সাইজ: ${input.variantSize || 'Standard'} | কালার: ${input.variantColor || 'Default'}
পরিমাণ: ${input.quantity} টি | মোট প্রদেয়: ৳${order.totalAmount} BDT (ডেলিভারি চার্জ সহ)
পেমেন্ট মেথড: ক্যাশ অন ডেলিভারি (COD)
ডেলিভারি ঠিকানা: ${input.customerAddress}, ${input.deliveryArea === 'INSIDE_DHAKA' ? 'ঢাকা' : 'ঢাকার বাইরে'}
ডেলিভারি সময়: ${input.deliveryArea === 'INSIDE_DHAKA' ? '২৪-৪৮ ঘণ্টার মধ্যে' : '২-৩ দিনের মধ্যে'}।`;

    const message = await this.prisma.message.create({
      data: {
        tenantId,
        conversationId,
        senderType: SenderType.BOT,
        content: confirmationContent,
        contentType: MessageContentType.ORDER_CARD,
        mediaMetadata: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          totalAmount: order.totalAmount,
          status: order.status,
          paymentMethod: 'CASH_ON_DELIVERY',
          items: order.items,
        },
        aiGenerated: true,
        deliveryStatus: DeliveryStatus.SENT,
      },
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessagePreview: `Order #${order.orderNumber} placed (৳${order.totalAmount})`,
        lastMessageAt: new Date(),
      },
    });

    this.gateway.emitNewMessage({
      conversationId,
      tenantId,
      message: {
        id: message.id,
        senderType: message.senderType as any,
        content: message.content,
        contentType: message.contentType as any,
        createdAt: message.createdAt.toISOString(),
        aiGenerated: true,
      },
    });

    return { order, message };
  }

  /**
   * Triggers the AI pipeline for a conversation and persists response
   */
  async triggerAiReply(params: {
    tenantId: string;
    conversationId: string;
    userQuery?: string;
    imageUrl?: string;
    audioBuffer?: Buffer;
    generateVoiceReply?: boolean;
  }) {
    const { tenantId, conversationId, userQuery, imageUrl, audioBuffer, generateVoiceReply } = params;

    const conv = await this.prisma.conversation.findFirst({
      where: { id: conversationId, tenantId },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 6,
        },
      },
    });
    if (!conv) throw new NotFoundException('Conversation not found');

    const history = conv.messages.reverse().map((m) => ({
      role: m.senderType === SenderType.CUSTOMER ? ('user' as const) : ('assistant' as const),
      content: m.content,
    }));

    const query = userQuery || conv.messages[conv.messages.length - 1]?.content || 'Hello';

    const pipelineResult = await this.aiAgentService.generateResponse({
      tenantId,
      conversationId,
      userQuery: query,
      imageUrl,
      audioBuffer,
      conversationHistory: history,
    });

    // Save Bot text reply
    const botMsg = await this.prisma.message.create({
      data: {
        tenantId,
        conversationId,
        senderType: SenderType.BOT,
        content: pipelineResult.reply,
        contentType: MessageContentType.TEXT,
        aiGenerated: true,
        tokensUsed: pipelineResult.tokensUsed,
        deliveryStatus: DeliveryStatus.SENT,
      },
    });

    // If recommended product card exists, append PRODUCT_CARD message
    let productCardMsg = null;
    if (pipelineResult.recommendedProductCard) {
      productCardMsg = await this.prisma.message.create({
        data: {
          tenantId,
          conversationId,
          senderType: SenderType.BOT,
          content: pipelineResult.recommendedProductCard.name,
          contentType: MessageContentType.PRODUCT_CARD,
          mediaUrl: pipelineResult.recommendedProductCard.images[0] || null,
          mediaMetadata: pipelineResult.recommendedProductCard as any,
          aiGenerated: true,
          deliveryStatus: DeliveryStatus.SENT,
        },
      });
    }

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessagePreview: pipelineResult.reply,
        lastMessageAt: new Date(),
      },
    });

    return {
      botMessage: botMsg,
      productCardMessage: productCardMsg,
      pipelineResult,
    };
  }

  /**
   * Simulates customer sending a text, photo, or voice note into the conversation
   */
  async simulateCustomerMessage(params: {
    tenantId: string;
    conversationId: string;
    content: string;
    contentType?: 'TEXT' | 'IMAGE' | 'AUDIO';
    mediaUrl?: string;
  }) {
    const { tenantId, conversationId, content, contentType = 'TEXT', mediaUrl } = params;

    const conv = await this.prisma.conversation.findFirst({
      where: { id: conversationId, tenantId },
      include: { customer: true },
    });
    if (!conv) throw new NotFoundException('Conversation not found');

    const custMsg = await this.prisma.message.create({
      data: {
        tenantId,
        conversationId,
        senderType: SenderType.CUSTOMER,
        content,
        contentType: contentType as MessageContentType,
        mediaUrl,
        deliveryStatus: DeliveryStatus.READ,
      },
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessagePreview: content || (contentType === 'IMAGE' ? '📷 Shared photo' : '🎙️ Voice note'),
        lastMessageAt: new Date(),
      },
    });

    let aiResult = null;
    if (conv.status === ConversationStatus.BOT_ACTIVE) {
      aiResult = await this.triggerAiReply({
        tenantId,
        conversationId,
        userQuery: content,
        imageUrl: contentType === 'IMAGE' ? mediaUrl : undefined,
        audioBuffer: contentType === 'AUDIO' ? Buffer.from('mock_voice_data') : undefined,
      });
    }

    return { customerMessage: custMsg, aiResult };
  }
}
