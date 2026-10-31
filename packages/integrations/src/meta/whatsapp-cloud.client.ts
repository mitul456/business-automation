import axios, { AxiosInstance } from 'axios';

export interface WhatsAppSendResponse {
  messaging_product: 'whatsapp';
  contacts: Array<{ input: string; wa_id: string }>;
  messages: Array<{ id: string }>;
}

export class WhatsAppCloudClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: 'https://graph.facebook.com/v20.0',
      timeout: 10000,
    });
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
   * Send WhatsApp interactive button message
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
}
