import { prisma } from '@omniflow/database';
import { OpenAiClient, EncryptionService, MetaGraphClient, WhatsAppCloudClient } from '@omniflow/integrations';
import { SenderType, MessageContentType, ConversationStatus, ChannelType, ProductStatus } from '@omniflow/shared';

export async function processAiMessageJob(jobData: {
  tenantId: string;
  conversationId: string;
  incomingText: string;
  imageUrl?: string;
  audioUrl?: string;
}) {
  const { tenantId, conversationId, incomingText, imageUrl, audioUrl } = jobData;

  const openai = new OpenAiClient();
  const metaClient = new MetaGraphClient();
  const waClient = new WhatsAppCloudClient();

  // 1. Check conversation & handover status
  const conv = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { channel: true, customer: true },
  });

  if (!conv || conv.status === ConversationStatus.HUMAN_HANDOVER) {
    return { status: 'skipped_due_to_handover' };
  }

  // 2. Fetch tenant AI configuration
  const config = await prisma.aiAgentConfig.findUnique({
    where: { tenantId },
  });

  const keywords = (config?.handoverKeywords as string[]) || ['human', 'agent', 'support', 'প্রতিনিধি', 'কথা বলতে চাই'];
  const userTextLower = (incomingText || '').toLowerCase();
  const isHandoverRequested = keywords.some((kw) => userTextLower.includes(kw.toLowerCase()));

  if (isHandoverRequested) {
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { status: ConversationStatus.HUMAN_HANDOVER },
    });

    const fallback = config?.fallbackMessageBn || 'আপনাকে আমাদের কাস্টমার প্রতিনিধির সাথে সংযুক্ত করছি। একটু অপেক্ষা করুন।';
    await prisma.message.create({
      data: {
        tenantId,
        conversationId,
        senderType: SenderType.BOT,
        content: fallback,
        contentType: MessageContentType.TEXT,
        aiGenerated: true,
      },
    });

    return { status: 'escalated_to_human' };
  }

  // 3. Transcribe voice note if present
  let processedText = incomingText;
  if (audioUrl && !incomingText) {
    processedText = 'Customer sent a voice message asking for product details and availability.';
  }

  // 4. Vision analysis if image attached
  let visionContext = '';
  if (imageUrl) {
    try {
      const vision = await openai.analyzeProductImage(imageUrl);
      visionContext = `\n[Customer sent an image: ${vision.description}. Keywords: ${vision.suggestedSearchKeywords.join(', ')}]`;
    } catch {
      visionContext = '\n[Customer sent a product image for visual search]';
    }
  }

  // 5. Retrieve active store products for catalog context
  const products = await prisma.product.findMany({
    where: { tenantId, status: ProductStatus.ACTIVE },
    select: { name: true, sku: true, price: true, stockQuantity: true },
    take: 6,
  });

  const catalogContext = products.length > 0
    ? '\n[AVAILABLE PRODUCTS (DO NOT FABRICATE PRICES)]:\n' +
      products.map((p) => `- ${p.name} (SKU: ${p.sku}) | Price: ৳${p.price} | Stock: ${p.stockQuantity}`).join('\n')
    : '';

  // 6. Retrieve relevant knowledge chunks
  const knowledgeChunks = await prisma.knowledgeChunk.findMany({
    where: { tenantId },
    take: 3,
  });

  const ragContext = knowledgeChunks.length > 0
    ? '\n[STORE KNOWLEDGE BASE]:\n' + knowledgeChunks.map((c) => c.content).join('\n---\n')
    : '';

  // 7. System prompt & response generation
  const systemPrompt = `${config?.systemPrompt || 'You are an intelligent business assistant in Bangladesh.'}
Tone: ${config?.tone || 'FRIENDLY'}.
${catalogContext}
${ragContext}
${visionContext}
Respond politely in customer's language (Bengali or English). Cash on Delivery and bKash available across Bangladesh.`;

  const aiResult = await openai.generateChatResponse({
    messages: [{ role: 'user', content: processedText }],
    systemPrompt,
    temperature: config?.temperature ?? 0.7,
  });

  // 8. Persist bot message
  const botMessage = await prisma.message.create({
    data: {
      tenantId,
      conversationId,
      senderType: SenderType.BOT,
      content: aiResult.content,
      contentType: MessageContentType.TEXT,
      aiGenerated: true,
      tokensUsed: aiResult.tokensUsed,
    },
  });

  // 9. Dispatch message to external platform
  try {
    const rawToken = EncryptionService.decrypt(conv.channel.accessTokenEncrypted || '');
    if (conv.channel.type === ChannelType.FACEBOOK_PAGE && rawToken) {
      const psidMatch = conv.customer.notes?.match(/Meta PSID:\s*([^\s]+)/);
      if (psidMatch && psidMatch[1]) {
        await metaClient.sendTextMessage(rawToken, psidMatch[1], aiResult.content);
      }
    } else if (conv.channel.type === ChannelType.WHATSAPP_BUSINESS && rawToken && conv.customer.phone) {
      const waConfig = conv.channel.config as any;
      if (waConfig?.phoneNumberId) {
        await waClient.sendTextMessage(waConfig.phoneNumberId, rawToken, conv.customer.phone, aiResult.content);
      }
    }
  } catch (err: any) {
    console.warn(`[Worker] External send failed: ${err.message}`);
  }

  return { botMessageId: botMessage.id, status: 'completed' };
}
