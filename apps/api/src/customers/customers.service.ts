import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { LeadStage } from '@omniflow/shared';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async listCustomers(params: {
    tenantId: string;
    leadStage?: LeadStage;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { tenantId, leadStage, search, page = 1, limit = 25 } = params;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };
    if (leadStage) where.leadStage = leadStage;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } },
        { city: { contains: search } },
      ];
    }

    const [customers, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        include: {
          _count: { select: { orders: true, conversations: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.customer.count({ where }),
    ]);

    return {
      customers,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getCustomer(tenantId: string, customerId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, tenantId },
      include: {
        orders: { orderBy: { createdAt: 'desc' } },
        conversations: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async updateCustomer(
    tenantId: string,
    customerId: string,
    data: {
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
    await this.getCustomer(tenantId, customerId);

    return this.prisma.customer.update({
      where: { id: customerId },
      data: {
        ...data,
        tags: data.tags ? (data.tags as any) : undefined,
      },
    });
  }
}
