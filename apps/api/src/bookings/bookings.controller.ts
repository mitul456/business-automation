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
import { BookingsService } from './bookings.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { BookingStatus } from '@omniflow/shared';

@Controller('api/v1/bookings')
@UseGuards(JwtAuthGuard, TenantGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get('services')
  async listServices(@Req() req: any) {
    return this.bookingsService.listServices(req.tenantId);
  }

  @Post('services')
  async createService(
    @Req() req: any,
    @Body()
    body: {
      name: string;
      description?: string;
      durationMinutes: number;
      price: number;
    }
  ) {
    return this.bookingsService.createService(req.tenantId, body);
  }

  @Get('appointments')
  async listAppointments(
    @Req() req: any,
    @Query('status') status?: BookingStatus
  ) {
    return this.bookingsService.listAppointments(req.tenantId, status);
  }

  @Post('appointments')
  async createAppointment(
    @Req() req: any,
    @Body()
    body: {
      serviceId: string;
      customerId: string;
      conversationId?: string;
      scheduledStartTime: string;
      scheduledEndTime: string;
      customerNotes?: string;
    }
  ) {
    return this.bookingsService.createAppointment(req.tenantId, body);
  }

  @Patch('appointments/:id/status')
  async updateStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body('status') status: BookingStatus
  ) {
    return this.bookingsService.updateAppointmentStatus(req.tenantId, id, status);
  }
}
