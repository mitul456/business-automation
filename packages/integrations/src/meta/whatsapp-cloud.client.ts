import axios, { AxiosInstance } from 'axios';
import * as crypto from 'crypto';

export interface WhatsAppSendResponse {
  messaging_product: 'whatsapp';
  contacts: Array<{ input: string; wa_id: string }>;
  messages: Array<{ id: string }>;
}

export class WhatsAppCloudClient {
  private client: AxiosInstance;

  constructor(apiVersion = 'v20.0') {
    this.client = axios.create({
      baseURL: `https://graph.facebook.com/${apiVersion}`,
      timeout: 15000,
    });
  }

  /**
   * Verifies incoming webhook handshake (GET /webhooks/whatsapp)
   */
  verifyWebhookChallenge(
    mode: string,
    token: string,
    challenge: string,
    expectedVerifyToken: string
  ): string | null {
    if (mode === 'subscribe' && token === expectedVerifyToken) {
      return challenge;
    }
    return null;
  }

  /**
   * Cryptographically verifies incoming webhook payload signature
   */
  verifyWebhookSignature(rawBody: string | Buffer, signatureHeader: string, appSecret: string): boolean {
    if (!appSecret || !signatureHeader) return false;
    const [algorithm, hash] = signatureHeader.split('=');
    if (algorithm !== 'sha256' || !hash) return false;

    const expectedHash = crypto
      .createHmac('sha256', appSecret)
      .update(rawBody)
      .digest('hex');

    if (hash.length !== expectedHash.length) return false;
    return crypto.timingSafeEqual(Buffer.from(hash, 'utf8'), Buffer.from(expectedHash, 'utf8'));
  }

  /**
   * Send WhatsApp text message
   */
  async sendTextMessage(
    phoneNumberId: string,
    accessToken: string,
    to: string,
    body: string
  ): Promise<WhatsAppSendResponse> {
    const formattedTo = to.replace(/[^\d]/g, '');
    const response = await this.client.post<WhatsAppSendResponse>(
      `/${phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: formattedTo,
        type: 'text',
        text: { body },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  }

  /**
   * Send WhatsApp media message (image, audio, document)
   */
  async sendMediaMessage(
    phoneNumberId: string,
    accessToken: string,
    to: string,
    type: 'image' | 'audio' | 'document',
    mediaUrl: string,
    caption?: string
  ): Promise<WhatsAppSendResponse> {
    const formattedTo = to.replace(/[^\d]/g, '');
    const payload: any = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: formattedTo,
      type,
      [type]: { link: mediaUrl, ...(caption && type !== 'audio' ? { caption } : {}) },
    };

    const response = await this.client.post<WhatsAppSendResponse>(
      `/${phoneNumberId}/messages`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  }

  /**
   * Send pre-approved WhatsApp Template Message
   */
  async sendTemplateMessage(
    phoneNumberId: string,
    accessToken: string,
    to: string,
    templateName: string,
    languageCode = 'bn',
    components?: any[]
  ): Promise<WhatsAppSendResponse> {
    const formattedTo = to.replace(/[^\d]/g, '');
    const response = await this.client.post<WhatsAppSendResponse>(
      `/${phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: formattedTo,
        type: 'template',
        template: {
          name: templateName,
          language: { code: languageCode },
          components: components || [],
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  }

  /**
   * Send WhatsApp interactive quick reply buttons
   */
  async sendInteractiveButtons(
    phoneNumberId: string,
    accessToken: string,
    to: string,
    bodyText: string,
    buttons: Array<{ id: string; title: string }>
  ): Promise<WhatsAppSendResponse> {
    const formattedTo = to.replace(/[^\d]/g, '');
    const response = await this.client.post<WhatsAppSendResponse>(
      `/${phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: formattedTo,
        type: 'interactive',
        interactive: {
          type: 'button',
          body: { text: bodyText },
          action: {
            buttons: buttons.map((b) => ({
              type: 'reply',
              reply: { id: b.id, title: b.title.slice(0, 20) },
            })),
          },
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  }

  /**
   * Mark incoming message as read
   */
  async markMessageAsRead(
    phoneNumberId: string,
    accessToken: string,
    messageId: string
  ): Promise<{ success: boolean }> {
    try {
      const response = await this.client.post(
        `/${phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          status: 'read',
          message_id: messageId,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return { success: response.status === 200 };
    } catch {
      return { success: false };
    }
  }
}
