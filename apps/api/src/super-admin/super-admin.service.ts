import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { TenantStatus, CreditTransactionType } from '@omniflow/shared';

@Injectable()
export class SuperAdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getPlatformStats() {
    const [
      totalTenants,
      activeTenants,
      totalUsers,
      ordersAgg,
      totalConversations,
      totalMessages,
    ] = await Promise.all([
      this.prisma.tenant.count(),
      this.prisma.tenant.count({ where: { status: TenantStatus.ACTIVE } }),
      this.prisma.user.count(),
      this.prisma.order.aggregate({
        where: { status: { not: 'CANCELLED' } },
        _sum: { totalAmount: true },
        _count: { id: true },
      }),
      this.prisma.conversation.count(),
      this.prisma.message.count(),
    ]);

    return {
      totalTenants,
      activeTenants,
      totalUsers,
      totalOrders: ordersAgg._count.id,
      totalGMV: Number(ordersAgg._sum.totalAmount || 0),
      totalConversations,
      totalMessages,
      systemHealth: '100% Operational',
    };
  }

  async listTenants(search?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { slug: { contains: search } },
      ];
    }

    const [tenants, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        include: {
          subscriptions: { where: { status: 'ACTIVE' }, take: 1 },
          _count: {
            select: { members: true, orders: true, conversations: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.tenant.count({ where }),
    ]);

    return {
      tenants,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateTenantStatus(tenantId: string, status: TenantStatus) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: { status },
    });
  }

  async addBonusCredits(tenantId: string, amount: number, reason: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const newBalance = tenant.creditBalance + amount;

    return this.prisma.$transaction([
      this.prisma.tenant.update({
        where: { id: tenantId },
        data: { creditBalance: newBalance },
      }),
      this.prisma.aiCreditTransaction.create({
        data: {
          tenantId,
          amount,
          type: CreditTransactionType.BONUS,
          balanceAfter: newBalance,
          description: `Super Admin Grant: ${reason || 'Promotion'}`,
        },
      }),
    ]);
  }
}
