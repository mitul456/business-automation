import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';

@Controller('api/v1/billing')
@UseGuards(JwtAuthGuard, TenantGuard)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('overview')
  async getBillingOverview(@Req() req: any) {
    return this.billingService.getBillingOverview(req.tenantId);
  }

  @Post('topup')
  async topupCredits(
    @Req() req: any,
    @Body('credits') credits: number
  ) {
    return this.billingService.purchaseCredits(req.tenantId, credits || 500);
  }
}
