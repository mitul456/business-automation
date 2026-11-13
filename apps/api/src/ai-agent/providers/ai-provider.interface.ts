export interface ChatMessageDto {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GenerateCompletionOptions {
  messages: ChatMessageDto[];
  systemPrompt?: string;
  temperature?: number;
  model?: string;
  maxTokens?: number;
}

export interface CompletionResult {
  content: string;
  tokensUsed: number;
  model: string;
}

export interface VisionResult {
  productType: string;
  colors: string[];
  features: string[];
  suggestedSearchKeywords: string[];
  description: string;
}

export interface TranscriptionResult {
  text: string;
  durationSeconds?: number;
}

export interface AiProvider {
  readonly name: string;
  generateCompletion(options: GenerateCompletionOptions): Promise<CompletionResult>;
  generateEmbedding(text: string): Promise<number[]>;
  analyzeImage(imageUrl: string, prompt?: string): Promise<VisionResult>;
  transcribeAudio(audioBuffer: Buffer, filename?: string): Promise<TranscriptionResult>;
  synthesizeSpeech?(text: string, voice?: string): Promise<Buffer>;
}
