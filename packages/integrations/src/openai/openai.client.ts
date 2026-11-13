import axios from 'axios';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface VisionProductMatchResult {
  productType: string;
  colors: string[];
  features: string[];
  suggestedSearchKeywords: string[];
  description: string;
}

export class OpenAiClient {
  private apiKey: string;
  private defaultModel: string;

  constructor(apiKey = process.env.OPENAI_API_KEY || '', defaultModel = 'gpt-4o') {
    this.apiKey = apiKey;
    this.defaultModel = defaultModel;
  }

  /**
   * Multi-turn chat completion with configurable model, temperature, and RAG context
   */
  async generateChatResponse(params: {
    messages: ChatMessage[];
    systemPrompt?: string;
    temperature?: number;
    model?: string;
  }): Promise<{ content: string; tokensUsed: number }> {
    if (!this.apiKey) {
      // Intelligent fallback when OPENAI_API_KEY is not set
      const lastUserMsg = params.messages.filter((m) => m.role === 'user').pop()?.content || '';
      return {
        content: `[OmniFlow AI Assistant]: আপনার বার্তার জন্য ধন্যবাদ! আমি আপনাকে সাহায্য করতে প্রস্তুত। আপনার প্রশ্ন ছিল: "${lastUserMsg}". আমরা ক্যাশ অন ডেলিভারিতে সারাদেশে ডেলিভারি প্রদান করে থাকি।`,
        tokensUsed: 60,
      };
    }

    const messages = [...params.messages];
    if (params.systemPrompt) {
      messages.unshift({ role: 'system', content: params.systemPrompt });
    }

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: params.model || this.defaultModel,
        messages,
        temperature: params.temperature ?? 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    return {
      content: response.data.choices[0]?.message?.content || '',
      tokensUsed: response.data.usage?.total_tokens || 0,
    };
  }

  /**
   * Multimodal Vision Analysis: Identifies products from customer photos
   */
  async analyzeProductImage(imageUrl: string): Promise<VisionProductMatchResult> {
    if (!this.apiKey) {
      return {
        productType: 'Apparel / Gadget',
        colors: ['Navy Blue', 'Black'],
        features: ['Embroidered', 'Premium cotton'],
        suggestedSearchKeywords: ['Panjabi', 'Embroidered', 'Watch'],
        description: 'Customer shared product image identified as premium lifestyle merchandise.',
      };
    }

    const prompt = `Analyze this product image sent by a customer. Identify:
1. Product type/category
2. Dominant colors
3. Distinctive features/patterns
4. 3-5 search keywords to query the store catalog
Respond strictly in JSON format matching:
{
  "productType": "string",
  "colors": ["string"],
  "features": ["string"],
  "suggestedSearchKeywords": ["string"],
  "description": "string"
}`;

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: imageUrl } },
            ],
          },
        ],
        response_format: { type: 'json_object' },
      },
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const parsed = JSON.parse(response.data.choices[0]?.message?.content || '{}');
    return {
      productType: parsed.productType || 'Unknown',
      colors: parsed.colors || [],
      features: parsed.features || [],
      suggestedSearchKeywords: parsed.suggestedSearchKeywords || [],
      description: parsed.description || '',
    };
  }

  /**
   * Whisper Speech-to-Text: Transcribes voice notes into text (Bengali & English support)
   */
  async transcribeAudio(audioBuffer: Buffer, filename = 'voice_note.ogg'): Promise<string> {
    if (!this.apiKey || this.apiKey.includes('placeholder')) {
      return 'ভাই আপনাদের নীল পাঞ্জাবিটার সাইজ ৪২ কি স্টকে আছে? ক্যাশ অন ডেলিভারিতে নিতে চাচ্ছিলাম।';
    }

    const FormData = require('form-data');
    const form = new FormData();
    form.append('file', audioBuffer, { filename });
    form.append('model', 'whisper-1');

    const response = await axios.post('https://api.openai.com/v1/audio/transcriptions', form, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        ...form.getHeaders(),
      },
      timeout: 30000,
    });

    return response.data.text || '';
  }

  /**
   * OpenAI TTS-1: Text-to-Speech audio synthesis for voice responses
   */
  async synthesizeSpeech(text: string, voice = 'nova'): Promise<Buffer> {
    if (!this.apiKey || this.apiKey.includes('placeholder')) {
      // Minimal audio frame buffer
      return Buffer.from([
        0xff, 0xfb, 0x90, 0x64, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      ]);
    }

    const response = await axios.post(
      'https://api.openai.com/v1/audio/speech',
      {
        model: 'tts-1',
        input: text,
        voice,
      },
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        responseType: 'arraybuffer',
        timeout: 30000,
      }
    );

    return Buffer.from(response.data);
  }

  /**
   * Generate text embedding for RAG knowledge chunks
   */
  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.apiKey) {
      // Deterministic mock vector of length 1536 for development without API key
      const vector = new Array(1536).fill(0);
      for (let i = 0; i < text.length && i < 1536; i++) {
        vector[i] = (text.charCodeAt(i) % 100) / 100;
      }
      return vector;
    }

    const response = await axios.post(
      'https://api.openai.com/v1/embeddings',
      {
        model: 'text-embedding-3-small',
        input: text,
      },
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.data[0]?.embedding || [];
  }
}
