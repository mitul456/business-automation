import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { WorkspaceRole, PaymentIntegrationInput, PaymentProvider } from '@omniflow/shared';

@Controller('api/v1/payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('integrations')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async listIntegrations(@Req() req: any) {
    return this.paymentsService.listIntegrations(req.tenantId);
  }

  @Post('integrations')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  async saveIntegration(@Req() req: any, @Body() body: PaymentIntegrationInput) {
    return this.paymentsService.saveIntegration(req.tenantId, body);
  }

  @Post('initiate')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async initiatePayment(
    @Req() req: any,
    @Body()
    body: {
      orderId: string;
      provider: PaymentProvider;
      callbackUrl: string;
      cancelUrl?: string;
    }
  ) {
    return this.paymentsService.initiatePayment({
      tenantId: req.tenantId,
      orderId: body.orderId,
      provider: body.provider,
      callbackUrl: body.callbackUrl,
      cancelUrl: body.cancelUrl,
    });
  }

  @Post('verify')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async verifyPayment(
    @Req() req: any,
    @Body()
    body: {
      orderId: string;
      provider: PaymentProvider;
      verificationId: string;
    }
  ) {
    return this.paymentsService.verifyPayment({
      tenantId: req.tenantId,
      orderId: body.orderId,
      provider: body.provider,
      verificationId: body.verificationId,
    });
  }

  @Post('refund')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  async refundPayment(
    @Req() req: any,
    @Body()
    body: {
      orderId: string;
      transactionId: string;
      refundAmount: number;
      reason: string;
    }
  ) {
    return this.paymentsService.refundPayment({
      tenantId: req.tenantId,
      orderId: body.orderId,
      transactionId: body.transactionId,
      refundAmount: body.refundAmount,
      reason: body.reason,
    });
  }

  @Post('bkash/create/:orderId')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async createBkashPayment(
    @Req() req: any,
    @Param('orderId') orderId: string,
    @Body('callbackUrl') callbackUrl: string
  ) {
    return this.paymentsService.initiatePayment({
      tenantId: req.tenantId,
      orderId,
      provider: PaymentProvider.BKASH,
      callbackUrl: callbackUrl || 'https://omniflow.app/payments/callback/bkash',
    });
  }

  @Post('bkash/execute/:orderId')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async executeBkashPayment(
    @Req() req: any,
    @Param('orderId') orderId: string,
    @Body('paymentID') paymentID: string
  ) {
    return this.paymentsService.verifyPayment({
      tenantId: req.tenantId,
      orderId,
      provider: PaymentProvider.BKASH,
      verificationId: paymentID,
    });
  }

  @Post('stripe/checkout/:orderId')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async createStripeSession(
    @Req() req: any,
    @Param('orderId') orderId: string,
    @Body() body: { successUrl: string; cancelUrl: string }
  ) {
    return this.paymentsService.initiatePayment({
      tenantId: req.tenantId,
      orderId,
      provider: PaymentProvider.STRIPE,
      callbackUrl: body.successUrl,
      cancelUrl: body.cancelUrl,
    });
  }

  /**
   * Webhook / IPN Callback from payment gateways
   */
  @Post('callback/:provider')
  async handleCallback(
    @Param('provider') provider: string,
    @Body() payload: any
  ) {
    // Gateway IPN processing
    return { status: 'RECEIVED', provider, payloadReceived: true };
  }
}
