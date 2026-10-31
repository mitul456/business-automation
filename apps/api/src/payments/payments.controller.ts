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
import { WorkspaceRole, PaymentIntegrationInput } from '@omniflow/shared';

@Controller('api/v1/payments')
@UseGuards(JwtAuthGuard, TenantGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('integrations')
  async listIntegrations(@Req() req: any) {
    return this.paymentsService.listIntegrations(req.tenantId);
  }

  @Post('integrations')
  @UseGuards(RolesGuard)
  @Roles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  async saveIntegration(@Req() req: any, @Body() body: PaymentIntegrationInput) {
    return this.paymentsService.saveIntegration(req.tenantId, body);
  }

  @Post('bkash/create/:orderId')
  async createBkashPayment(
    @Req() req: any,
    @Param('orderId') orderId: string,
    @Body('callbackUrl') callbackUrl: string
  ) {
    return this.paymentsService.createBkashPayment(req.tenantId, orderId, callbackUrl);
  }

  @Post('bkash/execute/:orderId')
  async executeBkashPayment(
    @Req() req: any,
    @Param('orderId') orderId: string,
    @Body('paymentID') paymentID: string
  ) {
    return this.paymentsService.executeBkashPayment(req.tenantId, orderId, paymentID);
  }

  @Post('stripe/checkout/:orderId')
  async createStripeSession(
    @Req() req: any,
    @Param('orderId') orderId: string,
    @Body() body: { successUrl: string; cancelUrl: string }
  ) {
    return this.paymentsService.createStripeSession(
      req.tenantId,
      orderId,
      body.successUrl,
      body.cancelUrl
    );
  }
}
