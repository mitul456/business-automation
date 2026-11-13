import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  BookingStatus,
  CreateBookingServiceInput,
  CreateBookingAppointmentInput,
  RescheduleAppointmentInput,
} from '@omniflow/shared';

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  // -------------------------------------------------------------
  // Service Catalog
  // -------------------------------------------------------------
  async listServices(tenantId: string) {
    return this.prisma.bookingService.findMany({
      where: { tenantId, isActive: true },
      include: { _count: { select: { appointments: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async createService(tenantId: string, data: CreateBookingServiceInput) {
    return this.prisma.bookingService.create({
      data: {
        tenantId,
        name: data.name,
        description: data.description,
        durationMinutes: data.durationMinutes || 30,
        price: data.price || 0,
        isActive: true,
      },
    });
  }

  async updateService(
    tenantId: string,
    serviceId: string,
    data: Partial<CreateBookingServiceInput> & { isActive?: boolean }
  ) {
    const service = await this.prisma.bookingService.findFirst({
      where: { id: serviceId, tenantId },
    });
    if (!service) throw new NotFoundException('Service not found');

    return this.prisma.bookingService.update({
      where: { id: serviceId },
      data,
    });
  }

  async deleteService(tenantId: string, serviceId: string) {
    const service = await this.prisma.bookingService.findFirst({
      where: { id: serviceId, tenantId },
    });
    if (!service) throw new NotFoundException('Service not found');

    return this.prisma.bookingService.update({
      where: { id: serviceId },
      data: { isActive: false },
    });
  }

  // -------------------------------------------------------------
  // Appointment Lifecycle
  // -------------------------------------------------------------
  async listAppointments(params: {
    tenantId: string;
    status?: BookingStatus;
    customerId?: string;
    serviceId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const { tenantId, status, customerId, serviceId, startDate, endDate } = params;

    const where: any = { tenantId };
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    if (serviceId) where.serviceId = serviceId;
    if (startDate || endDate) {
      where.scheduledStartTime = {};
      if (startDate) where.scheduledStartTime.gte = new Date(startDate);
      if (endDate) where.scheduledStartTime.lte = new Date(endDate);
    }

    return this.prisma.bookingAppointment.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, phone: true, email: true } },
        service: true,
      },
      orderBy: { scheduledStartTime: 'asc' },
    });
  }

  async getAppointment(tenantId: string, id: string) {
    const appt = await this.prisma.bookingAppointment.findFirst({
      where: { id, tenantId },
      include: {
        customer: true,
        service: true,
        conversation: true,
      },
    });
    if (!appt) throw new NotFoundException('Appointment not found');
    return appt;
  }

  async createAppointment(tenantId: string, data: CreateBookingAppointmentInput) {
    const startTime = new Date(data.scheduledStartTime);
    const endTime = new Date(data.scheduledEndTime);

    if (endTime <= startTime) {
      throw new BadRequestException('Scheduled end time must be after start time');
    }

    // Verify service exists
    const service = await this.prisma.bookingService.findFirst({
      where: { id: data.serviceId, tenantId },
    });
    if (!service) throw new NotFoundException('Selected service not found');

    // Check for conflicting overlap in same service
    const overlap = await this.prisma.bookingAppointment.findFirst({
      where: {
        tenantId,
        serviceId: data.serviceId,
        status: { in: [BookingStatus.CONFIRMED, BookingStatus.PENDING] },
        AND: [
          { scheduledStartTime: { lt: endTime } },
          { scheduledEndTime: { gt: startTime } },
        ],
      },
    });

    if (overlap) {
      throw new ConflictException('This time slot is already booked. Please choose another time.');
    }

    const appt = await this.prisma.bookingAppointment.create({
      data: {
        tenantId,
        serviceId: data.serviceId,
        customerId: data.customerId,
        conversationId: data.conversationId,
        scheduledStartTime: startTime,
        scheduledEndTime: endTime,
        status: BookingStatus.CONFIRMED,
        customerNotes: data.customerNotes,
      },
      include: { customer: true, service: true },
    });

    // Log timeline event for customer
    await this.prisma.customerTimelineEvent.create({
      data: {
        tenantId,
        customerId: data.customerId,
        eventType: 'APPOINTMENT_BOOKED',
        title: `Booked ${service.name}`,
        description: `Scheduled for ${startTime.toLocaleString()}`,
        metadata: { appointmentId: appt.id, serviceName: service.name },
      },
    });

    return appt;
  }

  async confirmAppointment(tenantId: string, id: string) {
    const appt = await this.getAppointment(tenantId, id);
    return this.prisma.bookingAppointment.update({
      where: { id: appt.id },
      data: { status: BookingStatus.CONFIRMED },
      include: { customer: true, service: true },
    });
  }

  async cancelAppointment(tenantId: string, id: string, reason?: string) {
    const appt = await this.getAppointment(tenantId, id);

    return this.prisma.bookingAppointment.update({
      where: { id: appt.id },
      data: {
        status: BookingStatus.CANCELLED,
        customerNotes: reason ? `${appt.customerNotes ? appt.customerNotes + '\n' : ''}Cancellation: ${reason}` : appt.customerNotes,
      },
      include: { customer: true, service: true },
    });
  }

  async rescheduleAppointment(tenantId: string, id: string, data: RescheduleAppointmentInput) {
    const appt = await this.getAppointment(tenantId, id);
    const newStart = new Date(data.scheduledStartTime);
    const newEnd = new Date(data.scheduledEndTime);

    if (newEnd <= newStart) {
      throw new BadRequestException('End time must be after start time');
    }

    return this.prisma.bookingAppointment.update({
      where: { id: appt.id },
      data: {
        scheduledStartTime: newStart,
        scheduledEndTime: newEnd,
        status: BookingStatus.CONFIRMED,
      },
      include: { customer: true, service: true },
    });
  }

  async getCalendarView(tenantId: string, year?: number, month?: number) {
    const targetYear = year || new Date().getFullYear();
    const targetMonth = month || new Date().getMonth() + 1;

    const startOfMonth = new Date(targetYear, targetMonth - 1, 1);
    const endOfMonth = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    const appointments = await this.prisma.bookingAppointment.findMany({
      where: {
        tenantId,
        scheduledStartTime: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        service: { select: { id: true, name: true, durationMinutes: true, price: true } },
      },
      orderBy: { scheduledStartTime: 'asc' },
    });

    return {
      year: targetYear,
      month: targetMonth,
      totalAppointments: appointments.length,
      appointments,
    };
  }
}
