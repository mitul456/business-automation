import { BillingService } from '../src/billing/billing.service';
import { SuperAdminService } from '../src/super-admin/super-admin.service';
import { SuperAdminGuard } from '../src/common/guards/super-admin.guard';
import {
  CreditTransactionType,
  TenantStatus,
  UserStatus,
} from '@omniflow/shared';
import { ForbiddenException, BadRequestException } from '@nestjs/common';

describe('Phase 10-11: Billing Infrastructure, Credit Wallet & Super-Admin', () => {
  let billingService: BillingService;
  let superAdminService: SuperAdminService;
  let superAdminGuard: SuperAdminGuard;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      tenant: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
      },
      tenantSubscription: {
        findFirst: jest.fn(),
      },
      aiCreditTransaction: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'tx-1', ...data })),
        aggregate: jest.fn(),
      },
      aiUsageLog: {
        findMany: jest.fn(),
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'usage-1', ...data })),
        count: jest.fn(),
        aggregate: jest.fn().mockResolvedValue({
          _sum: { totalTokens: 50000, providerCostUsd: 0.15, customerChargeBdt: 15.0, creditsDeducted: 25 },
          _count: { id: 25 },
        }),
      },
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn().mockResolvedValue(120),
        update: jest.fn(),
      },
      userSession: {
        updateMany: jest.fn().mockResolvedValue({ count: 3 }),
      },
      order: {
        aggregate: jest.fn().mockResolvedValue({
          _sum: { totalAmount: 450000 },
          _count: { id: 85 },
        }),
      },
      conversation: {
        count: jest.fn().mockResolvedValue(450),
      },
      message: {
        count: jest.fn().mockResolvedValue(2800),
      },
      paymentTransaction: {
        findMany: jest.fn(),
        count: jest.fn().mockResolvedValue(40),
      },
      platformSetting: {
        findMany: jest.fn().mockResolvedValue([]),
        upsert: jest.fn().mockImplementation(({ update, create }) =>
          Promise.resolve({ id: 'ps-1', ...update, ...create })
        ),
      },
      auditLog: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(15),
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'aud-1', ...data })),
      },
      $transaction: jest.fn(async (arg) => {
        if (typeof arg === 'function') {
          return arg(mockPrisma);
        }
        return Promise.all(arg);
      }),
    };

    billingService = new BillingService(mockPrisma);
    superAdminService = new SuperAdminService(mockPrisma);
    superAdminGuard = new SuperAdminGuard();
  });

  describe('1. Credit Calculation & Unit Economics', () => {
    it('should compute exact GPT-4o chat token pricing and credit cost', () => {
      const cost = billingService.calculateAiCost({
        provider: 'OPENAI',
        model: 'gpt-4o',
        operation: 'CHAT',
        inputTokens: 1000,
        outputTokens: 500,
      });

      expect(cost.creditsDeducted).toBe(1);
      expect(cost.totalTokens).toBe(1500);
      expect(cost.providerCostUsd).toBeGreaterThan(0);
      expect(cost.customerChargeBdt).toBe(0.70);
    });

    it('should compute vision photo match credit cost with higher unit multiplier', () => {
      const cost = billingService.calculateAiCost({
        provider: 'OPENAI',
        model: 'gpt-4o-vision',
        operation: 'VISION',
        inputTokens: 1500,
        outputTokens: 200,
      });

      expect(cost.creditsDeducted).toBe(3);
      expect(cost.customerChargeBdt).toBe(2.10);
    });

    it('should compute Whisper audio transcription costs based on duration', () => {
      const cost = billingService.calculateAiCost({
        provider: 'OPENAI',
        model: 'whisper-1',
        operation: 'VOICE',
        durationSeconds: 60, // 1 minute
      });

      expect(cost.creditsDeducted).toBe(2);
      expect(cost.providerCostUsd).toBe(0.006);
    });
  });

  describe('2. Atomic Deductions & Idempotency Safeguards', () => {
    it('should deduct credits atomically and log detailed usage', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        id: 'tenant-1',
        creditBalance: 500,
        lowCreditThreshold: 100,
      });

      const result: any = await billingService.deductCredits({
        tenantId: 'tenant-1',
        amount: 3,
        type: CreditTransactionType.USAGE_VISION,
        description: 'Customer product image search',
        idempotencyKey: 'idemp-deduct-101',
        usageLog: {
          model: 'gpt-4o-vision',
          operation: 'VISION',
          inputTokens: 1000,
          outputTokens: 200,
        },
      });

      expect(result.status).toBe('SUCCESS');
      expect(result.deducted).toBe(true);
      expect(result.newBalance).toBe(497);
      expect(result.isLowBalance).toBe(false);

      expect(mockPrisma.tenant.update).toHaveBeenCalledWith({
        where: { id: 'tenant-1' },
        data: { creditBalance: 497 },
      });
      expect(mockPrisma.aiCreditTransaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: 'tenant-1',
          amount: -3,
          balanceAfter: 497,
          idempotencyKey: 'idemp-deduct-101',
        }),
      });
      expect(mockPrisma.aiUsageLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: 'tenant-1',
          model: 'gpt-4o-vision',
          operation: 'VISION',
          creditsDeducted: 3,
        }),
      });
    });

    it('should protect against duplicate deductions when idempotencyKey is reused', async () => {
      mockPrisma.aiCreditTransaction.findUnique.mockResolvedValue({
        id: 'existing-tx',
        idempotencyKey: 'dup-key-99',
        amount: -1,
      });

      const res = await billingService.deductCredits({
        tenantId: 'tenant-1',
        amount: 1,
        type: CreditTransactionType.USAGE_CHAT,
        description: 'Repeated chat deduction',
        idempotencyKey: 'dup-key-99',
      });

      expect(res.status).toBe('ALREADY_PROCESSED');
      expect(res.deducted).toBe(false);
      expect(mockPrisma.tenant.update).not.toHaveBeenCalled();
    });

    it('should reject deduction when credit balance is insufficient', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        id: 'tenant-1',
        creditBalance: 2, // Less than required 5
        lowCreditThreshold: 100,
      });

      await expect(
        billingService.deductCredits({
          tenantId: 'tenant-1',
          amount: 5,
          type: CreditTransactionType.USAGE_CHAT,
          description: 'Insufficient balance attempt',
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should trigger low-balance alert when balance reaches or falls below threshold', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        id: 'tenant-1',
        creditBalance: 102,
        lowCreditThreshold: 100,
      });

      const res: any = await billingService.deductCredits({
        tenantId: 'tenant-1',
        amount: 5, // 102 - 5 = 97 (<= 100)
        type: CreditTransactionType.USAGE_CHAT,
        description: 'Drop into low balance',
      });

      expect(res.newBalance).toBe(97);
      expect(res.isLowBalance).toBe(true);
    });
  });

  describe('3. Top-ups, Refunds & Admin Adjustments', () => {
    it('should recharge credits with idempotency protection', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        id: 'tenant-1',
        creditBalance: 500,
      });

      const topup: any = await billingService.purchaseCredits({
        tenantId: 'tenant-1',
        credits: 2000,
        idempotencyKey: 'topup-order-9821',
      });

      expect(topup.status).toBe('SUCCESS');
      expect(topup.newBalance).toBe(2500);
      expect(mockPrisma.aiCreditTransaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          amount: 2000,
          type: CreditTransactionType.TOPUP_PURCHASE,
          idempotencyKey: 'topup-order-9821',
        }),
      });
    });

    it('should process credit refund and update balance', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        id: 'tenant-1',
        creditBalance: 100,
      });

      const refund = await billingService.refundCredits({
        tenantId: 'tenant-1',
        amount: 15,
        reason: 'Failed AI vision call reimbursement',
      });

      expect(refund.status).toBe('REFUNDED');
      expect(refund.newBalance).toBe(115);
      expect(mockPrisma.aiCreditTransaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: CreditTransactionType.REFUND,
          amount: 15,
        }),
      });
    });

    it('should apply admin credit adjustment with audit trail', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        id: 'tenant-1',
        creditBalance: 500,
      });

      const adjustment = await billingService.adminAdjustCredits({
        tenantId: 'tenant-1',
        amount: 500,
        type: 'ADD',
        reason: 'Partner grant',
        adminUserId: 'admin-root-1',
      });

      expect(adjustment.status).toBe('SUCCESS');
      expect(adjustment.newBalance).toBe(1000);
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'admin-root-1',
          action: 'ADMIN_CREDIT_ADJUSTMENT',
          entityId: 'tenant-1',
        }),
      });
    });

    it('should reconcile tenant balance against sum of credit transactions', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        creditBalance: 2500,
      });
      mockPrisma.aiCreditTransaction.aggregate.mockResolvedValue({
        _sum: { amount: 2500 },
      });

      const reconciliation = await billingService.reconcileTenantBalance('tenant-1');
      expect(reconciliation.isReconciled).toBe(true);
      expect(reconciliation.discrepancy).toBe(0);
    });
  });

  describe('4. Super Admin Privileges & Platform Management', () => {
    it('should authorize request when user is super admin and block standard user', () => {
      const allowContext: any = {
        switchToHttp: () => ({
          getRequest: () => ({ user: { id: 'u1', isSuperAdmin: true } }),
        }),
      };
      expect(superAdminGuard.canActivate(allowContext)).toBe(true);

      const blockContext: any = {
        switchToHttp: () => ({
          getRequest: () => ({ user: { id: 'u2', isSuperAdmin: false } }),
        }),
      };
      expect(() => superAdminGuard.canActivate(blockContext)).toThrow(ForbiddenException);
    });

    it('should return platform dashboard KPI metrics and integration health', async () => {
      mockPrisma.tenant.count.mockResolvedValueOnce(50).mockResolvedValueOnce(48);

      const stats = await superAdminService.getPlatformStats();

      expect(stats.kpis.totalTenants).toBe(50);
      expect(stats.kpis.activeTenants).toBe(48);
      expect(stats.kpis.platformGMV).toBe(450000);
      expect(stats.integrationHealth).toBeDefined();
      expect(stats.integrationHealth.length).toBeGreaterThan(5);
    });

    it('should update workspace status and record audit log', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        id: 't-1',
        name: 'Test Store',
        status: TenantStatus.ACTIVE,
      });

      await superAdminService.updateTenantStatus('t-1', TenantStatus.SUSPENDED, 'admin-1');

      expect(mockPrisma.tenant.update).toHaveBeenCalledWith({
        where: { id: 't-1' },
        data: { status: TenantStatus.SUSPENDED },
      });
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'admin-1',
          action: 'UPDATE_WORKSPACE_STATUS',
        }),
      });
    });

    it('should revoke all active user sessions', async () => {
      const res = await superAdminService.revokeUserSessions('u-target', 'admin-1');

      expect(res.revokedSessionsCount).toBe(3);
      expect(mockPrisma.userSession.updateMany).toHaveBeenCalledWith({
        where: { userId: 'u-target' },
        data: { revoked: true },
      });
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'REVOKE_USER_SESSIONS',
          userId: 'admin-1',
        }),
      });
    });

    it('should update global pricing platform settings', async () => {
      await superAdminService.updatePlatformSetting('default_trial_credits', 1000, 'admin-1');

      expect(mockPrisma.platformSetting.upsert).toHaveBeenCalledWith({
        where: { key: 'default_trial_credits' },
        update: { value: 1000, updatedBy: 'admin-1' },
        create: { key: 'default_trial_credits', value: 1000, updatedBy: 'admin-1' },
      });
    });
  });
});
