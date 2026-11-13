import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  LeadStage,
  CreateCustomerInput,
  UpdateCustomerInput,
  CreateFollowUpInput,
  UpdateFollowUpInput,
} from '@omniflow/shared';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async listCustomers(params: {
    tenantId: string;
    leadStage?: LeadStage;
    search?: string;
    tag?: string;
    page?: number;
    limit?: number;
  }) {
    const { tenantId, leadStage, search, tag, page = 1, limit = 25 } = params;
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
          _count: { select: { orders: true, conversations: true, followUps: true } },
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
        orders: { orderBy: { createdAt: 'desc' }, take: 20 },
        conversations: { orderBy: { createdAt: 'desc' }, take: 10 },
        timelineEvents: { orderBy: { createdAt: 'desc' }, take: 30 },
        followUps: { orderBy: { dueDate: 'asc' } },
      },
    });

    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async createCustomer(tenantId: string, input: CreateCustomerInput) {
    const customer = await this.prisma.customer.create({
      data: {
        tenantId,
        name: input.name,
        email: input.email,
        phone: input.phone,
        avatarUrl: input.avatarUrl,
        city: input.city,
        district: input.district,
        address: input.address,
        leadStage: input.leadStage || LeadStage.NEW,
        tags: (input.tags as any) || [],
        notes: input.notes,
      },
    });

    // Log timeline event
    await this.prisma.customerTimelineEvent.create({
      data: {
        tenantId,
        customerId: customer.id,
        eventType: 'CUSTOMER_CREATED',
        title: 'Customer Profile Created',
        description: `Customer added via CRM`,
      },
    });

    return customer;
  }

  async updateCustomer(tenantId: string, customerId: string, data: UpdateCustomerInput) {
    await this.getCustomer(tenantId, customerId);

    const updated = await this.prisma.customer.update({
      where: { id: customerId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.city !== undefined && { city: data.city }),
        ...(data.district !== undefined && { district: data.district }),
        ...(data.leadStage && { leadStage: data.leadStage }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.tags && { tags: data.tags as any }),
      },
    });

    return updated;
  }

  async deleteCustomer(tenantId: string, customerId: string) {
    await this.getCustomer(tenantId, customerId);
    return this.prisma.customer.delete({
      where: { id: customerId },
    });
  }

  // -------------------------------------------------------------
  // CRM Segmentation & Analytics
  // -------------------------------------------------------------
  async getCustomerSegments(tenantId: string) {
    const [totalCustomers, vipCount, regularCount, leadsCount, stageGroups] = await Promise.all([
      this.prisma.customer.count({ where: { tenantId } }),
      this.prisma.customer.count({
        where: { tenantId, OR: [{ totalSpent: { gte: 10000 } }, { totalOrders: { gte: 3 } }] },
      }),
      this.prisma.customer.count({
        where: { tenantId, totalOrders: { in: [1, 2] } },
      }),
      this.prisma.customer.count({
        where: { tenantId, totalOrders: 0 },
      }),
      this.prisma.customer.groupBy({
        by: ['leadStage'],
        where: { tenantId },
        _count: true,
      }),
    ]);

    const stages = stageGroups.reduce((acc, curr) => {
      acc[curr.leadStage] = curr._count;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalCustomers,
      segments: {
        vip: vipCount,
        regular: regularCount,
        leads: leadsCount,
      },
      stages,
    };
  }

  // -------------------------------------------------------------
  // Lead Management & Kanban Pipeline
  // -------------------------------------------------------------
  async listLeadsKanban(tenantId: string) {
    const allLeads = await this.prisma.customer.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatarUrl: true,
        leadStage: true,
        leadScore: true,
        totalOrders: true,
        totalSpent: true,
        notes: true,
        tags: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    const kanban: Record<LeadStage, typeof allLeads> = {
      [LeadStage.NEW]: [],
      [LeadStage.CONTACTED]: [],
      [LeadStage.QUALIFIED]: [],
      [LeadStage.PROPOSAL_SENT]: [],
      [LeadStage.WON]: [],
      [LeadStage.LOST]: [],
    };

    for (const lead of allLeads) {
      if (kanban[lead.leadStage]) {
        kanban[lead.leadStage].push(lead);
      }
    }

    return kanban;
  }

  async updateLeadStage(tenantId: string, customerId: string, newStage: LeadStage) {
    const customer = await this.getCustomer(tenantId, customerId);

    const updated = await this.prisma.customer.update({
      where: { id: customer.id },
      data: { leadStage: newStage },
    });

    await this.prisma.customerTimelineEvent.create({
      data: {
        tenantId,
        customerId,
        eventType: 'STAGE_CHANGED',
        title: `Lead Stage Changed to ${newStage}`,
        description: `Previous stage was ${customer.leadStage}`,
        metadata: { from: customer.leadStage, to: newStage },
      },
    });

    return updated;
  }

  async updateLeadScore(tenantId: string, customerId: string, score: number) {
    await this.getCustomer(tenantId, customerId);

    return this.prisma.customer.update({
      where: { id: customerId },
      data: { leadScore: Math.min(100, Math.max(0, score)) },
    });
  }

  async assignLead(tenantId: string, customerId: string, assignedMemberId?: string) {
    await this.getCustomer(tenantId, customerId);

    return this.prisma.customer.update({
      where: { id: customerId },
      data: { assignedMemberId },
    });
  }

  // -------------------------------------------------------------
  // Follow-Up Management
  // -------------------------------------------------------------
  async createFollowUp(tenantId: string, input: CreateFollowUpInput) {
    await this.getCustomer(tenantId, input.customerId);

    return this.prisma.followUp.create({
      data: {
        tenantId,
        customerId: input.customerId,
        title: input.title,
        dueDate: new Date(input.dueDate),
        notes: input.notes,
        assignedMemberId: input.assignedMemberId,
      },
      include: { customer: true },
    });
  }

  async listFollowUps(tenantId: string, customerId?: string, isCompleted?: boolean) {
    const where: any = { tenantId };
    if (customerId) where.customerId = customerId;
    if (isCompleted !== undefined) where.isCompleted = isCompleted;

    return this.prisma.followUp.findMany({
      where,
      include: { customer: { select: { id: true, name: true, phone: true } } },
      orderBy: { dueDate: 'asc' },
    });
  }

  async updateFollowUp(tenantId: string, followUpId: string, input: UpdateFollowUpInput) {
    const followUp = await this.prisma.followUp.findFirst({
      where: { id: followUpId, tenantId },
    });

    if (!followUp) throw new NotFoundException('Follow-up task not found');

    return this.prisma.followUp.update({
      where: { id: followUpId },
      data: {
        ...(input.isCompleted !== undefined && {
          isCompleted: input.isCompleted,
          completedAt: input.isCompleted ? new Date() : null,
        }),
        ...(input.notes !== undefined && { notes: input.notes }),
        ...(input.dueDate && { dueDate: new Date(input.dueDate) }),
      },
    });
  }
}
