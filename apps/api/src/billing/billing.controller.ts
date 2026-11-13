import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { WorkspaceRole, CreditTransactionType } from '@omniflow/shared';

@Controller('api/v1/billing')
@UseGuards(JwtAuthGuard, TenantGuard)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('overview')
  async getBillingOverview(@Req() req: any) {
    return this.billingService.getBillingOverview(req.tenantId);
  }

  @Get('ledger')
  async getUsageLedger(
    @Req() req: any,
    @Query('operation') operation?: string,
    @Query('model') model?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    return this.billingService.getUsageLedger(req.tenantId, {
      operation,
      model,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Get('reconcile')
  @UseGuards(RolesGuard)
  @Roles(WorkspaceRole.OWNER, WorkspaceRole.ADMIN)
  async reconcileBalance(@Req() req: any) {
    return this.billingService.reconcileTenantBalance(req.tenantId);
  }

  @Post('topup')
  async topupCredits(
    @Req() req: any,
    @Body()
    body: {
      credits: number;
      amountPaid?: number;
      currency?: string;
      description?: string;
      idempotencyKey?: string;
    }
  ) {
    return this.billingService.purchaseCredits({
      tenantId: req.tenantId,
      credits: body.credits || 500,
      amountPaid: body.amountPaid,
      currency: body.currency,
      description: body.description || 'Credit top-up recharge',
      idempotencyKey: body.idempotencyKey,
    });
  }

  @Post('deduct')
  async deductCredits(
    @Req() req: any,
    @Body()
    body: {
      amount: number;
      type: CreditTransactionType;
      description: string;
      idempotencyKey?: string;
      usageLog?: any;
    }
  ) {
    return this.billingService.deductCredits({
      tenantId: req.tenantId,
      amount: body.amount,
      type: body.type || CreditTransactionType.USAGE_CHAT,
      description: body.description,
      idempotencyKey: body.idempotencyKey,
      usageLog: body.usageLog,
    });
  }

  @Post('refund')
  @UseGuards(RolesGuard)
  @Roles(WorkspaceRole.OWNER, WorkspaceRole.ADMIN)
  async refundCredits(
    @Req() req: any,
    @Body()
    body: {
      amount: number;
      reason: string;
      idempotencyKey?: string;
    }
  ) {
    return this.billingService.refundCredits({
      tenantId: req.tenantId,
      amount: body.amount,
      reason: body.reason,
      idempotencyKey: body.idempotencyKey,
    });
  }

  // Active Payment Methods for Top-Up
  @Get('payment-methods')
  async getPaymentMethods() {
    return this.billingService.getActivePaymentMethods();
  }

  // Initiate Real Top-Up Request
  @Post('topup/initiate')
  async initiateTopup(
    @Req() req: any,
    @Body() body: { planId: string; paymentMethod: string }
  ) {
    return this.billingService.initiateTopupRequest({
      tenantId: req.tenantId,
      userId: req.user?.id,
      planId: body.planId,
      paymentMethod: body.paymentMethod,
    });
  }

  // Submit TrxID & Customer Phone for Manual bKash/Nagad
  @Post('topup/submit-trx')
  async submitTopupTrx(
    @Req() req: any,
    @Body() body: { requestId: string; customerPhone: string; trxId: string }
  ) {
    return this.billingService.submitTopupTrx({
      tenantId: req.tenantId,
      userId: req.user?.id,
      requestId: body.requestId,
      customerPhone: body.customerPhone,
      trxId: body.trxId,
    });
  }

  // Verify Stripe Automated Top-Up
  @Post('topup/verify-stripe')
  async verifyStripeTopup(
    @Req() req: any,
    @Body() body: { requestId: string; paymentIntentId?: string }
  ) {
    return this.billingService.verifyStripeTopup({
      tenantId: req.tenantId,
      userId: req.user?.id,
      requestId: body.requestId,
      paymentIntentId: body.paymentIntentId,
    });
  }

  // Top-Up Request History
  @Get('topup/history')
  async getTopupHistory(@Req() req: any) {
    return this.billingService.getTenantTopupHistory(req.tenantId);
  }
}
