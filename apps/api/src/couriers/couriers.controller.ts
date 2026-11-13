import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { CouriersService } from './couriers.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { WorkspaceRole, CourierSettingInput, CourierProvider } from '@omniflow/shared';

@Controller('api/v1/couriers')
@UseGuards(JwtAuthGuard, TenantGuard)
export class CouriersController {
  constructor(private readonly couriersService: CouriersService) {}

  @Get('settings')
  async getSettings(@Req() req: any) {
    return this.couriersService.getSettings(req.tenantId);
  }

  @Post('settings')
  @UseGuards(RolesGuard)
  @Roles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  async saveSetting(@Req() req: any, @Body() body: CourierSettingInput) {
    return this.couriersService.saveCourierSetting(req.tenantId, body);
  }

  @Post('dispatch')
  @UseGuards(RolesGuard)
  @Roles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER, WorkspaceRole.MANAGER)
  async dispatchShipment(
    @Req() req: any,
    @Body() body: { orderId: string; provider?: CourierProvider }
  ) {
    return this.couriersService.createShipment(
      req.tenantId,
      body.orderId,
      body.provider || CourierProvider.STEADFAST
    );
  }

  @Post('dispatch/steadfast/:orderId')
  async dispatchSteadfast(@Req() req: any, @Param('orderId') orderId: string) {
    return this.couriersService.dispatchToSteadfast(req.tenantId, orderId);
  }

  @Post('dispatch/pathao/:orderId')
  async dispatchPathao(@Req() req: any, @Param('orderId') orderId: string) {
    return this.couriersService.dispatchToPathao(req.tenantId, orderId);
  }

  @Get('track/:provider/:trackingId')
  async trackShipment(
    @Req() req: any,
    @Param('provider') provider: CourierProvider,
    @Param('trackingId') trackingId: string
  ) {
    return this.couriersService.trackParcel(req.tenantId, trackingId, provider);
  }

  @Get('track/steadfast/:consignmentId')
  async trackSteadfastParcel(@Req() req: any, @Param('consignmentId') consignmentId: string) {
    return this.couriersService.trackParcel(req.tenantId, consignmentId, CourierProvider.STEADFAST);
  }

  @Post('sync')
  async syncDeliveryStatuses(@Req() req: any) {
    return this.couriersService.syncDeliveryStatuses(req.tenantId);
  }

  @Get('balance/steadfast')
  async getBalance(@Req() req: any) {
    return this.couriersService.getSteadfastBalance(req.tenantId);
  }
}
