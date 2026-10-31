import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreditTransactionType, PlanTier } from '@omniflow/shared';

@Injectable()
export class BillingService {
  constructor(private readonly prisma: PrismaService) {}

  async getBillingOverview(tenantId: string) {
    const [tenant, subscription, recentTransactions] = await Promise.all([
      this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { creditBalance: true, status: true, currency: true },
      }),
      this.prisma.tenantSubscription.findFirst({
        where: { tenantId, status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.aiCreditTransaction.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    if (!tenant) throw new NotFoundException('Tenant not found');

    return {
      creditBalance: tenant.creditBalance,
      tenantStatus: tenant.status,
      currency: tenant.currency,
      subscription: subscription || {
        planTier: PlanTier.STARTER,
        status: 'ACTIVE',
      },
      recentTransactions,
      packages: [
        { id: 'pack-500', credits: 500, priceBDT: 350, priceUSD: 5 },
        { id: 'pack-2000', credits: 2000, priceBDT: 1200, priceUSD: 15, popular: true },
        { id: 'pack-5000', credits: 5000, priceBDT: 2800, priceUSD: 30 },
      ],
    };
  }

  async purchaseCredits(tenantId: string, credits: number, description = 'Credit top-up') {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const newBalance = tenant.creditBalance + credits;

    return this.prisma.$transaction([
      this.prisma.tenant.update({
        where: { id: tenantId },
        data: { creditBalance: newBalance },
      }),
      this.prisma.aiCreditTransaction.create({
        data: {
          tenantId,
          amount: credits,
          type: CreditTransactionType.TOPUP_PURCHASE,
          balanceAfter: newBalance,
          description,
        },
      }),
    ]);
  }
}
