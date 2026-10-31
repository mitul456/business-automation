import axios, { AxiosInstance } from 'axios';
import * as crypto from 'crypto';

export interface MetaSendResponse {
  recipient_id: string;
  message_id: string;
}

export class MetaGraphClient {
  private client: AxiosInstance;
  private appSecret: string;

  constructor(appSecret = process.env.META_APP_SECRET || '') {
    this.appSecret = appSecret;
    this.client = axios.create({
      baseURL: 'https://graph.facebook.com/v20.0',
      timeout: 10000,
    });
  }

  /**
   * Verifies incoming webhook signature from Meta (X-Hub-Signature-256)
   */
  verifyWebhookSignature(rawBody: string | Buffer, signatureHeader: string): boolean {
    if (!this.appSecret || !signatureHeader) return false;
    const [algorithm, hash] = signatureHeader.split('=');
    if (algorithm !== 'sha256' || !hash) return false;

    const expectedHash = crypto
      .createHmac('sha256', this.appSecret)
      .update(rawBody)
      .digest('hex');

    return crypto.timingSafeEqual(Buffer.from(hash, 'utf8'), Buffer.from(expectedHash, 'utf8'));
  }

  /**
   * Send a text message to a Facebook Page user (PSID)
   */
  async sendTextMessage(pageAccessToken: string, recipientId: string, text: string): Promise<MetaSendResponse> {
    const response = await this.client.post<MetaSendResponse>(
      '/me/messages',
      {
        recipient: { id: recipientId },
        message: { text },
        messaging_type: 'RESPONSE',
      },
      {
        params: { access_token: pageAccessToken },
      }
    );
    return response.data;
  }

  /**
   * Send a structured product card / generic template
   */
  async sendProductCard(
    pageAccessToken: string,
    recipientId: string,
    card: {
      title: string;
      subtitle: string;
      imageUrl?: string;
      buttons?: Array<{ type: string; title: string; payload?: string; url?: string }>;
    }
  ): Promise<MetaSendResponse> {
    const response = await this.client.post<MetaSendResponse>(
      '/me/messages',
      {
        recipient: { id: recipientId },
        message: {
          attachment: {
            type: 'template',
            payload: {
              template_type: 'generic',
              elements: [
                {
                  title: card.title,
                  subtitle: card.subtitle,
                  image_url: card.imageUrl,
                  buttons: card.buttons,
                },
              ],
            },
          },
        },
      },
      {
        params: { access_token: pageAccessToken },
      }
    );
    return response.data;
  }

  /**
   * Send quick reply buttons (e.g. Yes / No / Order Now)
   */
  async sendQuickReplies(
    pageAccessToken: string,
    recipientId: string,
    text: string,
    quickReplies: Array<{ title: string; payload: string }>
  ): Promise<MetaSendResponse> {
    const response = await this.client.post<MetaSendResponse>(
      '/me/messages',
      {
        recipient: { id: recipientId },
        message: {
          text,
          quick_replies: quickReplies.map((qr) => ({
            content_type: 'text',
            title: qr.title,
            payload: qr.payload,
          })),
        },
      },
      {
        params: { access_token: pageAccessToken },
      }
    );
    return response.data;
  }

  /**
   * Fetch customer public profile info (name, profile_pic)
   */
  async getUserProfile(pageAccessToken: string, psid: string): Promise<{ first_name?: string; last_name?: string; name?: string; profile_pic?: string }> {
    try {
      const response = await this.client.get(`/${psid}`, {
        params: {
          fields: 'first_name,last_name,name,profile_pic',
          access_token: pageAccessToken,
        },
      });
      return response.data;
    } catch {
      return { name: `Customer ${psid.slice(-4)}` };
    }
  }
}
