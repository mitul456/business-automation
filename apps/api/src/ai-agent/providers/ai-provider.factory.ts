import { Injectable } from '@nestjs/common';
import { AiProvider } from './ai-provider.interface';
import { OpenAiProvider } from './openai.provider';

@Injectable()
export class AiProviderFactory {
  private readonly providers = new Map<string, AiProvider>();

  constructor() {
    this.providers.set('openai', new OpenAiProvider());
  }

  getProvider(providerName = 'openai'): AiProvider {
    const provider = this.providers.get(providerName.toLowerCase());
    if (!provider) {
      // Default to OpenAI provider
      return this.providers.get('openai')!;
    }
    return provider;
  }

  registerProvider(name: string, provider: AiProvider) {
    this.providers.set(name.toLowerCase(), provider);
  }
}
