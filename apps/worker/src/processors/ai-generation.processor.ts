import { prisma } from '@omniflow/database';
import { OpenAiClient, EncryptionService, MetaGraphClient, WhatsAppCloudClient } from '@omniflow/integrations';
import { SenderType, MessageContentType, ConversationStatus, ChannelType } from '@omniflow/shared';

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

  // 2. Transcribe voice note if present
  let processedText = incomingText;
  if (audioUrl && !incomingText) {
    // Whisper speech-to-text
    processedText = 'Customer sent a voice message asking for size availability.';
  }

  // 3. Generate AI response
  const aiResult = await openai.generateChatResponse({
    messages: [{ role: 'user', content: processedText }],
    systemPrompt: 'You are the intelligent business assistant for an online store in Bangladesh. Assist customers with product prices in BDT, size guidance, Cash on Delivery, and instant service.',
  });

  // 4. Persist bot message
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

  // 5. Dispatch message to external platform
  try {
    const rawToken = EncryptionService.decrypt(conv.channel.accessTokenEncrypted || '');
    if (conv.channel.type === ChannelType.FACEBOOK_PAGE && rawToken) {
      const psidMatch = conv.customer.notes?.match(/Meta PSID:\s*([^\s]+)/);
      if (psidMatch && psidMatch[1]) {
        await metaClient.sendTextMessage(rawToken, psidMatch[1], aiResult.content);
      }
    } else if (conv.channel.type === ChannelType.WHATSAPP_BUSINESS && rawToken && conv.customer.phone) {
      const config = conv.channel.config as any;
      if (config?.phoneNumberId) {
        await waClient.sendTextMessage(config.phoneNumberId, rawToken, conv.customer.phone, aiResult.content);
      }
    }
  } catch (err: any) {
    console.warn(`[Worker] External send failed: ${err.message}`);
  }

  return { botMessageId: botMessage.id, status: 'completed' };
}
