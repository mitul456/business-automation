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
import {
  CreateOrderInput,
  OrderStatus,
  PaymentStatus,
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
  async createOrder(@Req() req: any, @Body() body: CreateOrderInput) {
    return this.ordersService.createOrder(req.tenantId, body);
  }

  @Patch(':id/status')
  async updateStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: UpdateOrderStatusInput
  ) {
    return this.ordersService.updateOrderStatus(req.tenantId, id, body);
  }
}
