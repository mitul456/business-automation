import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { ChannelsService } from './channels.service';
import { MetaGraphClient, WhatsAppCloudClient } from '@omniflow/integrations';

@Controller('api/v1/webhooks')
export class WebhooksController {
  private readonly metaClient = new MetaGraphClient();
  private readonly waClient = new WhatsAppCloudClient();

  constructor(private readonly channelsService: ChannelsService) {}

  /**
   * Meta Webhook Verification Challenge (Facebook Messenger & Instagram)
   */
  @Get('meta')
  verifyMetaWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string
  ) {
    const expectedToken = process.env.META_VERIFY_TOKEN || 'omniflow_webhook_verify_token_2026';
    if (mode === 'subscribe' && token === expectedToken) {
      return challenge;
    }
    throw new ForbiddenException('Webhook verification token mismatch');
  }

  /**
   * Meta Incoming Webhook Events (Facebook Messenger & Instagram)
   */
  @Post('meta')
  @HttpCode(HttpStatus.OK)
  async handleMetaWebhook(
    @Body() body: any,
    @Headers('x-hub-signature-256') signature: string
  ) {
    // Cryptographic signature check
    if (process.env.META_APP_SECRET && signature) {
      const isValid = this.metaClient.verifyWebhookSignature(
        JSON.stringify(body),
        signature
      );
      if (!isValid) {
        throw new ForbiddenException('Invalid Meta HMAC-SHA256 signature');
      }
    }

    await this.channelsService.processInboundMetaWebhook(body);
    return { status: 'EVENT_RECEIVED' };
  }

  /**
   * WhatsApp Cloud API Webhook Verification Challenge
   */
  @Get('whatsapp')
  verifyWhatsAppWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string
  ) {
    const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN || process.env.META_VERIFY_TOKEN || 'omniflow_webhook_verify_token_2026';
    const result = this.waClient.verifyWebhookChallenge(mode, token, challenge, expectedToken);
    if (result) {
      return result;
    }
    throw new ForbiddenException('WhatsApp webhook verification token mismatch');
  }

  /**
   * WhatsApp Cloud API Incoming Events (Messages & Delivery Statuses)
   */
  @Post('whatsapp')
  @HttpCode(HttpStatus.OK)
  async handleWhatsAppWebhook(
    @Body() body: any,
    @Headers('x-hub-signature-256') signature: string
  ) {
    const appSecret = process.env.META_APP_SECRET || '';
    if (appSecret && signature) {
      const isValid = this.waClient.verifyWebhookSignature(
        JSON.stringify(body),
        signature,
        appSecret
      );
      if (!isValid) {
        throw new ForbiddenException('Invalid WhatsApp HMAC-SHA256 signature');
      }
    }

    await this.channelsService.processInboundWhatsAppWebhook(body);
    return { status: 'EVENT_RECEIVED' };
  }
}
