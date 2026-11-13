import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { KnowledgeService } from '../knowledge/knowledge.service';
import { AiProviderFactory } from './providers/ai-provider.factory';
import {
  LanguageIntentDetector,
  LanguageIntentDetectionResult,
  DetectedIntent,
} from './language-intent.detector';
import { SafetyGuardrails } from './safety-guardrails';
import {
  CreditTransactionType,
  AiLanguage,
  ProductStatus,
} from '@omniflow/shared';

export interface RunPipelineOptions {
  tenantId: string;
  userQuery: string;
  conversationId?: string;
  customerId?: string;
  imageUrl?: string;
  audioBuffer?: Buffer;
  generateVoiceReply?: boolean;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  isPlaygroundSimulation?: boolean;
}

export interface MatchedProductDetail {
  id: string;
  name: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  stockQuantity: number;
  images: string[];
  visualTags?: string[];
  variants?: Array<{
    name?: string;
    size?: string;
    color?: string;
    sku?: string;
    price?: number;
    stockQuantity?: number;
  }>;
  description?: string;
  inStock: boolean;
}

export interface PipelineExecutionResult {
  reply: string;
  detectedLanguage: string;
  detectedIntent: DetectedIntent;
  confidence: number;
  tokensUsed: number;
  creditsDeducted: number;
  matchedProducts: MatchedProductDetail[];
  recommendedProductCard?: MatchedProductDetail | null;
  audioResponseBase64?: string;
  transcribedVoiceText?: string;
  relevantKnowledge: string[];
  executedActions: Array<{ action: string; status: 'executed' | 'blocked' | 'recommended'; details?: any }>;
  guardrails: {
    inputValid: boolean;
    hallucinationFree: boolean;
    flaggedReasons: string[];
    hallucinationNotes: string[];
  };
  handoverRecommended: boolean;
  afterHoursResponse?: boolean;
}

@Injectable()
export class AiPipelineService {
  private readonly logger = new Logger(AiPipelineService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly knowledgeService: KnowledgeService,
    private readonly aiProviderFactory: AiProviderFactory
  ) {}

  async executePipeline(options: RunPipelineOptions): Promise<PipelineExecutionResult> {
    const {
      tenantId,
      userQuery: initialQuery,
      conversationId,
      imageUrl,
      audioBuffer,
      conversationHistory = [],
      isPlaygroundSimulation = false,
    } = options;

    const provider = this.aiProviderFactory.getProvider();
    const executedActions: Array<{ action: string; status: 'executed' | 'blocked' | 'recommended'; details?: any }> = [];

    // 1. Verify Tenant & Credits
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { aiAgentConfig: true },
    });

    if (!tenant) {
      throw new BadRequestException('Workspace tenant not found');
    }

    if (!isPlaygroundSimulation && tenant.creditBalance <= 0) {
      return {
        reply: 'Our AI assistant is temporarily unavailable due to credit limits. A team member will assist you shortly.',
        detectedLanguage: 'English',
        detectedIntent: DetectedIntent.HUMAN_HANDOVER,
        confidence: 1.0,
        tokensUsed: 0,
        creditsDeducted: 0,
        matchedProducts: [],
        relevantKnowledge: [],
        executedActions: [{ action: 'human_escalation', status: 'executed', details: 'Insufficient credits' }],
        guardrails: { inputValid: true, hallucinationFree: true, flaggedReasons: [], hallucinationNotes: [] },
        handoverRecommended: true,
      };
    }

    const config = tenant.aiAgentConfig || {
      personaName: 'OmniAssistant',
      systemPrompt: 'You are an intelligent business assistant assisting customers in Bangladesh.',
      tone: 'FRIENDLY',
      language: AiLanguage.AUTO,
      temperature: 0.7,
      confidenceThreshold: 0.75,
      capabilities: {
        autoOrderCreation: true,
        productSearch: true,
        imageRecognition: true,
        voiceTranscription: true,
        bookingAppointment: true,
      },
      handoverKeywords: ['human', 'agent', 'support', 'প্রতিনিধি', 'কথা বলতে চাই', 'মানুষ চাই'],
      fallbackMessageEn: 'Connecting you with one of our support specialists right away.',
      fallbackMessageBn: 'আপনাকে আমাদের কাস্টমার প্রতিনিধির সাথে সংযুক্ত করছি। একটু অপেক্ষা করুন।',
      businessHoursOnly: false,
      businessHoursJson: null,
    };

    const capabilities = (config.capabilities as Record<string, boolean>) || {};

    // 2. Audio Voice Transcription (Whisper) if voice note sent
    let activeQuery = initialQuery;
    let transcribedVoiceText: string | undefined = undefined;
    if (audioBuffer && audioBuffer.length > 0) {
      const voiceCheck = SafetyGuardrails.verifyActionPermitted('voice_transcription', capabilities);
      if (voiceCheck.permitted) {
        const transcript = await provider.transcribeAudio(audioBuffer, 'voice_message.ogg');
        activeQuery = transcript.text;
        transcribedVoiceText = transcript.text;
        executedActions.push({ action: 'voice_transcription', status: 'executed', details: activeQuery });
      } else {
        executedActions.push({ action: 'voice_transcription', status: 'blocked', details: voiceCheck.reason });
      }
    }

    // 3. Safety Guardrails: Input Sanitization & Injection Prevention
    const guardrailCheck = SafetyGuardrails.validateAndSanitizeInput(activeQuery);
    if (!guardrailCheck.isValid && guardrailCheck.preventExecution) {
      return {
        reply: 'I am here to assist you with our store products, orders, and services. How may I help you with your shopping today?',
        detectedLanguage: 'English',
        detectedIntent: DetectedIntent.GENERAL_CHAT,
        confidence: 0.99,
        tokensUsed: 15,
        creditsDeducted: 0,
        matchedProducts: [],
        relevantKnowledge: [],
        executedActions: [{ action: 'injection_defense', status: 'executed', details: guardrailCheck.flaggedReasons }],
        guardrails: {
          inputValid: false,
          hallucinationFree: true,
          flaggedReasons: guardrailCheck.flaggedReasons,
          hallucinationNotes: [],
        },
        handoverRecommended: false,
      };
    }

    // 4. Language & Intent Detection
    const detection = LanguageIntentDetector.analyze(guardrailCheck.sanitizedInput, !!imageUrl);

    // 5. Working Hours Check
    if (config.businessHoursOnly && config.businessHoursJson) {
      const isOutsideHours = this.isOutsideBusinessHours(config.businessHoursJson as any);
      if (isOutsideHours) {
        const afterHoursReply =
          detection.language === AiLanguage.BENGALI
            ? 'আমাদের অফিস সময় সকাল ৯টা থেকে রাত ১০টা পর্যন্ত। আপনার বার্তাটি গ্রহণ করা হয়েছে, অফিস শুরুর পর আমাদের প্রতিনিধি আপনার সাথে যোগাযোগ করবেন।'
            : 'Our business hours are 9:00 AM to 10:00 PM (BST). We have received your message and our team will get back to you during business hours.';

        return {
          reply: afterHoursReply,
          detectedLanguage: detection.detectedLanguageName,
          detectedIntent: detection.intent,
          confidence: detection.intentConfidence,
          tokensUsed: 20,
          creditsDeducted: 0,
          matchedProducts: [],
          relevantKnowledge: [],
          executedActions: [{ action: 'after_hours_notice', status: 'executed' }],
          guardrails: { inputValid: true, hallucinationFree: true, flaggedReasons: [], hallucinationNotes: [] },
          handoverRecommended: false,
          afterHoursResponse: true,
        };
      }
    }

    // 6. Check Human Handover Keywords & Escalation Rules
    const keywords = (config.handoverKeywords as string[]) || [];
    const queryLower = guardrailCheck.sanitizedInput.toLowerCase();
    const shouldHandover =
      detection.intent === DetectedIntent.HUMAN_HANDOVER ||
      keywords.some((kw) => queryLower.includes(kw.toLowerCase()));

    if (shouldHandover) {
      const handoverReply =
        detection.language === AiLanguage.BENGALI ? config.fallbackMessageBn : config.fallbackMessageEn;

      executedActions.push({ action: 'human_escalation', status: 'executed', details: 'Customer requested human agent' });

      return {
        reply: handoverReply,
        detectedLanguage: detection.detectedLanguageName,
        detectedIntent: DetectedIntent.HUMAN_HANDOVER,
        confidence: 0.98,
        tokensUsed: 25,
        creditsDeducted: 0,
        matchedProducts: [],
        relevantKnowledge: [],
        executedActions,
        guardrails: { inputValid: true, hallucinationFree: true, flaggedReasons: [], hallucinationNotes: [] },
        handoverRecommended: true,
      };
    }

    // 7. Multimodal Vision Analysis & Full Product Gallery Catalog Matching
    let visionContext = '';
    let matchedProducts: MatchedProductDetail[] = [];

    // Helper to format raw product from DB to MatchedProductDetail
    const formatProductDetail = (p: any): MatchedProductDetail => {
      let images: string[] = [];
      if (Array.isArray(p.images)) {
        images = p.images;
      } else if (typeof p.images === 'string') {
        try {
          const parsed = JSON.parse(p.images);
          images = Array.isArray(parsed) ? parsed : [p.images];
        } catch {
          images = [p.images];
        }
      }

      let variants: any[] = [];
      if (Array.isArray(p.variants)) {
        variants = p.variants;
      } else if (typeof p.variants === 'string') {
        try {
          const parsed = JSON.parse(p.variants);
          variants = Array.isArray(parsed) ? parsed : [];
        } catch {
          variants = [];
        }
      }

      let visualTags: string[] = [];
      if (Array.isArray(p.visualTags)) {
        visualTags = p.visualTags;
      } else if (typeof p.visualTags === 'string') {
        try {
          const parsed = JSON.parse(p.visualTags);
          visualTags = Array.isArray(parsed) ? parsed : [];
        } catch {
          visualTags = [];
        }
      }

      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        price: Number(p.price),
        compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : undefined,
        stockQuantity: p.stockQuantity,
        images,
        visualTags,
        variants,
        description: p.description,
        inStock: p.stockQuantity > 0,
      };
    };

    // Fetch active products in the store
    const storeProducts = await this.prisma.product.findMany({
      where: { tenantId, status: ProductStatus.ACTIVE },
      select: {
        id: true,
        name: true,
        sku: true,
        price: true,
        compareAtPrice: true,
        stockQuantity: true,
        images: true,
        visualTags: true,
        variants: true,
        description: true,
      },
      take: 20,
    });

    if (imageUrl) {
      const visionCheck = SafetyGuardrails.verifyActionPermitted('image_recognition', capabilities);
      if (visionCheck.permitted) {
        const visionResult = await provider.analyzeImage(imageUrl);
        visionContext = `\n[Customer shared product photo. Identified: ${visionResult.productType}, Colors: ${visionResult.colors.join(', ')}, Features: ${visionResult.features.join(', ')}, Keywords: ${visionResult.suggestedSearchKeywords.join(', ')}]`;

        // Match against catalog products (checking Name, VisualTags, Description, Variants & Gallery Images)
        const scoredProducts = storeProducts
          .map((p) => {
            const formatted = formatProductDetail(p);
            let score = 0;
            const nameLower = formatted.name.toLowerCase();
            const descLower = (formatted.description || '').toLowerCase();
            const tagsLower = (formatted.visualTags || []).map((t) => t.toLowerCase());

            // Keyword match in name or description
            for (const kw of visionResult.suggestedSearchKeywords) {
              const kwLower = kw.toLowerCase();
              if (nameLower.includes(kwLower)) score += 5;
              if (descLower.includes(kwLower)) score += 3;
              if (tagsLower.some((t) => t.includes(kwLower))) score += 4;
            }

            // Color match in visual tags or variants
            for (const col of visionResult.colors) {
              const colLower = col.toLowerCase();
              if (nameLower.includes(colLower)) score += 3;
              if (tagsLower.some((t) => t.includes(colLower))) score += 3;
              if ((formatted.variants || []).some((v: any) => (v.color || '').toLowerCase().includes(colLower))) {
                score += 4;
              }
            }

            return { product: formatted, score };
          })
          .filter((item) => item.score > 0)
          .sort((a, b) => b.score - a.score);

        matchedProducts = scoredProducts.slice(0, 3).map((item) => item.product);

        executedActions.push({
          action: 'image_recognition',
          status: 'executed',
          details: { keywords: visionResult.suggestedSearchKeywords, matchedCount: matchedProducts.length },
        });
      } else {
        executedActions.push({ action: 'image_recognition', status: 'blocked', details: visionCheck.reason });
      }
    }

    // 8. RAG Semantic Knowledge Retrieval
    const relevantChunks = await this.knowledgeService.searchRelevantChunks(
      tenantId,
      guardrailCheck.sanitizedInput,
      3
    );
    const ragContext =
      relevantChunks.length > 0
        ? `\n[VERIFIED STORE KNOWLEDGE BASE]:\n${relevantChunks.join('\n---\n')}\n`
        : '';

    // 9. Product Catalog Retrieval (if shopping/price inquiry and not already matched)
    if (
      matchedProducts.length === 0 &&
      (detection.intent === DetectedIntent.PRODUCT_INQUIRY ||
        detection.intent === DetectedIntent.PRICE_CHECK ||
        detection.intent === DetectedIntent.ORDER_CREATION ||
        queryLower.includes('পাঞ্জাবি') ||
        queryLower.includes('panjabi') ||
        queryLower.includes('watch') ||
        queryLower.includes('ঘড়ি') ||
        queryLower.includes('ঘড়ি') ||
        queryLower.includes('wallet') ||
        queryLower.includes('মানিব্যাগ') ||
        queryLower.includes('স্টক') ||
        queryLower.includes('দাম') ||
        queryLower.includes('সাইজ'))
    ) {
      // Find products matching customer query terms
      const scoredProducts = storeProducts
        .map((p) => {
          const formatted = formatProductDetail(p);
          let score = 0;
          const nameLower = formatted.name.toLowerCase();
          const descLower = (formatted.description || '').toLowerCase();
          const tagsLower = (formatted.visualTags || []).map((t) => t.toLowerCase());

          const searchWords = queryLower.split(/\s+/).filter((w) => w.length > 2);
          for (const word of searchWords) {
            if (nameLower.includes(word)) score += 4;
            if (descLower.includes(word)) score += 2;
            if (tagsLower.some((t) => t.includes(word))) score += 3;
            if ((formatted.variants || []).some((v: any) => (v.size || '').toLowerCase() === word)) score += 4;
          }

          return { product: formatted, score };
        })
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score);

      if (scoredProducts.length > 0) {
        matchedProducts = scoredProducts.slice(0, 3).map((item) => item.product);
      } else {
        matchedProducts = storeProducts.slice(0, 3).map(formatProductDetail);
      }

      executedActions.push({
        action: 'product_search',
        status: 'executed',
        details: { count: matchedProducts.length },
      });
    }

    // Build Comprehensive Product & Variant Availability Context
    let catalogContext = '';
    if (matchedProducts.length > 0) {
      catalogContext =
        `\n[AVAILABLE STORE PRODUCTS (VERIFIED DATA - DO NOT INVENT)]: \n` +
        matchedProducts
          .map((p) => {
            const variantSummary =
              p.variants && p.variants.length > 0
                ? p.variants
                    .map(
                      (v) =>
                        `    * Size ${v.size || 'Standard'} (${v.color || 'Default'}): ${
                          (v.stockQuantity ?? 0) > 0 ? `${v.stockQuantity} pcs AVAILABLE` : 'OUT OF STOCK'
                        }`
                    )
                    .join('\n')
                : `    * Stock: ${p.stockQuantity > 0 ? `${p.stockQuantity} pcs AVAILABLE` : 'OUT OF STOCK'}`;

            return `- Product ID: ${p.id}\n  Name: ${p.name}\n  SKU: ${p.sku}\n  Price: ৳${p.price} BDT${
              p.compareAtPrice ? ` (Original: ৳${p.compareAtPrice})` : ''
            }\n  Overall Stock: ${p.stockQuantity > 0 ? `${p.stockQuantity} pcs in stock` : 'OUT OF STOCK'}\n  Gallery Images: ${p.images.length} photos available (${p.images.join(', ')})\n  Variant Stock Breakdown:\n${variantSummary}\n  Description: ${p.description || 'Premium store merchandise'}`;
          })
          .join('\n\n');
    } else if (imageUrl) {
      catalogContext = `\n[CATALOG MATCH RESULT]: No products in our database matched the customer's shared image. Do not invent any product name or price. Politely inform the customer that this exact product is not currently in our catalog.`;
    }

    // 10. Construct Controlled System Prompt & Guardrails
    const languageDirective =
      detection.language === AiLanguage.BENGALI
        ? 'Customer is communicating in Bengali. Always respond politely in fluent Bengali (বাংলা).'
        : detection.language === AiLanguage.BANGLISH
        ? 'Customer is communicating in Banglish (Bengali with English alphabet). Respond naturally in friendly Banglish or Bengali.'
        : 'Customer is communicating in English. Respond in professional and clear English.';

    const systemPrompt = `You are ${config.personaName}, the official AI business and sales assistant for this store.
Tone: ${config.tone}.
${languageDirective}
${ragContext}
${catalogContext}
${visionContext}

CRITICAL BUSINESS SAFETY & ACCURACY RULES:
1. PRODUCT GALLERY & IMAGES: When presenting a product, enthusiastically highlight that full gallery images (multiple angles, embroidery details, fabric photos) are available directly in the interactive product card.
2. SIZE & VARIANT AVAILABILITY CHECKING:
   - Always check the "Variant Stock Breakdown" above for exact real-time inventory.
   - If a requested size has stock > 0 (e.g., Size 38, 40, 42), confirm it IS available and ready for immediate dispatch!
   - If a requested size has 0 stock (e.g., Size 44 is OUT OF STOCK), explicitly and politely state that size 44 is currently out of stock, but recommend available sizes (e.g., Size 40 or 42).
   - NEVER tell a customer an out-of-stock size is available.
3. NO HALLUCINATIONS: Never fabricate products, prices, discounts, or inventory counts.
4. EASY ORDERING: Inform the customer they can click the "Buy Now / অর্ডার করুন" button on the interactive product card to place their order directly in chat, or provide their Name, Mobile Number, and Delivery Address.
5. DELIVERY TERMS: Cash on Delivery (ক্যাশ অন ডেলিভারি) available across Bangladesh. Delivery fee: ৳60 inside Dhaka (24-48 hrs), ৳120 outside Dhaka (48-72 hrs).`;

    const chatMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [
      ...conversationHistory.slice(-6),
      { role: 'user', content: guardrailCheck.sanitizedInput || 'Product image' },
    ];

    // 11. Generate AI Response
    const aiResult = await provider.generateCompletion({
      messages: chatMessages,
      systemPrompt,
      temperature: config.temperature,
    });

    // 12. Validate Response Against Hallucinations
    const responseValidation = SafetyGuardrails.validateResponseClaims(
      aiResult.content,
      matchedProducts.map((p) => ({ name: p.name, price: p.price, sku: p.sku, stockQuantity: p.stockQuantity }))
    );

    // 13. Voice Audio Synthesis (TTS) if requested
    let audioResponseBase64: string | undefined = undefined;
    if (options.generateVoiceReply || (audioBuffer && audioBuffer.length > 0)) {
      try {
        if (provider.synthesizeSpeech) {
          const speechBuffer = await provider.synthesizeSpeech(responseValidation.correctedResponse);
          if (speechBuffer && speechBuffer.length > 0) {
            audioResponseBase64 = speechBuffer.toString('base64');
          }
        }
      } catch (err: any) {
        this.logger.warn(`Could not synthesize voice reply: ${err.message}`);
      }
    }

    // 13. Action Execution (e.g. Order Creation validation if customer placed order)
    if (detection.intent === DetectedIntent.ORDER_CREATION) {
      const orderCheck = SafetyGuardrails.verifyActionPermitted('order_creation', capabilities);
      if (orderCheck.permitted) {
        executedActions.push({
          action: 'order_creation',
          status: 'recommended',
          details: 'Ready to capture customer name, phone and delivery address for order placement.',
        });
      } else {
        executedActions.push({
          action: 'order_creation',
          status: 'blocked',
          details: orderCheck.reason,
        });
      }
    }

    // 14. Deduct Credits & Record Audit Transaction (unless in playground simulation)
    const creditCost = imageUrl ? 3 : 1;
    if (!isPlaygroundSimulation) {
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
            description: `AI ${imageUrl ? 'Vision + Chat' : 'Chat'} Inference (${detection.detectedLanguageName})`,
            metadata: {
              intent: detection.intent,
              tokens: aiResult.tokensUsed,
              language: detection.detectedLanguageName,
            },
          },
        }),
      ]);
    }

    return {
      reply: responseValidation.correctedResponse,
      detectedLanguage: detection.detectedLanguageName,
      detectedIntent: detection.intent,
      confidence: detection.intentConfidence,
      tokensUsed: aiResult.tokensUsed,
      creditsDeducted: creditCost,
      matchedProducts,
      recommendedProductCard: matchedProducts.length > 0 ? matchedProducts[0] : null,
      audioResponseBase64,
      transcribedVoiceText,
      relevantKnowledge: relevantChunks,
      executedActions,
      guardrails: {
        inputValid: guardrailCheck.isValid,
        hallucinationFree: responseValidation.isHallucinationFree,
        flaggedReasons: guardrailCheck.flaggedReasons,
        hallucinationNotes: responseValidation.hallucinationNotes,
      },
      handoverRecommended: false,
    };
  }

  private isOutsideBusinessHours(businessHours: {
    enabled?: boolean;
    timezone?: string;
    startHour?: number;
    endHour?: number;
  }): boolean {
    if (!businessHours || businessHours.enabled === false) return false;
    // By default 9 AM to 10 PM Bangladesh Standard Time (UTC+6)
    const now = new Date();
    const utcHours = now.getUTCHours();
    const bstHour = (utcHours + 6) % 24;

    const start = businessHours.startHour ?? 9;
    const end = businessHours.endHour ?? 22;

    return bstHour < start || bstHour >= end;
  }
}
