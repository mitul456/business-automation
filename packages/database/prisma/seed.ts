import { PrismaClient, UserStatus, WorkspaceRole, TenantStatus, PlanTier, ChannelType, ConversationStatus, Priority, SenderType, MessageContentType, LeadStage, ProductStatus, OrderStatus, PaymentStatus, PaymentMethod, CourierProvider, PaymentProvider, AiTone, AiLanguage } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting OmniFlow database seeding...');

  // 1. Super Admin User
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@omniflow.ai' },
    update: {},
    create: {
      email: 'admin@omniflow.ai',
      // In production bcrypt hashed. Here standard test hash for: "Admin123!"
      passwordHash: '$2b$10$wT8Kz5hX5E8uG9g8g5hZ0uYhLzN7UaJbN1uKlMnOpQrStUvWxYz.2',
      name: 'OmniFlow Super Admin',
      isSuperAdmin: true,
      emailVerified: true,
      status: UserStatus.ACTIVE,
    },
  });

  // 2. Demo Tenant: Apex Lifestyle & Tech
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'apex-store' },
    update: {},
    create: {
      name: 'Apex Lifestyle & Tech',
      slug: 'apex-store',
      currency: 'BDT',
      timezone: 'Asia/Dhaka',
      defaultLanguage: 'bn',
      creditBalance: 2500,
      status: TenantStatus.ACTIVE,
    },
  });

  // 3. Tenant Subscription (PRO Plan)
  await prisma.tenantSubscription.create({
    data: {
      tenantId: tenant.id,
      planTier: PlanTier.PRO,
      status: TenantStatus.ACTIVE,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  // 4. Workspace Owner & Agent Users
  const owner = await prisma.user.upsert({
    where: { email: 'mitul@apexstore.com' },
    update: {},
    create: {
      email: 'mitul@apexstore.com',
      passwordHash: '$2b$10$wT8Kz5hX5E8uG9g8g5hZ0uYhLzN7UaJbN1uKlMnOpQrStUvWxYz.2',
      name: 'Mitul Chowdhury (Store Owner)',
      phone: '+8801711000001',
      status: UserStatus.ACTIVE,
    },
  });

  const agent = await prisma.user.upsert({
    where: { email: 'rahim@apexstore.com' },
    update: {},
    create: {
      email: 'rahim@apexstore.com',
      passwordHash: '$2b$10$wT8Kz5hX5E8uG9g8g5hZ0uYhLzN7UaJbN1uKlMnOpQrStUvWxYz.2',
      name: 'Rahim Khan (Support Specialist)',
      phone: '+8801811000002',
      status: UserStatus.ACTIVE,
    },
  });

  await prisma.workspaceMember.upsert({
    where: { tenantId_userId: { tenantId: tenant.id, userId: owner.id } },
    update: {},
    create: {
      tenantId: tenant.id,
      userId: owner.id,
      role: WorkspaceRole.OWNER,
    },
  });

  const agentMember = await prisma.workspaceMember.upsert({
    where: { tenantId_userId: { tenantId: tenant.id, userId: agent.id } },
    update: {},
    create: {
      tenantId: tenant.id,
      userId: agent.id,
      role: WorkspaceRole.AGENT,
    },
  });

  // 5. Omnichannel Channels
  const fbChannel = await prisma.channel.upsert({
    where: { tenantId_type_externalId: { tenantId: tenant.id, type: ChannelType.FACEBOOK_PAGE, externalId: 'fb_page_1029384756' } },
    update: {},
    create: {
      tenantId: tenant.id,
      type: ChannelType.FACEBOOK_PAGE,
      name: 'Apex Lifestyle Official Page',
      externalId: 'fb_page_1029384756',
      accessTokenEncrypted: 'enc_demo_token_page_123',
      config: { pageName: 'Apex Lifestyle BD', fansCount: 15400 },
    },
  });

  const waChannel = await prisma.channel.upsert({
    where: { tenantId_type_externalId: { tenantId: tenant.id, type: ChannelType.WHATSAPP_BUSINESS, externalId: '+8801900123456' } },
    update: {},
    create: {
      tenantId: tenant.id,
      type: ChannelType.WHATSAPP_BUSINESS,
      name: 'Apex WhatsApp Support Line',
      externalId: '+8801900123456',
      accessTokenEncrypted: 'enc_demo_token_wa_123',
      config: { phoneNumberId: '1092837465', displayPhone: '+880 1900 123456' },
    },
  });

  // 6. AI Agent Configuration
  await prisma.aiAgentConfig.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: {
      tenantId: tenant.id,
      personaName: 'Apex Assistant',
      systemPrompt: 'You are the intelligent sales & support assistant for Apex Lifestyle & Tech in Bangladesh. Assist customers with product recommendations, prices in BDT, size guidance, Cash on Delivery details (60 BDT inside Dhaka, 120 BDT outside Dhaka), order confirmations, and instant customer service in both Bengali and English.',
      tone: AiTone.FRIENDLY,
      language: AiLanguage.AUTO,
      temperature: 0.7,
      confidenceThreshold: 0.8,
      capabilities: {
        autoOrderCreation: true,
        productSearch: true,
        imageRecognition: true,
        voiceTranscription: true,
        bookingAppointment: true,
        sentimentAnalysis: true,
      },
      handoverKeywords: ['human', 'agent', 'support', 'প্রতিনিধি', 'কথা বলতে চাই', 'মানুষ চাই'],
      fallbackMessageEn: 'I will connect you with our support specialist right away. Please hold on!',
      fallbackMessageBn: 'আমি আমাদের একজন কাস্টমার প্রতিনিধিকে আপনার সাথে যুক্ত করে দিচ্ছি। অনুগ্রহ করে একটু অপেক্ষা করুন!',
    },
  });

  // 7. Product Catalog & Categories
  const categoryClothing = await prisma.category.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: 'premium-panjabi' } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Premium Panjabi',
      slug: 'premium-panjabi',
      description: 'Handcrafted Egyptian Cotton and Semi-pure Silk Panjabis',
    },
  });

  const categoryGadgets = await prisma.category.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: 'smart-gadgets' } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Smart Gadgets & Watches',
      slug: 'smart-gadgets',
      description: 'Smart wearables, Bluetooth audio, and accessories',
    },
  });

  const p1 = await prisma.product.upsert({
    where: { tenantId_sku: { tenantId: tenant.id, sku: 'PJ-ROYAL-NAVY-M' } },
    update: {},
    create: {
      tenantId: tenant.id,
      categoryId: categoryClothing.id,
      name: 'Royal Navy Blue Embroidered Panjabi',
      sku: 'PJ-ROYAL-NAVY-M',
      description: 'Exclusive 100% combed cotton festive Panjabi with subtle mandarin collar embroidery.',
      price: 2850.00,
      compareAtPrice: 3500.00,
      costPrice: 1600.00,
      stockQuantity: 45,
      images: ['https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?w=600&auto=format&fit=crop'],
      visualTags: ['panjabi', 'navy blue', 'embroidery', 'traditional', 'eid'],
      status: ProductStatus.ACTIVE,
    },
  });

  const p2 = await prisma.product.upsert({
    where: { tenantId_sku: { tenantId: tenant.id, sku: 'WT-AMOLED-ULTRA' } },
    update: {},
    create: {
      tenantId: tenant.id,
      categoryId: categoryGadgets.id,
      name: 'Apex Ultra Smart Watch (AMOLED Bluetooth Calling)',
      sku: 'WT-AMOLED-ULTRA',
      description: '2.01-inch HD AMOLED Always-on display, health monitoring, IP68 water resistance.',
      price: 3450.00,
      compareAtPrice: 4200.00,
      costPrice: 2100.00,
      stockQuantity: 80,
      images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop'],
      visualTags: ['smartwatch', 'amoled', 'black', 'bluetooth', 'gadget'],
      status: ProductStatus.ACTIVE,
    },
  });

  // 8. Sample Customers
  const customer1 = await prisma.customer.create({
    data: {
      tenantId: tenant.id,
      name: 'Tanvir Ahmed',
      phone: '+8801712345678',
      email: 'tanvir.ahmed@example.com',
      city: 'Dhaka',
      district: 'Dhaka',
      address: 'House 42, Road 11, Sector 4, Uttara, Dhaka',
      leadStage: LeadStage.QUALIFIED,
      tags: ['vip', 'eid-shopper'],
      totalOrders: 1,
      totalSpent: 2910.00,
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      tenantId: tenant.id,
      name: 'Nusrat Jahan',
      phone: '+8801812345678',
      city: 'Chittagong',
      district: 'Chittagong',
      address: 'GEC Circle, Nasirabad, Chittagong',
      leadStage: LeadStage.CONTACTED,
      tags: ['new-lead'],
      totalOrders: 0,
      totalSpent: 0.00,
    },
  });

  // 9. Conversations & Messages (Demonstrating Omnichannel + AI + Handover)
  const conv1 = await prisma.conversation.create({
    data: {
      tenantId: tenant.id,
      channelId: fbChannel.id,
      customerId: customer1.id,
      assignedMemberId: agentMember.id,
      status: ConversationStatus.OPEN,
      priority: Priority.HIGH,
      lastMessagePreview: 'আপনাদের নীল পাঞ্জাবিটার সাইজ ৪২ কি স্টকে আছে?',
      unreadCount: 0,
      aiAssisted: true,
    },
  });

  await prisma.message.createMany({
    data: [
      {
        tenantId: tenant.id,
        conversationId: conv1.id,
        senderType: SenderType.CUSTOMER,
        content: 'আসসালামু আলাইকুম, আপনাদের নীল পাঞ্জাবিটার সাইজ ৪২ কি স্টকে আছে?',
        contentType: MessageContentType.TEXT,
        createdAt: new Date(Date.now() - 15 * 60 * 1000),
      },
      {
        tenantId: tenant.id,
        conversationId: conv1.id,
        senderType: SenderType.BOT,
        content: 'ওয়ালাইকুম আসসালাম! জি, আমাদের "Royal Navy Blue Embroidered Panjabi" সাইজ ৪২ স্টকে অ্যাভেইলেবল আছে। মূল্য ২,৮৫০ টাকা। আপনি কি এখনই অর্ডার কনফার্ম করতে চান? ক্যাশ অন ডেলিভারিতে হোম ডেলিভারি নিতে আপনার ঠিকানা ও ফোন নম্বর প্রদান করুন।',
        contentType: MessageContentType.TEXT,
        aiGenerated: true,
        tokensUsed: 85,
        createdAt: new Date(Date.now() - 14 * 60 * 1000),
      },
      {
        tenantId: tenant.id,
        conversationId: conv1.id,
        senderType: SenderType.CUSTOMER,
        content: 'হ্যাঁ, আমি ১ পিস নিবো। নাম: তানভীর আহমেদ, উত্তরা সেক্টর ৪, ঢাকা। ফোন: ০১৭১২৩৪৫৬৭৮।',
        contentType: MessageContentType.TEXT,
        createdAt: new Date(Date.now() - 10 * 60 * 1000),
      },
    ],
  });

  // 10. Sample Order
  const order1 = await prisma.order.create({
    data: {
      tenantId: tenant.id,
      orderNumber: 'APX-2026-001',
      customerId: customer1.id,
      conversationId: conv1.id,
      channelId: fbChannel.id,
      status: OrderStatus.CONFIRMED,
      subtotal: 2850.00,
      shippingCost: 60.00,
      totalAmount: 2910.00,
      currency: 'BDT',
      paymentStatus: PaymentStatus.UNPAID,
      paymentMethod: PaymentMethod.COD,
      shippingAddress: {
        recipientName: 'Tanvir Ahmed',
        phone: '+8801712345678',
        address: 'House 42, Road 11, Sector 4, Uttara',
        city: 'Dhaka',
        district: 'Dhaka',
      },
      courierName: 'Steadfast Courier',
      courierTrackingId: 'ST-98765432',
      items: {
        create: [
          {
            productId: p1.id,
            productName: p1.name,
            unitPrice: 2850.00,
            quantity: 1,
            totalPrice: 2850.00,
          },
        ],
      },
    },
  });

  // 11. Courier Setting (Steadfast)
  await prisma.courierSetting.create({
    data: {
      tenantId: tenant.id,
      provider: CourierProvider.STEADFAST,
      apiKeyEncrypted: 'demo_steadfast_key_xyz',
      secretKeyEncrypted: 'demo_steadfast_secret_xyz',
      isActive: true,
      isDefault: true,
    },
  });

  // 12. Payment Integration (bKash & Stripe Sandbox)
  await prisma.paymentIntegration.create({
    data: {
      tenantId: tenant.id,
      provider: PaymentProvider.BKASH,
      merchantId: '01700000000',
      apiKeyEncrypted: 'demo_bkash_key',
      secretKeyEncrypted: 'demo_bkash_secret',
      isSandbox: true,
      isActive: true,
    },
  });

  console.log('✅ OmniFlow database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
