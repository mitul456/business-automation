import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { CustomersService } from './customers.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { LeadStage } from '@omniflow/shared';

@Controller('api/v1/customers')
@UseGuards(JwtAuthGuard, TenantGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  async listCustomers(
    @Req() req: any,
    @Query('leadStage') leadStage?: LeadStage,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    return this.customersService.listCustomers({
      tenantId: req.tenantId,
      leadStage,
      search,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 25,
    });
  }

  @Get(':id')
  async getCustomer(@Req() req: any, @Param('id') id: string) {
    return this.customersService.getCustomer(req.tenantId, id);
  }

  @Patch(':id')
  async updateCustomer(
    @Req() req: any,
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      email?: string;
      phone?: string;
      address?: string;
      city?: string;
      leadStage?: LeadStage;
      notes?: string;
      tags?: string[];
    }
  ) {
    return this.customersService.updateCustomer(req.tenantId, id, body);
  }
}
