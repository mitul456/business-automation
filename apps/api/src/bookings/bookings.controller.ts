import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import {
  WorkspaceRole,
  BookingStatus,
  CreateBookingServiceInput,
  CreateBookingAppointmentInput,
  RescheduleAppointmentInput,
} from '@omniflow/shared';

@Controller('api/v1/bookings')
@UseGuards(JwtAuthGuard, TenantGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get('services')
  async listServices(@Req() req: any) {
    return this.bookingsService.listServices(req.tenantId);
  }

  @Post('services')
  @UseGuards(RolesGuard)
  @Roles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER, WorkspaceRole.MANAGER)
  async createService(@Req() req: any, @Body() body: CreateBookingServiceInput) {
    return this.bookingsService.createService(req.tenantId, body);
  }

  @Put('services/:id')
  @UseGuards(RolesGuard)
  @Roles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER, WorkspaceRole.MANAGER)
  async updateService(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: Partial<CreateBookingServiceInput>
  ) {
    return this.bookingsService.updateService(req.tenantId, id, body);
  }

  @Delete('services/:id')
  @UseGuards(RolesGuard)
  @Roles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  async deleteService(@Req() req: any, @Param('id') id: string) {
    return this.bookingsService.deleteService(req.tenantId, id);
  }

  @Get('appointments')
  async listAppointments(
    @Req() req: any,
    @Query('status') status?: BookingStatus,
    @Query('customerId') customerId?: string,
    @Query('serviceId') serviceId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.bookingsService.listAppointments({
      tenantId: req.tenantId,
      status,
      customerId,
      serviceId,
      startDate,
      endDate,
    });
  }

  @Get('appointments/calendar')
  async getCalendarView(
    @Req() req: any,
    @Query('year') year?: string,
    @Query('month') month?: string
  ) {
    return this.bookingsService.getCalendarView(
      req.tenantId,
      year ? parseInt(year, 10) : undefined,
      month ? parseInt(month, 10) : undefined
    );
  }

  @Get('appointments/:id')
  async getAppointment(@Req() req: any, @Param('id') id: string) {
    return this.bookingsService.getAppointment(req.tenantId, id);
  }

  @Post('appointments')
  @UseGuards(RolesGuard)
  @Roles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER, WorkspaceRole.MANAGER, WorkspaceRole.SALES_AGENT, WorkspaceRole.SUPPORT_AGENT)
  async createAppointment(@Req() req: any, @Body() body: CreateBookingAppointmentInput) {
    return this.bookingsService.createAppointment(req.tenantId, body);
  }

  @Patch('appointments/:id/confirm')
  @UseGuards(RolesGuard)
  @Roles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER, WorkspaceRole.MANAGER, WorkspaceRole.SUPPORT_AGENT)
  async confirmAppointment(@Req() req: any, @Param('id') id: string) {
    return this.bookingsService.confirmAppointment(req.tenantId, id);
  }

  @Patch('appointments/:id/cancel')
  @UseGuards(RolesGuard)
  @Roles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER, WorkspaceRole.MANAGER, WorkspaceRole.SUPPORT_AGENT)
  async cancelAppointment(
    @Req() req: any,
    @Param('id') id: string,
    @Body('reason') reason?: string
  ) {
    return this.bookingsService.cancelAppointment(req.tenantId, id, reason);
  }

  @Patch('appointments/:id/reschedule')
  @UseGuards(RolesGuard)
  @Roles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER, WorkspaceRole.MANAGER, WorkspaceRole.SUPPORT_AGENT)
  async rescheduleAppointment(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: RescheduleAppointmentInput
  ) {
    return this.bookingsService.rescheduleAppointment(req.tenantId, id, body);
  }
}
