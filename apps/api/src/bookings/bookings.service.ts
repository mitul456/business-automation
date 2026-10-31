import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { BookingStatus } from '@omniflow/shared';

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  async listServices(tenantId: string) {
    return this.prisma.bookingService.findMany({
      where: { tenantId, isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async createService(tenantId: string, data: { name: string; description?: string; durationMinutes: number; price: number }) {
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

  async listAppointments(tenantId: string, status?: BookingStatus) {
    const where: any = { tenantId };
    if (status) where.status = status;

    return this.prisma.bookingAppointment.findMany({
      where,
      include: {
        customer: true,
        service: true,
      },
      orderBy: { scheduledStartTime: 'asc' },
    });
  }

  async createAppointment(tenantId: string, data: {
    serviceId: string;
    customerId: string;
    conversationId?: string;
    scheduledStartTime: string;
    scheduledEndTime: string;
    customerNotes?: string;
  }) {
    return this.prisma.bookingAppointment.create({
      data: {
        tenantId,
        serviceId: data.serviceId,
        customerId: data.customerId,
        conversationId: data.conversationId,
        scheduledStartTime: new Date(data.scheduledStartTime),
        scheduledEndTime: new Date(data.scheduledEndTime),
        status: BookingStatus.CONFIRMED,
        customerNotes: data.customerNotes,
      },
      include: { customer: true, service: true },
    });
  }

  async updateAppointmentStatus(tenantId: string, id: string, status: BookingStatus) {
    const appt = await this.prisma.bookingAppointment.findFirst({
      where: { id, tenantId },
    });
    if (!appt) throw new NotFoundException('Appointment not found');

    return this.prisma.bookingAppointment.update({
      where: { id },
      data: { status },
    });
  }
}
