import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  CreditTransactionType,
  PlanTier,
  PaymentStatus,
} from '@omniflow/shared';

export interface TokenCostParams {
  provider: string;
  model: string;
  operation: 'CHAT' | 'VISION' | 'VOICE' | 'EMBEDDING';
  inputTokens?: number;
  outputTokens?: number;
  durationSeconds?: number;
}

export interface DeductCreditInput {
  tenantId: string;
  amount: number;
  type: CreditTransactionType;
  description: string;
  idempotencyKey?: string;
  adminUserId?: string;
  usageLog?: {
    provider?: string;
    model: string;
    operation: 'CHAT' | 'VISION' | 'VOICE' | 'EMBEDDING';
    inputTokens?: number;
    outputTokens?: number;
    conversationId?: string;
    messageId?: string;
    metadata?: any;
  };
}

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  // Model Pricing Matrix (USD per 1M tokens / per minute)
  private readonly PRICING_MATRIX: Record<
    string,
    { inputCostPer1M: number; outputCostPer1M: number; defaultCredits: number }
  > = {
    'gpt-4o': { inputCostPer1M: 2.5, outputCostPer1M: 10.0, defaultCredits: 1 },
    'gpt-4o-mini': { inputCostPer1M: 0.15, outputCostPer1M: 0.6, defaultCredits: 1 },
    'gpt-4o-vision': { inputCostPer1M: 5.0, outputCostPer1M: 15.0, defaultCredits: 3 },
    'whisper-1': { inputCostPer1M: 0.006, outputCostPer1M: 0.0, defaultCredits: 2 }, // $0.006 per min
    'text-embedding-3-small': { inputCostPer1M: 0.02, outputCostPer1M: 0.0, defaultCredits: 1 },
  };

  private readonly USD_TO_BDT_RATE = 120.0;
  private readonly BDT_PER_CREDIT = 0.70;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Server-Side Cost & Token Calculation
   */
  calculateAiCost(params: TokenCostParams) {
    const { model, operation, inputTokens = 0, outputTokens = 0, durationSeconds = 0 } = params;
    const rates = this.PRICING_MATRIX[model] || {
      inputCostPer1M: 2.5,
      outputCostPer1M: 10.0,
      defaultCredits: 1,
    };

    let providerCostUsd = 0;

    if (operation === 'VOICE') {
      const minutes = Math.max(durationSeconds / 60, 0.1);
      providerCostUsd = minutes * 0.006;
    } else {
      providerCostUsd =
        (inputTokens / 1_000_000) * rates.inputCostPer1M +
        (outputTokens / 1_000_000) * rates.outputCostPer1M;
    }

    const providerCostBdt = providerCostUsd * this.USD_TO_BDT_RATE;
    const creditsDeducted = rates.defaultCredits;
    const customerChargeBdt = creditsDeducted * this.BDT_PER_CREDIT;

    return {
      providerCostUsd: Number(providerCostUsd.toFixed(6)),
      providerCostBdt: Number(providerCostBdt.toFixed(4)),
      creditsDeducted,
      customerChargeBdt: Number(customerChargeBdt.toFixed(2)),
      totalTokens: inputTokens + outputTokens,
    };
  }

  /**
   * Get Comprehensive Billing Overview for Tenant
   */
  async getBillingOverview(tenantId: string) {
    const [tenant, subscription, recentTransactions, usageAggregation] = await Promise.all([
      this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: {
          id: true,
          creditBalance: true,
          lowCreditThreshold: true,
          monthlyUsageLimit: true,
          status: true,
          currency: true,
        },
      }),
      this.prisma.tenantSubscription.findFirst({
        where: { tenantId, status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.aiCreditTransaction.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 15,
      }),
      this.prisma.aiUsageLog.aggregate({
        where: { tenantId },
        _sum: {
          totalTokens: true,
          creditsDeducted: true,
          customerChargeBdt: true,
        },
        _count: { id: true },
      }),
    ]);

    if (!tenant) throw new NotFoundException('Tenant not found');

    const isLowBalance = tenant.creditBalance <= (tenant.lowCreditThreshold || 100);

    return {
      creditBalance: tenant.creditBalance,
      isLowBalance,
      lowCreditThreshold: tenant.lowCreditThreshold || 100,
      monthlyUsageLimit: tenant.monthlyUsageLimit,
      tenantStatus: tenant.status,
      currency: tenant.currency || 'BDT',
      subscription: subscription || {
        planTier: PlanTier.STARTER,
        status: 'ACTIVE',
      },
      stats: {
        totalAiCalls: usageAggregation._count.id || 0,
        totalTokensConsumed: usageAggregation._sum.totalTokens || 0,
        totalCreditsSpent: usageAggregation._sum.creditsDeducted || 0,
        totalCostBdt: Number(usageAggregation._sum.customerChargeBdt || 0),
      },
      recentTransactions,
      packages: [
        { id: 'pack-500', name: 'Starter Boost', credits: 500, priceBDT: 350, priceUSD: 4, desc: 'Great for occasional queries' },
        { id: 'pack-2000', name: 'Growth Pack', credits: 2000, priceBDT: 1200, priceUSD: 12, popular: true, desc: 'Ideal for active social stores' },
        { id: 'pack-5000', name: 'Pro Enterprise', credits: 5000, priceBDT: 2600, priceUSD: 25, desc: 'High volume campaigns & Eid seasons' },
        { id: 'pack-15000', name: 'Mega Wholesale', credits: 15000, priceBDT: 7200, priceUSD: 65, desc: 'Enterprise high-frequency operations' },
      ],
    };
  }

  /**
   * Atomic Credit Deduction with Idempotency & Financial Ledger
   */
  async deductCredits(input: DeductCreditInput) {
    const { tenantId, amount, type, description, idempotencyKey, usageLog } = input;

    // Idempotency check: if transaction with this idempotencyKey exists, return it
    if (idempotencyKey) {
      const existingTx = await this.prisma.aiCreditTransaction.findUnique({
        where: { idempotencyKey },
      });
      if (existingTx) {
        return {
          status: 'ALREADY_PROCESSED',
          transaction: existingTx,
          deducted: false,
        };
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.findUnique({
        where: { id: tenantId },
        select: { id: true, creditBalance: true, lowCreditThreshold: true },
      });
      if (!tenant) throw new NotFoundException('Tenant not found');

      if (tenant.creditBalance < amount) {
        throw new BadRequestException(
          `Insufficient AI credits. Current balance: ${tenant.creditBalance}, Required: ${amount}`
        );
      }

      const newBalance = tenant.creditBalance - amount;

      // 1. Decrement balance on tenant
      await tx.tenant.update({
        where: { id: tenantId },
        data: { creditBalance: newBalance },
      });

      // 2. Create immutable credit ledger entry
      const creditTx = await tx.aiCreditTransaction.create({
        data: {
          tenantId,
          amount: -amount,
          type,
          balanceAfter: newBalance,
          description,
          idempotencyKey: idempotencyKey || null,
          adminUserId: input.adminUserId || null,
        },
      });

      // 3. Create detailed AI usage log if parameters provided
      let aiLogRecord = null;
      if (usageLog) {
        const costCalc = this.calculateAiCost({
          provider: usageLog.provider || 'OPENAI',
          model: usageLog.model,
          operation: usageLog.operation,
          inputTokens: usageLog.inputTokens,
          outputTokens: usageLog.outputTokens,
        });

        aiLogRecord = await tx.aiUsageLog.create({
          data: {
            tenantId,
            provider: usageLog.provider || 'OPENAI',
            model: usageLog.model,
            operation: usageLog.operation,
            inputTokens: usageLog.inputTokens || 0,
            outputTokens: usageLog.outputTokens || 0,
            totalTokens: costCalc.totalTokens,
            providerCostUsd: costCalc.providerCostUsd,
            providerCostBdt: costCalc.providerCostBdt,
            creditsDeducted: amount,
            customerChargeBdt: costCalc.customerChargeBdt,
            idempotencyKey: idempotencyKey ? `usage-${idempotencyKey}` : null,
            conversationId: usageLog.conversationId || null,
            messageId: usageLog.messageId || null,
            metadata: usageLog.metadata || {},
          },
        });
      }

      const isLowBalance = newBalance <= (tenant.lowCreditThreshold || 100);

      return {
        status: 'SUCCESS',
        deducted: true,
        amountDeducted: amount,
        newBalance,
        isLowBalance,
        transaction: creditTx,
        usageLog: aiLogRecord,
      };
    });
  }

  /**
   * Credit Purchase & Top-Up (Atomic & Idempotent)
   */
  async purchaseCredits(params: {
    tenantId: string;
    credits: number;
    amountPaid?: number;
    currency?: string;
    description?: string;
    idempotencyKey?: string;
  }) {
    const { tenantId, credits, description = 'Credit top-up recharge', idempotencyKey } = params;

    if (idempotencyKey) {
      const existingTx = await this.prisma.aiCreditTransaction.findUnique({
        where: { idempotencyKey },
      });
      if (existingTx) {
        return { status: 'ALREADY_PROCESSED', transaction: existingTx };
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.findUnique({ where: { id: tenantId } });
      if (!tenant) throw new NotFoundException('Tenant not found');

      const newBalance = tenant.creditBalance + credits;

      await tx.tenant.update({
        where: { id: tenantId },
        data: { creditBalance: newBalance },
      });

      const creditTx = await tx.aiCreditTransaction.create({
        data: {
          tenantId,
          amount: credits,
          type: CreditTransactionType.TOPUP_PURCHASE,
          balanceAfter: newBalance,
          description,
          idempotencyKey: idempotencyKey || null,
        },
      });

      return {
        status: 'SUCCESS',
        addedCredits: credits,
        newBalance,
        transaction: creditTx,
      };
    });
  }

  /**
   * Refund Adjustment
   */
  async refundCredits(params: {
    tenantId: string;
    amount: number;
    reason: string;
    idempotencyKey?: string;
  }) {
    const { tenantId, amount, reason, idempotencyKey } = params;

    return this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.findUnique({ where: { id: tenantId } });
      if (!tenant) throw new NotFoundException('Tenant not found');

      const newBalance = tenant.creditBalance + amount;

      await tx.tenant.update({
        where: { id: tenantId },
        data: { creditBalance: newBalance },
      });

      const refundTx = await tx.aiCreditTransaction.create({
        data: {
          tenantId,
          amount,
          type: CreditTransactionType.REFUND,
          balanceAfter: newBalance,
          description: `Credit Refund: ${reason}`,
          idempotencyKey: idempotencyKey || null,
        },
      });

      return {
        status: 'REFUNDED',
        refundedAmount: amount,
        newBalance,
        transaction: refundTx,
      };
    });
  }

  /**
   * Admin Credit Adjustment
   */
  async adminAdjustCredits(params: {
    tenantId: string;
    amount: number;
    type: 'ADD' | 'DEDUCT';
    reason: string;
    adminUserId: string;
  }) {
    const { tenantId, amount, type, reason, adminUserId } = params;
    const signedAmount = type === 'ADD' ? Math.abs(amount) : -Math.abs(amount);

    return this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.findUnique({ where: { id: tenantId } });
      if (!tenant) throw new NotFoundException('Tenant not found');

      const newBalance = Math.max(tenant.creditBalance + signedAmount, 0);

      await tx.tenant.update({
        where: { id: tenantId },
        data: { creditBalance: newBalance },
      });

      const creditTx = await tx.aiCreditTransaction.create({
        data: {
          tenantId,
          amount: signedAmount,
          type: CreditTransactionType.ADMIN_ADJUSTMENT,
          balanceAfter: newBalance,
          description: `Super Admin Adjustment: ${reason}`,
          adminUserId,
        },
      });

      await tx.auditLog.create({
        data: {
          tenantId,
          userId: adminUserId,
          action: 'ADMIN_CREDIT_ADJUSTMENT',
          entityType: 'Tenant',
          entityId: tenantId,
          details: { amount: signedAmount, previousBalance: tenant.creditBalance, newBalance, reason },
        },
      });

      return {
        status: 'SUCCESS',
        adjustedAmount: signedAmount,
        newBalance,
        transaction: creditTx,
      };
    });
  }

  /**
   * Query Usage Ledger & Token Analytics
   */
  async getUsageLedger(
    tenantId: string,
    filters?: {
      operation?: string;
      model?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };
    if (filters?.operation) where.operation = filters.operation;
    if (filters?.model) where.model = filters.model;

    const [logs, total] = await Promise.all([
      this.prisma.aiUsageLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.aiUsageLog.count({ where }),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Balance Reconciliation
   */
  async reconcileTenantBalance(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { creditBalance: true },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const sumResult = await this.prisma.aiCreditTransaction.aggregate({
      where: { tenantId },
      _sum: { amount: true },
    });

    const calculatedSum = sumResult._sum.amount || 0;
    // Initial trial credits if applicable
    const matches = tenant.creditBalance === calculatedSum;

    return {
      currentBalance: tenant.creditBalance,
      calculatedLedgerSum: calculatedSum,
      isReconciled: matches,
      discrepancy: tenant.creditBalance - calculatedSum,
    };
  }

  // =========================================================================
  // Active Payment Methods & User Top-Up Lifecycle
  // =========================================================================

  private readonly PACKAGES: Record<
    string,
    { credits: number; priceBDT: number; priceUSD: number; name: string }
  > = {
    p1: { credits: 500, priceBDT: 350, priceUSD: 4, name: 'Starter Boost' },
    'pack-500': { credits: 500, priceBDT: 350, priceUSD: 4, name: 'Starter Boost' },
    p2: { credits: 2000, priceBDT: 1200, priceUSD: 12, name: 'Growth Pack' },
    'pack-2000': { credits: 2000, priceBDT: 1200, priceUSD: 12, name: 'Growth Pack' },
    p3: { credits: 5000, priceBDT: 2600, priceUSD: 25, name: 'Pro Enterprise' },
    'pack-5000': { credits: 5000, priceBDT: 2600, priceUSD: 25, name: 'Pro Enterprise' },
    p4: { credits: 15000, priceBDT: 7200, priceUSD: 65, name: 'Mega Wholesale' },
    'pack-15000': { credits: 15000, priceBDT: 7200, priceUSD: 65, name: 'Mega Wholesale' },
  };

  async getActivePaymentMethods() {
    let methods = await this.prisma.paymentMethodConfig.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
      select: {
        id: true,
        code: true,
        name: true,
        type: true,
        merchantNumber: true,
        instructions: true,
        logoUrl: true,
        minAmount: true,
        maxAmount: true,
        isSandbox: true,
        displayOrder: true,
      },
    });

    if (methods.length === 0) {
      // Fallback defaults
      return [
        {
          id: 'def-bkash',
          code: 'BKASH',
          name: 'bKash (Send Money / Merchant)',
          type: 'MANUAL',
          merchantNumber: '01712-345678',
          instructions: '১. bKash অ্যাপে Send Money অথবা Make Payment এ যান।\n২. নম্বর দিন: 01712-345678\n৩. রেফারেন্সে আপনার নাম লিখুন।\n৪. সফল পেমেন্টের পর TrxID এবং প্রেরক মোবাইল নম্বর সাবমিট করুন।',
          minAmount: 100,
          maxAmount: 50000,
          isSandbox: false,
          displayOrder: 1,
        },
        {
          id: 'def-nagad',
          code: 'NAGAD',
          name: 'Nagad (Send Money / Merchant)',
          type: 'MANUAL',
          merchantNumber: '01812-987654',
          instructions: '১. Nagad অ্যাপে Send Money সিলেক্ট করুন।\n২. নম্বর: 01812-987654\n৩. নির্ধারিত এমাউন্ট পাঠিয়ে প্রাপ্ত TrxID ও প্রেরকের নম্বর দিন।',
          minAmount: 100,
          maxAmount: 50000,
          isSandbox: false,
          displayOrder: 2,
        },
        {
          id: 'def-stripe',
          code: 'STRIPE',
          name: 'Credit / Debit Card (Stripe)',
          type: 'AUTOMATED',
          instructions: 'Pay instantly and securely with Visa, MasterCard, or American Express via Stripe.',
          minAmount: 300,
          maxAmount: 100000,
          isSandbox: true,
          displayOrder: 3,
        },
        {
          id: 'def-ssl',
          code: 'SSLCOMMERZ',
          name: 'SSLCommerz Gateway Aggregator',
          type: 'AUTOMATED',
          instructions: 'Pay securely via Bangladeshi Internet Banking, Cards, and Mobile Banking.',
          minAmount: 200,
          maxAmount: 100000,
          isSandbox: true,
          displayOrder: 4,
        },
      ];
    }

    return methods;
  }

  async initiateTopupRequest(params: {
    tenantId: string;
    userId: string;
    planId: string;
    paymentMethod: string;
  }) {
    const { tenantId, userId, planId, paymentMethod } = params;

    const pack = this.PACKAGES[planId] || {
      credits: 500,
      priceBDT: 350,
      priceUSD: 4,
      name: 'Starter Package',
    };

    const methodConfig = await this.prisma.paymentMethodConfig.findFirst({
      where: { code: paymentMethod.toUpperCase(), isActive: true },
    });

    const merchantNumber = methodConfig?.merchantNumber || (paymentMethod === 'BKASH' ? '01712-345678' : '01812-987654');
    const instructions = methodConfig?.instructions || 'Please complete payment and submit transaction ID.';

    const request = await this.prisma.creditTopupRequest.create({
      data: {
        tenantId,
        userId,
        planId,
        credits: pack.credits,
        amountBdt: pack.priceBDT,
        paymentMethod: paymentMethod.toUpperCase(),
        status: PaymentStatus.PENDING,
        metadata: {
          packageName: pack.name,
          priceUSD: pack.priceUSD,
        },
      },
    });

    return {
      requestId: request.id,
      planId,
      credits: pack.credits,
      amountBdt: pack.priceBDT,
      paymentMethod: paymentMethod.toUpperCase(),
      merchantNumber,
      instructions,
      type: methodConfig?.type || (paymentMethod === 'STRIPE' ? 'AUTOMATED' : 'MANUAL'),
      status: request.status,
    };
  }

  async submitTopupTrx(params: {
    tenantId: string;
    userId: string;
    requestId: string;
    customerPhone: string;
    trxId: string;
  }) {
    const { tenantId, requestId, customerPhone, trxId } = params;

    const request = await this.prisma.creditTopupRequest.findFirst({
      where: { id: requestId, tenantId },
    });

    if (!request) {
      throw new NotFoundException('Top-up request not found');
    }

    if (request.status === PaymentStatus.PAID) {
      throw new BadRequestException('This top-up request has already been verified and credited');
    }

    // Check for duplicate TrxID
    const duplicateTrx = await this.prisma.creditTopupRequest.findFirst({
      where: {
        trxId: trxId.trim(),
        id: { not: requestId },
        status: { in: [PaymentStatus.PAID, PaymentStatus.PENDING] },
      },
    });

    if (duplicateTrx) {
      throw new BadRequestException('This Transaction ID (TrxID) has already been submitted or processed');
    }

    const updated = await this.prisma.creditTopupRequest.update({
      where: { id: requestId },
      data: {
        customerPhone: customerPhone.trim(),
        trxId: trxId.trim().toUpperCase(),
        status: PaymentStatus.PENDING,
      },
    });

    return {
      status: 'PENDING_APPROVAL',
      requestId: updated.id,
      trxId: updated.trxId,
      customerPhone: updated.customerPhone,
      message: 'Transaction details submitted. Your AI credits will be activated immediately once verified.',
    };
  }

  async verifyStripeTopup(params: {
    tenantId: string;
    userId: string;
    requestId: string;
    paymentIntentId?: string;
  }) {
    const { tenantId, userId, requestId, paymentIntentId } = params;

    const request = await this.prisma.creditTopupRequest.findFirst({
      where: { id: requestId, tenantId },
    });

    if (!request) {
      throw new NotFoundException('Top-up request not found');
    }

    if (request.status === PaymentStatus.PAID) {
      const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
      return {
        status: 'SUCCESS',
        addedCredits: 0,
        newBalance: tenant?.creditBalance || 0,
        transaction: null,
        message: 'Already verified',
      };
    }

    return this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.findUnique({ where: { id: tenantId } });
      if (!tenant) throw new NotFoundException('Tenant not found');

      const newBalance = tenant.creditBalance + request.credits;

      // 1. Mark request PAID
      await tx.creditTopupRequest.update({
        where: { id: requestId },
        data: {
          status: PaymentStatus.PAID,
          approvedAt: new Date(),
          providerRef: paymentIntentId || `stripe-ch-${Date.now()}`,
          trxId: paymentIntentId || `pi_${Date.now()}`,
        },
      });

      // 2. Increment tenant credits
      await tx.tenant.update({
        where: { id: tenantId },
        data: { creditBalance: newBalance },
      });

      // 3. Immutable transaction ledger
      const idempotencyKey = `stripe-topup-${requestId}`;
      const creditTx = await tx.aiCreditTransaction.create({
        data: {
          tenantId,
          amount: request.credits,
          type: CreditTransactionType.TOPUP_PURCHASE,
          balanceAfter: newBalance,
          description: `Credit Top-Up via Stripe Card (${request.credits} credits)`,
          idempotencyKey,
          adminUserId: null,
          metadata: {
            topupRequestId: requestId,
            paymentIntentId,
            amountBdt: Number(request.amountBdt),
          },
        },
      });

      return {
        status: 'SUCCESS',
        addedCredits: request.credits,
        newBalance,
        transaction: creditTx,
      };
    });
  }

  async getTenantTopupHistory(tenantId: string) {
    return this.prisma.creditTopupRequest.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }
}
