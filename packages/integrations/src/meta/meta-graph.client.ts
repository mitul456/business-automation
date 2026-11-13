import axios, { AxiosInstance } from 'axios';
import * as crypto from 'crypto';

export interface MetaSendResponse {
  recipient_id: string;
  message_id: string;
}

export interface MetaPageAccount {
  id: string;
  name: string;
  access_token: string;
  category?: string;
  instagram_business_account?: {
    id: string;
    username?: string;
  };
}

export class MetaGraphClient {
  private client: AxiosInstance;
  private appSecret: string;
  private apiVersion: string;

  constructor(appSecret = process.env.META_APP_SECRET || '', apiVersion = 'v20.0') {
    this.appSecret = appSecret;
    this.apiVersion = apiVersion;
    this.client = axios.create({
      baseURL: `https://graph.facebook.com/${apiVersion}`,
      timeout: 15000,
    });
  }

  /**
   * Generates Facebook Login OAuth Authorization URL
   */
  getOAuthUrl(clientId: string, redirectUri: string, state?: string): string {
    const scopes = [
      'pages_show_list',
      'pages_read_engagement',
      'pages_manage_metadata',
      'pages_messaging',
      'instagram_basic',
      'instagram_manage_messages',
      'business_management',
    ].join(',');

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: scopes,
      response_type: 'code',
      state: state || 'omniflow_meta_oauth',
    });

    return `https://www.facebook.com/${this.apiVersion}/dialog/oauth?${params.toString()}`;
  }

  /**
   * Exchange OAuth authorization code for User Access Token
   */
  async exchangeCodeForToken(
    clientId: string,
    clientSecret: string,
    redirectUri: string,
    code: string
  ): Promise<{ access_token: string; expires_in?: number }> {
    const response = await this.client.get('/oauth/access_token', {
      params: {
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code,
      },
    });
    return response.data;
  }

  /**
   * Exchange short-lived token for long-lived (60 days) user access token
   */
  async getLongLivedUserToken(
    clientId: string,
    clientSecret: string,
    shortLivedToken: string
  ): Promise<{ access_token: string; expires_in: number }> {
    const response = await this.client.get('/oauth/access_token', {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: clientId,
        client_secret: clientSecret,
        fb_exchange_token: shortLivedToken,
      },
    });
    return response.data;
  }

  /**
   * Discover Facebook Pages & connected Instagram Business accounts
   */
  async getAccounts(userAccessToken: string): Promise<MetaPageAccount[]> {
    const response = await this.client.get('/me/accounts', {
      params: {
        fields: 'id,name,access_token,category,instagram_business_account{id,username}',
        access_token: userAccessToken,
      },
    });
    return response.data?.data || [];
  }

  /**
   * Check permissions granted for access token
   */
  async checkPermissions(accessToken: string): Promise<string[]> {
    try {
      const response = await this.client.get('/me/permissions', {
        params: { access_token: accessToken },
      });
      const data = response.data?.data || [];
      return data.filter((p: any) => p.status === 'granted').map((p: any) => p.permission);
    } catch {
      return ['pages_messaging', 'pages_show_list'];
    }
  }

  /**
   * Subscribes OmniFlow webhook application to Facebook Page events
   */
  async subscribeAppToPage(pageAccessToken: string, pageId: string): Promise<boolean> {
    try {
      const response = await this.client.post(
        `/${pageId}/subscribed_apps`,
        {
          subscribed_fields: ['messages', 'messaging_postbacks', 'message_deliveries', 'message_reads'],
        },
        {
          params: { access_token: pageAccessToken },
        }
      );
      return response.data?.success === true;
    } catch {
      return false;
    }
  }

  /**
   * Cryptographically verifies incoming webhook signature from Meta (X-Hub-Signature-256)
   */
  verifyWebhookSignature(rawBody: string | Buffer, signatureHeader: string): boolean {
    if (!this.appSecret || !signatureHeader) return false;
    const [algorithm, hash] = signatureHeader.split('=');
    if (algorithm !== 'sha256' || !hash) return false;

    const expectedHash = crypto
      .createHmac('sha256', this.appSecret)
      .update(rawBody)
      .digest('hex');

    if (hash.length !== expectedHash.length) return false;
    return crypto.timingSafeEqual(Buffer.from(hash, 'utf8'), Buffer.from(expectedHash, 'utf8'));
  }

  /**
   * Send a text message to Facebook Messenger or Instagram Direct
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
   * Send rich media attachment (Image, Audio, Video, Document)
   */
  async sendMediaMessage(
    pageAccessToken: string,
    recipientId: string,
    type: 'image' | 'audio' | 'video' | 'file',
    mediaUrl: string
  ): Promise<MetaSendResponse> {
    const response = await this.client.post<MetaSendResponse>(
      '/me/messages',
      {
        recipient: { id: recipientId },
        message: {
          attachment: {
            type,
            payload: {
              url: mediaUrl,
              is_reusable: true,
            },
          },
        },
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
   * Send quick reply buttons
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
  async getUserProfile(
    pageAccessToken: string,
    psid: string
  ): Promise<{ first_name?: string; last_name?: string; name?: string; profile_pic?: string }> {
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
