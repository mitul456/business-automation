import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AiPipelineService, RunPipelineOptions } from './ai-pipeline.service';
import { AiProviderFactory } from './providers/ai-provider.factory';
import {
  AiAgentConfigInput,
  AiTone,
  AiLanguage,
} from '@omniflow/shared';

@Injectable()
export class AiAgentService {
  private readonly logger = new Logger(AiAgentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pipelineService: AiPipelineService,
    private readonly providerFactory: AiProviderFactory
  ) {}

  async getConfig(tenantId: string) {
    let config = await this.prisma.aiAgentConfig.findUnique({
      where: { tenantId },
    });

    if (!config) {
      config = await this.prisma.aiAgentConfig.create({
        data: {
          tenantId,
          personaName: 'Apex Assistant',
          businessIdentity: 'OmniFlow AI Commerce Assistant for Bangladesh',
          personality: 'Polite, sales-driven, and culturally attuned to Bangladeshi retail shoppers',
          systemPrompt:
            'You are the intelligent business assistant for an online brand in Bangladesh. Assist customers with product recommendations, order placement, and support in Bengali and English.',
          tone: AiTone.FRIENDLY,
          language: AiLanguage.AUTO,
          temperature: 0.7,
          confidenceThreshold: 0.75,
          capabilities: {
            autoOrderCreation: true,
            productSearch: true,
            imageRecognition: true,
            voiceTranscription: true,
            bookingAppointment: true,
            sentimentAnalysis: true,
          },
          handoverKeywords: ['human', 'agent', 'support', 'প্রতিনিধি', 'কথা বলতে চাই', 'মানুষ চাই'],
          fallbackMessageEn: 'Connecting you with our support specialist right away.',
          fallbackMessageBn: 'আপনাকে আমাদের কাস্টমার প্রতিনিধির সাথে সংযুক্ত করছি। একটু অপেক্ষা করুন।',
          businessHoursOnly: false,
          businessHoursJson: {
            enabled: false,
            timezone: 'Asia/Dhaka',
            startHour: 9,
            endHour: 22,
          },
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
        businessIdentity: input.businessIdentity,
        personality: input.personality,
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
        escalationRules: input.escalationRules as any,
        knowledgeSourceIds: input.knowledgeSourceIds as any,
      },
      create: {
        tenantId,
        personaName: input.personaName,
        businessIdentity: input.businessIdentity,
        personality: input.personality,
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
        escalationRules: input.escalationRules as any,
        knowledgeSourceIds: input.knowledgeSourceIds as any,
      },
    });
  }

  /**
   * Executes the full production AI pipeline with credit tracking
   */
  async generateResponse(params: {
    tenantId: string;
    userQuery: string;
    imageUrl?: string;
    audioBuffer?: Buffer;
    conversationId?: string;
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  }) {
    return this.pipelineService.executePipeline({
      tenantId: params.tenantId,
      userQuery: params.userQuery,
      imageUrl: params.imageUrl,
      audioBuffer: params.audioBuffer,
      conversationId: params.conversationId,
      conversationHistory: params.conversationHistory,
      isPlaygroundSimulation: false,
    });
  }

  /**
   * Executes the AI pipeline in sandbox playground mode with deep diagnostics
   */
  async runPlaygroundSimulation(params: {
    tenantId: string;
    userQuery: string;
    imageUrl?: string;
    audioBuffer?: Buffer;
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  }) {
    return this.pipelineService.executePipeline({
      tenantId: params.tenantId,
      userQuery: params.userQuery,
      imageUrl: params.imageUrl,
      audioBuffer: params.audioBuffer,
      conversationHistory: params.conversationHistory,
      isPlaygroundSimulation: true,
    });
  }

  /**
   * Whisper STT speech-to-text audio transcription
   */
  async transcribeVoice(audioBuffer: Buffer, filename?: string) {
    const provider = this.providerFactory.getProvider();
    return provider.transcribeAudio(audioBuffer, filename);
  }

  /**
   * OpenAI TTS text-to-speech audio synthesis
   */
  async synthesizeVoice(text: string, voice?: string) {
    const provider = this.providerFactory.getProvider();
    if (provider.synthesizeSpeech) {
      return provider.synthesizeSpeech(text, voice);
    }
    return Buffer.from([]);
  }
}
