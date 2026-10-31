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
import { MetaGraphClient } from '@omniflow/integrations';

@Controller('api/v1/webhooks')
export class WebhooksController {
  private readonly metaClient = new MetaGraphClient();

  constructor(private readonly channelsService: ChannelsService) {}

  /**
   * Meta Webhook Verification challenge
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
   * Meta Incoming Events (Facebook Messenger & Instagram)
   */
  @Post('meta')
  @HttpCode(HttpStatus.OK)
  async handleMetaWebhook(
    @Body() body: any,
    @Headers('x-hub-signature-256') signature: string
  ) {
    // If secret is set, verify cryptographic signature
    if (process.env.META_APP_SECRET && signature) {
      const isValid = this.metaClient.verifyWebhookSignature(
        JSON.stringify(body),
        signature
      );
      if (!isValid) {
        throw new ForbiddenException('Invalid signature');
      }
    }

    await this.channelsService.processInboundMetaWebhook(body);
    return { status: 'EVENT_RECEIVED' };
  }
}
