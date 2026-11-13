import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import {
  WorkspaceRole,
  CreateOrderInput,
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  UpdateOrderStatusInput,
} from '@omniflow/shared';

@Controller('api/v1/orders')
@UseGuards(JwtAuthGuard, TenantGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  async listOrders(
    @Req() req: any,
    @Query('status') status?: OrderStatus,
    @Query('paymentStatus') paymentStatus?: PaymentStatus,
    @Query('customerId') customerId?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    return this.ordersService.listOrders({
      tenantId: req.tenantId,
      status,
      paymentStatus,
      customerId,
      search,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 25,
    });
  }

  @Get(':id')
  async getOrder(@Req() req: any, @Param('id') id: string) {
    return this.ordersService.getOrder(req.tenantId, id);
  }

  @Get(':id/invoice')
  async getInvoice(@Req() req: any, @Param('id') id: string) {
    return this.ordersService.getInvoiceData(req.tenantId, id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER, WorkspaceRole.MANAGER, WorkspaceRole.SALES_AGENT)
  async createOrder(@Req() req: any, @Body() body: CreateOrderInput) {
    return this.ordersService.createOrder(req.tenantId, body);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER, WorkspaceRole.MANAGER, WorkspaceRole.SALES_AGENT)
  async updateStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: UpdateOrderStatusInput
  ) {
    return this.ordersService.updateOrderStatus(req.tenantId, id, body);
  }

  @Post(':id/cancel')
  @UseGuards(RolesGuard)
  @Roles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER, WorkspaceRole.MANAGER)
  async cancelOrder(
    @Req() req: any,
    @Param('id') id: string,
    @Body('reason') reason?: string
  ) {
    return this.ordersService.cancelOrder(req.tenantId, id, reason);
  }

  @Patch(':id/payment')
  @UseGuards(RolesGuard)
  @Roles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER, WorkspaceRole.MANAGER)
  async updatePayment(
    @Req() req: any,
    @Param('id') id: string,
    @Body('paymentStatus') paymentStatus: PaymentStatus,
    @Body('paymentMethod') paymentMethod?: PaymentMethod
  ) {
    return this.ordersService.updatePaymentStatus(req.tenantId, id, { paymentStatus, paymentMethod });
  }
}
