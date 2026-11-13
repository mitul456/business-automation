import { Injectable, Logger } from '@nestjs/common';
import { OpenAiClient } from '@omniflow/integrations';
import {
  AiProvider,
  GenerateCompletionOptions,
  CompletionResult,
  VisionResult,
  TranscriptionResult,
} from './ai-provider.interface';

@Injectable()
export class OpenAiProvider implements AiProvider {
  public readonly name = 'openai';
  private readonly logger = new Logger(OpenAiProvider.name);
  private readonly client: OpenAiClient;

  constructor(apiKey?: string) {
    this.client = new OpenAiClient(apiKey || process.env.OPENAI_API_KEY || '');
  }

  async generateCompletion(options: GenerateCompletionOptions): Promise<CompletionResult> {
    const result = await this.client.generateChatResponse({
      messages: options.messages,
      systemPrompt: options.systemPrompt,
      temperature: options.temperature,
      model: options.model,
    });

    return {
      content: result.content,
      tokensUsed: result.tokensUsed,
      model: options.model || 'gpt-4o',
    };
  }

  async generateEmbedding(text: string): Promise<number[]> {
    return this.client.generateEmbedding(text);
  }

  async analyzeImage(imageUrl: string, _prompt?: string): Promise<VisionResult> {
    return this.client.analyzeProductImage(imageUrl);
  }

  async transcribeAudio(audioBuffer: Buffer, filename = 'audio.ogg'): Promise<TranscriptionResult> {
    const text = await this.client.transcribeAudio(audioBuffer, filename);
    return {
      text,
    };
  }

  async synthesizeSpeech(text: string, voice = 'nova'): Promise<Buffer> {
    return this.client.synthesizeSpeech(text, voice);
  }
}
