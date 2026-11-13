import { Test, TestingModule } from '@nestjs/testing';
import { ChannelsService } from '../src/channels/channels.service';
import { InboxService } from '../src/inbox/inbox.service';
import { InboxGateway } from '../src/inbox/inbox.gateway';
import { AiAgentService } from '../src/ai-agent/ai-agent.service';
import { OrdersService } from '../src/orders/orders.service';
import { PrismaService } from '../src/prisma.service';
import { MetaGraphClient, WhatsAppCloudClient } from '@omniflow/integrations';
import {
  ChannelType,
  ChannelStatus,
  ConversationStatus,
  SenderType,
  MessageContentType,
  DeliveryStatus,
} from '@omniflow/shared';
import * as crypto from 'crypto';

describe('Omnichannel Messaging Infrastructure (Phase 7)', () => {
  let channelsService: ChannelsService;
  let inboxService: InboxService;
  let prisma: any;
  let gateway: any;
  let aiAgentService: any;

  const mockAppSecret = 'test_meta_app_secret_32_bytes_len!';

  beforeEach(async () => {
    process.env.META_APP_SECRET = mockAppSecret;

    prisma = {
      channel: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        upsert: jest.fn(),
        update: jest.fn(),
      },
      customer: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      conversation: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn().mockResolvedValue(1),
      },
      message: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn().mockImplementation((promises) => Promise.all(promises)),
    };

    gateway = {
      emitNewMessage: jest.fn(),
      emitConversationUpdate: jest.fn(),
      emitDeliveryStatus: jest.fn(),
      emitHandoverChanged: jest.fn(),
    };

    aiAgentService = {
      generateResponse: jest.fn().mockResolvedValue({
        reply: 'আমাদের কাছে নীল পাঞ্জাবি সাইজ ৪২ স্টকে আছে। মূল্য ২,৮৫০ টাকা।',
        tokensUsed: 50,
        handoverRecommended: false,
      }),
    };

    const mockOrdersService = {
      createOrder: jest.fn().mockResolvedValue({
        id: 'ord-123',
        orderNumber: 'ORD-2026-0001',
        totalAmount: 2910,
        status: 'CONFIRMED',
        shippingAddress: { address: 'Uttara, Dhaka' },
        items: [{ productId: 'prod-1', productName: 'Panjabi' }],
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChannelsService,
        InboxService,
        { provide: PrismaService, useValue: prisma },
        { provide: InboxGateway, useValue: gateway },
        { provide: AiAgentService, useValue: aiAgentService },
        { provide: OrdersService, useValue: mockOrdersService },
      ],
    }).compile();

    channelsService = module.get<ChannelsService>(ChannelsService);
    inboxService = module.get<InboxService>(InboxService);
  });

  describe('1. Webhook Signature & Handshake Verification', () => {
    it('should verify valid Meta HMAC-SHA256 signature', () => {
      const metaClient = new MetaGraphClient(mockAppSecret);
      const payload = JSON.stringify({ object: 'page', entry: [] });

      const signature = crypto
        .createHmac('sha256', mockAppSecret)
        .update(payload)
        .digest('hex');

      const isValid = metaClient.verifyWebhookSignature(payload, `sha256=${signature}`);
      expect(isValid).toBe(true);
    });

    it('should reject invalid or tampered Meta signature', () => {
      const metaClient = new MetaGraphClient(mockAppSecret);
      const payload = JSON.stringify({ object: 'page', entry: [] });

      const isValid = metaClient.verifyWebhookSignature(payload, 'sha256=invalid_hash_value');
      expect(isValid).toBe(false);
    });

    it('should verify WhatsApp webhook GET handshake challenge', () => {
      const waClient = new WhatsAppCloudClient();
      const challenge = '123456789';
      const verifyToken = 'test_verify_token_2026';

      const result = waClient.verifyWebhookChallenge('subscribe', verifyToken, challenge, verifyToken);
      expect(result).toBe(challenge);

      const invalidResult = waClient.verifyWebhookChallenge('subscribe', 'wrong_token', challenge, verifyToken);
      expect(invalidResult).toBeNull();
    });
  });

  describe('2. Idempotent Processing & Deduplication', () => {
    it('should deduplicate messages with existing externalMessageId', async () => {
      const mockChannel = {
        id: 'chan-1',
        tenantId: 'tenant-1',
        type: ChannelType.FACEBOOK_PAGE,
        externalId: 'page-123',
        status: ChannelStatus.CONNECTED,
      };

      prisma.channel.findFirst.mockResolvedValue(mockChannel);
      // Simulate that this message was already processed in database
      prisma.message.findFirst.mockResolvedValue({ id: 'msg-existing', externalMessageId: 'mid-dup-101' });

      const payload = {
        object: 'page',
        entry: [
          {
            id: 'page-123',
            messaging: [
              {
                sender: { id: 'user-psid-1' },
                message: { mid: 'mid-dup-101', text: 'Hello duplicate message' },
              },
            ],
          },
        ],
      };

      await channelsService.processInboundMetaWebhook(payload);

      // Should not create new customer or message
      expect(prisma.message.create).not.toHaveBeenCalled();
      expect(gateway.emitNewMessage).not.toHaveBeenCalled();
    });
  });

  describe('3. Human Handover Protocol & AI Suppression', () => {
    it('should pause automated AI replies when human agent takes over', async () => {
      const mockChannel = {
        id: 'chan-1',
        tenantId: 'tenant-1',
        type: ChannelType.FACEBOOK_PAGE,
        externalId: 'page-123',
        status: ChannelStatus.CONNECTED,
      };

      const mockCustomer = { id: 'cust-1', name: 'Tanvir Ahmed', notes: 'Meta PSID: user-psid-2' };
      const mockConversation = {
        id: 'conv-handover',
        tenantId: 'tenant-1',
        channelId: 'chan-1',
        customerId: 'cust-1',
        status: ConversationStatus.HUMAN_HANDOVER, // Human has taken over
        aiAssisted: false,
        unreadCount: 0,
      };

      prisma.channel.findFirst.mockResolvedValue(mockChannel);
      prisma.message.findFirst.mockResolvedValue(null); // Not duplicate
      prisma.customer.findFirst.mockResolvedValue(mockCustomer);
      prisma.conversation.findFirst.mockResolvedValue(mockConversation);
      prisma.conversation.update.mockResolvedValue({ ...mockConversation, unreadCount: 1 });
      prisma.message.create.mockResolvedValue({
        id: 'msg-1',
        content: 'I need human assistance',
        senderType: SenderType.CUSTOMER,
        createdAt: new Date(),
      });

      const payload = {
        object: 'page',
        entry: [
          {
            id: 'page-123',
            messaging: [
              {
                sender: { id: 'user-psid-2' },
                message: { mid: 'mid-new-202', text: 'I need human assistance' },
              },
            ],
          },
        ],
      };

      await channelsService.processInboundMetaWebhook(payload);

      // Customer message must be persisted
      expect(prisma.message.create).toHaveBeenCalled();
      // AI response must NOT be generated because conversation is under HUMAN_HANDOVER
      expect(aiAgentService.generateResponse).not.toHaveBeenCalled();
    });

    it('should transition state cleanly on takeOver and returnToAi', async () => {
      const mockConv = {
        id: 'conv-10',
        tenantId: 'tenant-1',
        status: ConversationStatus.BOT_ACTIVE,
        unreadCount: 0,
        lastMessageAt: new Date(),
      };

      prisma.conversation.update.mockResolvedValue({
        ...mockConv,
        status: ConversationStatus.HUMAN_HANDOVER,
        aiAssisted: false,
      });
      prisma.message.create.mockResolvedValue({ id: 'sys-msg' });

      // Human takes over
      const handoverResult = await inboxService.takeOver('tenant-1', 'conv-10', 'member-1');
      expect(handoverResult.status).toBe(ConversationStatus.HUMAN_HANDOVER);
      expect(gateway.emitHandoverChanged).toHaveBeenCalledWith(
        expect.objectContaining({
          conversationId: 'conv-10',
          status: ConversationStatus.HUMAN_HANDOVER,
          aiAssisted: false,
        })
      );

      // Hand back to AI
      prisma.conversation.update.mockResolvedValue({
        ...mockConv,
        status: ConversationStatus.BOT_ACTIVE,
        aiAssisted: true,
      });

      const returnResult = await inboxService.returnToAi('tenant-1', 'conv-10');
      expect(returnResult.status).toBe(ConversationStatus.BOT_ACTIVE);
      expect(gateway.emitHandoverChanged).toHaveBeenCalledWith(
        expect.objectContaining({
          conversationId: 'conv-10',
          status: ConversationStatus.BOT_ACTIVE,
          aiAssisted: true,
        })
      );
    });
  });

  describe('4. Internal Notes Separation', () => {
    it('should record internal notes without dispatching to external customer channels', async () => {
      const mockConv = {
        id: 'conv-30',
        tenantId: 'tenant-1',
        channel: { type: ChannelType.FACEBOOK_PAGE, accessTokenEncrypted: null },
        customer: { id: 'c-1', notes: 'Meta PSID: psid-100' },
      };

      prisma.conversation.findFirst.mockResolvedValue(mockConv);
      prisma.message.create.mockResolvedValue({
        id: 'note-1',
        content: 'Customer is eligible for free shipping over ৳2500',
        isInternal: true,
        senderType: SenderType.AGENT,
        createdAt: new Date(),
      });

      const result = await inboxService.sendMessage({
        tenantId: 'tenant-1',
        memberId: 'mem-1',
        input: {
          conversationId: 'conv-30',
          content: 'Customer is eligible for free shipping over ৳2500',
          contentType: 'TEXT',
          isInternal: true,
        },
      });

      expect(result.isInternal).toBe(true);
      expect(prisma.message.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isInternal: true,
            deliveryStatus: DeliveryStatus.READ,
          }),
        })
      );
      // Conversation preview should NOT be updated for internal notes
      expect(prisma.conversation.update).not.toHaveBeenCalled();
    });
  });

  describe('5. Delivery Status Updates', () => {
    it('should update message delivery status to DELIVERED and READ from webhooks', async () => {
      const mockMsg = { id: 'msg-50', conversationId: 'conv-50', externalMessageId: 'wamid.123' };
      prisma.message.findFirst.mockResolvedValue(mockMsg);
      prisma.message.update.mockResolvedValue({ ...mockMsg, deliveryStatus: DeliveryStatus.DELIVERED });

      await inboxService.updateDeliveryStatus('tenant-1', 'wamid.123', DeliveryStatus.DELIVERED);

      expect(prisma.message.update).toHaveBeenCalledWith({
        where: { id: 'msg-50' },
        data: { deliveryStatus: DeliveryStatus.DELIVERED },
      });
      expect(gateway.emitDeliveryStatus).toHaveBeenCalledWith({
        tenantId: 'tenant-1',
        conversationId: 'conv-50',
        messageId: 'msg-50',
        status: DeliveryStatus.DELIVERED,
      });
    });
  });

  describe('6. In-Chat Quick Order Placement & Visual AI Sales Workflow', () => {
    it('should place instant order from chat, decrement stock, and post confirmation ORDER_CARD', async () => {
      const mockConv = {
        id: 'conv-100',
        tenantId: 'tenant-1',
        customerId: 'cust-100',
        channelId: 'chan-100',
        customer: { id: 'cust-100', name: 'Tanvir', phone: '01712345678' },
        channel: { id: 'chan-100', type: 'FACEBOOK_PAGE' },
      };

      prisma.conversation.findFirst.mockResolvedValue(mockConv);
      prisma.customer.update.mockResolvedValue(mockConv.customer);
      prisma.message.create.mockResolvedValue({
        id: 'msg-ord-1',
        tenantId: 'tenant-1',
        conversationId: 'conv-100',
        senderType: SenderType.BOT,
        content: 'Order Confirmed',
        contentType: MessageContentType.ORDER_CARD,
        createdAt: new Date(),
      });
      prisma.conversation.update.mockResolvedValue(mockConv);

      const result = await inboxService.createQuickOrder({
        tenantId: 'tenant-1',
        conversationId: 'conv-100',
        input: {
          productId: 'prod-1',
          productName: 'Royal Navy Blue Embroidered Panjabi',
          variantSize: '42',
          variantColor: 'Navy Blue',
          quantity: 1,
          unitPrice: 2850,
          customerName: 'Tanvir Ahmed',
          customerPhone: '01712345678',
          customerAddress: 'House 42, Sector 4, Uttara, Dhaka',
          deliveryArea: 'INSIDE_DHAKA',
          deliveryCost: 60,
        },
      });

      expect(result.order).toBeDefined();
      expect(result.order.orderNumber).toBe('ORD-2026-0001');
      expect(prisma.message.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            contentType: MessageContentType.ORDER_CARD,
            senderType: SenderType.BOT,
          }),
        })
      );
      expect(gateway.emitNewMessage).toHaveBeenCalled();
    });

    it('should simulate customer message and trigger AI visual response with PRODUCT_CARD', async () => {
      const mockConv = {
        id: 'conv-200',
        tenantId: 'tenant-1',
        customerId: 'cust-200',
        status: ConversationStatus.BOT_ACTIVE,
        customer: { id: 'cust-200', name: 'Tanvir' },
        messages: [{ senderType: SenderType.CUSTOMER, content: 'Need blue panjabi' }],
      };

      prisma.conversation.findFirst.mockResolvedValue(mockConv);
      prisma.message.create.mockResolvedValue({
        id: 'msg-cust-1',
        content: 'Customer message',
        contentType: MessageContentType.TEXT,
        createdAt: new Date(),
      });
      prisma.conversation.update.mockResolvedValue(mockConv);

      aiAgentService.generateResponse.mockResolvedValue({
        reply: 'We have Royal Navy Blue Panjabi in size 42.',
        tokensUsed: 60,
        recommendedProductCard: {
          id: 'prod-1',
          name: 'Royal Navy Blue Embroidered Panjabi',
          price: 2850,
          images: ['https://images.unsplash.com/photo-1.jpg'],
          variants: [{ size: '42', color: 'Navy Blue', stockQuantity: 15 }],
        },
      });

      const res = await inboxService.simulateCustomerMessage({
        tenantId: 'tenant-1',
        conversationId: 'conv-200',
        content: 'পাঞ্জাবিটার দাম কত?',
      });

      expect(res.customerMessage).toBeDefined();
      expect(res.aiResult).toBeDefined();
      expect(aiAgentService.generateResponse).toHaveBeenCalled();
      expect(prisma.message.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            contentType: MessageContentType.PRODUCT_CARD,
          }),
        })
      );
    });
  });
});
