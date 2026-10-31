import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { KnowledgeService } from '../knowledge/knowledge.service';
import { OpenAiClient } from '@omniflow/integrations';
import {
  AiAgentConfigInput,
  CreditTransactionType,
  AiTone,
  AiLanguage,
  ProductStatus,
} from '@omniflow/shared';

@Injectable()
export class AiAgentService {
  private readonly logger = new Logger(AiAgentService.name);
  private readonly openai = new OpenAiClient();

  constructor(
    private readonly prisma: PrismaService,
    private readonly knowledgeService: KnowledgeService
  ) {}

  async getConfig(tenantId: string) {
    let config = await this.prisma.aiAgentConfig.findUnique({
      where: { tenantId },
    });

    if (!config) {
      config = await this.prisma.aiAgentConfig.create({
        data: {
          tenantId,
          personaName: 'OmniAssistant',
          systemPrompt: 'You are an intelligent business assistant. You assist customers with product recommendations, order placement, and support in Bengali and English.',
          tone: AiTone.FRIENDLY,
          language: AiLanguage.AUTO,
          capabilities: {
            autoOrderCreation: true,
            productSearch: true,
            imageRecognition: true,
            voiceTranscription: true,
            bookingAppointment: true,
            sentimentAnalysis: true,
          },
          handoverKeywords: ['human', 'agent', 'support', 'প্রতিনিধি', 'কথা বলতে চাই'],
          fallbackMessageEn: 'Connecting you to our team specialist.',
          fallbackMessageBn: 'আপনাকে আমাদের কাস্টমার প্রতিনিধির সাথে সংযুক্ত করছি।',
        },
      });
    }

    return config;
  }

  async updateConfig(tenantId: string, input: AiAgentConfigInput) {
    return this.prisma.aiAgentConfig.upsert({
      where: { tenantId },
      update: {
        personaName: input.personaName,
        systemPrompt: input.systemPrompt,
        tone: input.tone,
        language: input.language,
        temperature: input.temperature,
        confidenceThreshold: input.confidenceThreshold,
        capabilities: input.capabilities as any,
        handoverKeywords: input.handoverKeywords as any,
        fallbackMessageEn: input.fallbackMessageEn,
        fallbackMessageBn: input.fallbackMessageBn,
        businessHoursOnly: input.businessHoursOnly,
        businessHoursJson: input.businessHoursJson as any,
      },
      create: {
        tenantId,
        personaName: input.personaName,
        systemPrompt: input.systemPrompt,
        tone: input.tone,
        language: input.language,
        temperature: input.temperature,
        confidenceThreshold: input.confidenceThreshold,
        capabilities: input.capabilities as any,
        handoverKeywords: input.handoverKeywords as any,
        fallbackMessageEn: input.fallbackMessageEn,
        fallbackMessageBn: input.fallbackMessageBn,
        businessHoursOnly: input.businessHoursOnly,
        businessHoursJson: input.businessHoursJson as any,
      },
    });
  }

  /**
   * Generates AI response with full RAG context and credit deduction
   */
  async generateResponse(params: {
    tenantId: string;
    userQuery: string;
    imageUrl?: string;
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  }) {
    const { tenantId, userQuery, imageUrl, conversationHistory = [] } = params;

    // 1. Check Tenant Credit Balance
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant || tenant.creditBalance <= 0) {
      return {
        reply: 'Our AI assistant is temporarily unavailable. A human agent will assist you shortly.',
        creditsDeducted: 0,
        handoverRecommended: true,
      };
    }

    const config = await this.getConfig(tenantId);
    const keywords = (config.handoverKeywords as string[]) || [];

    // 2. Check Human Handover Keywords
    const queryLower = userQuery.toLowerCase();
    const shouldHandover = keywords.some((kw) => queryLower.includes(kw.toLowerCase()));
    if (shouldHandover) {
      return {
        reply: config.language === AiLanguage.BENGALI ? config.fallbackMessageBn : config.fallbackMessageEn,
        creditsDeducted: 0,
        handoverRecommended: true,
      };
    }

    // 3. Vision Matching (if customer sent photo)
    let visionContext = '';
    let matchedProducts: any[] = [];
    if (imageUrl) {
      const visionResult = await this.openai.analyzeProductImage(imageUrl);
      visionContext = `\n[Image Analysis: Customer shared an image depicting ${visionResult.description}. Suggested search terms: ${visionResult.suggestedSearchKeywords.join(', ')}]`;

      // Search products matching keywords
      matchedProducts = await this.prisma.product.findMany({
        where: {
          tenantId,
          status: ProductStatus.ACTIVE,
          OR: visionResult.suggestedSearchKeywords.map((kw) => ({
            name: { contains: kw },
          })),
        },
        take: 3,
      });
    }

    // 4. RAG Knowledge Retrieval
    const relevantChunks = await this.knowledgeService.searchRelevantChunks(tenantId, userQuery, 3);
    const ragContext = relevantChunks.length > 0
      ? `\n[STORE KNOWLEDGE BASE CONTEXT]:\n${relevantChunks.join('\n---\n')}\n`
      : '';

    // 5. Product Catalog Quick Lookup (if query mentions price or product)
    const storeProducts = await this.prisma.product.findMany({
      where: { tenantId, status: ProductStatus.ACTIVE },
      select: { name: true, price: true, sku: true, stockQuantity: true },
      take: 8,
    });
    const catalogContext = `\n[AVAILABLE PRODUCTS IN STORE]:\n` +
      storeProducts.map((p) => `- ${p.name} (SKU: ${p.sku}) | Price: ৳${p.price} | Stock: ${p.stockQuantity}`).join('\n');

    // 6. Build Final System Prompt
    const fullSystemPrompt = `${config.systemPrompt}
Tone: ${config.tone}.
Language: ${config.language}.
${ragContext}
${catalogContext}
${visionContext}
Answer concisely and politely. Encourage orders with Cash on Delivery (COD) or bKash.`;

    const chatMessages: any[] = [
      ...conversationHistory.slice(-6),
      { role: 'user', content: userQuery || 'Product photo' },
    ];

    const aiResult = await this.openai.generateChatResponse({
      messages: chatMessages,
      systemPrompt: fullSystemPrompt,
      temperature: config.temperature,
    });

    // 7. Deduct credits & record transaction
    const creditCost = imageUrl ? 3 : 1;
    await this.prisma.$transaction([
      this.prisma.tenant.update({
        where: { id: tenantId },
        data: { creditBalance: { decrement: creditCost } },
      }),
      this.prisma.aiCreditTransaction.create({
        data: {
          tenantId,
          amount: -creditCost,
          type: imageUrl ? CreditTransactionType.USAGE_VISION : CreditTransactionType.USAGE_CHAT,
          balanceAfter: tenant.creditBalance - creditCost,
          description: `AI ${imageUrl ? 'Vision + Chat' : 'Chat'} Response`,
        },
      }),
    ]);

    return {
      reply: aiResult.content,
      tokensUsed: aiResult.tokensUsed,
      creditsDeducted: creditCost,
      matchedProducts,
      handoverRecommended: false,
    };
  }
}
