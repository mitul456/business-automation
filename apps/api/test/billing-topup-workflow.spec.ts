import { BillingService } from '../src/billing/billing.service';
import { SuperAdminService } from '../src/super-admin/super-admin.service';
import { PaymentStatus, CreditTransactionType } from '@omniflow/shared';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('Credit Top-Up & Payment Processing Workflow', () => {
  let billingService: BillingService;
  let superAdminService: SuperAdminService;
  let mockPrisma: any;

  const mockTenant = {
    id: 'tenant-100',
    name: 'Shurjomukhi Fashion',
    creditBalance: 250,
    lowCreditThreshold: 100,
  };

  const mockUser = {
    id: 'user-200',
    name: 'Amina Begum',
    email: 'amina@shurjomukhi.com',
    phone: '01700112233',
  };

  beforeEach(() => {
    mockPrisma = {
      tenant: {
        findUnique: jest.fn().mockImplementation(({ where }) => {
          if (where.id === mockTenant.id) return Promise.resolve({ ...mockTenant });
          return Promise.resolve(null);
        }),
        update: jest.fn().mockImplementation(({ where, data }) => {
          mockTenant.creditBalance = data.creditBalance;
          return Promise.resolve({ ...mockTenant, ...data });
        }),
      },
      paymentMethodConfig: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'pm-1',
            code: 'BKASH',
            name: 'bKash (Send Money / Merchant)',
            type: 'MANUAL',
            merchantNumber: '01712-345678',
            instructions: 'Send Money to 01712-345678',
            isActive: true,
          },
          {
            id: 'pm-2',
            code: 'NAGAD',
            name: 'Nagad (Send Money / Merchant)',
            type: 'MANUAL',
            merchantNumber: '01812-987654',
            instructions: 'Send Money to 01812-987654',
            isActive: true,
          },
          {
            id: 'pm-3',
            code: 'STRIPE',
            name: 'Card / Stripe',
            type: 'AUTOMATED',
            instructions: 'Pay via Card',
            isActive: true,
          },
        ]),
        findFirst: jest.fn().mockImplementation(({ where }) => {
          if (where.code === 'BKASH') {
            return Promise.resolve({
              code: 'BKASH',
              merchantNumber: '01712-345678',
              instructions: 'Send Money to 01712-345678',
              type: 'MANUAL',
            });
          }
          if (where.code === 'STRIPE') {
            return Promise.resolve({
              code: 'STRIPE',
              type: 'AUTOMATED',
              instructions: 'Pay via Card',
            });
          }
          return Promise.resolve(null);
        }),
      },
      creditTopupRequest: {
        create: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({
            id: 'req-topup-1',
            status: PaymentStatus.PENDING,
            trxId: null,
            customerPhone: null,
            createdAt: new Date(),
            ...data,
          })
        ),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn().mockImplementation(({ where, data }) =>
          Promise.resolve({ id: where.id, ...data })
        ),
      },
      aiCreditTransaction: {
        create: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({ id: 'tx-credit-1', ...data })
        ),
        findUnique: jest.fn().mockResolvedValue(null),
      },
      auditLog: {
        create: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({ id: 'aud-1', ...data })
        ),
      },
      $transaction: jest.fn(async (callback) => {
        return callback(mockPrisma);
      }),
    };

    billingService = new BillingService(mockPrisma);
    superAdminService = new SuperAdminService(mockPrisma);
  });

  describe('1. Top-Up Initiation', () => {
    it('should create a PENDING request and return merchant instructions without modifying credit balance', async () => {
      const initialBalance = mockTenant.creditBalance;

      const result = await billingService.initiateTopupRequest({
        tenantId: mockTenant.id,
        userId: mockUser.id,
        planId: 'p2', // 2000 credits, 1200 BDT
        paymentMethod: 'BKASH',
      });

      expect(result.requestId).toBe('req-topup-1');
      expect(result.credits).toBe(2000);
      expect(result.amountBdt).toBe(1200);
      expect(result.paymentMethod).toBe('BKASH');
      expect(result.merchantNumber).toBe('01712-345678');
      expect(result.status).toBe(PaymentStatus.PENDING);

      // Verify NO credits were added at initiation time
      expect(mockTenant.creditBalance).toBe(initialBalance);
      expect(mockPrisma.aiCreditTransaction.create).not.toHaveBeenCalled();
    });
  });

  describe('2. TrxID Submission & Anti-Fraud Verification', () => {
    it('should record user sender mobile and TrxID for manual verification', async () => {
      mockPrisma.creditTopupRequest.findFirst
        .mockResolvedValueOnce({
          id: 'req-topup-1',
          tenantId: mockTenant.id,
          status: PaymentStatus.PENDING,
          credits: 2000,
        }) // check request exists
        .mockResolvedValueOnce(null); // check no duplicate TrxID

      const result = await billingService.submitTopupTrx({
        tenantId: mockTenant.id,
        userId: mockUser.id,
        requestId: 'req-topup-1',
        customerPhone: '01711223344',
        trxId: 'BK902KA1',
      });

      expect(result.status).toBe('PENDING_APPROVAL');
      expect(result.trxId).toBe('BK902KA1');
      expect(mockPrisma.creditTopupRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'req-topup-1' },
          data: expect.objectContaining({
            customerPhone: '01711223344',
            trxId: 'BK902KA1',
            status: PaymentStatus.PENDING,
          }),
        })
      );
    });

    it('should reject submission if duplicate TrxID is already used', async () => {
      mockPrisma.creditTopupRequest.findFirst
        .mockResolvedValueOnce({
          id: 'req-topup-2',
          tenantId: mockTenant.id,
          status: PaymentStatus.PENDING,
        })
        .mockResolvedValueOnce({
          id: 'req-topup-existing',
          trxId: 'BK902KA1',
          status: PaymentStatus.PAID,
        });

      await expect(
        billingService.submitTopupTrx({
          tenantId: mockTenant.id,
          userId: mockUser.id,
          requestId: 'req-topup-2',
          customerPhone: '01899887766',
          trxId: 'BK902KA1',
        })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('3. Super Admin Approval & Atomic Credit Injection', () => {
    it('should atomically credit user balance and insert immutable ledger upon admin approval', async () => {
      const currentBalance = 250;
      mockTenant.creditBalance = currentBalance;

      mockPrisma.creditTopupRequest.findUnique.mockResolvedValue({
        id: 'req-topup-1',
        tenantId: mockTenant.id,
        userId: mockUser.id,
        credits: 2000,
        amountBdt: 1200,
        paymentMethod: 'BKASH',
        status: PaymentStatus.PENDING,
        trxId: 'BK902KA1',
        customerPhone: '01711223344',
        tenant: { ...mockTenant, creditBalance: currentBalance },
        user: { ...mockUser },
      });

      const approval = await superAdminService.approveTopupRequest('req-topup-1', 'admin-mitul');

      expect(approval.status).toBe('SUCCESS');
      expect(approval.addedCredits).toBe(2000);
      expect(approval.newBalance).toBe(2250);

      // Verify database update
      expect(mockPrisma.tenant.update).toHaveBeenCalledWith({
        where: { id: mockTenant.id },
        data: { creditBalance: 2250 },
      });

      // Verify immutable credit transaction created
      expect(mockPrisma.aiCreditTransaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: mockTenant.id,
          amount: 2000,
          type: CreditTransactionType.TOPUP_PURCHASE,
          balanceAfter: 2250,
          idempotencyKey: 'topup-approved-req-topup-1',
          adminUserId: 'admin-mitul',
        }),
      });
    });

    it('should prevent duplicate credit injections on already approved requests', async () => {
      mockPrisma.creditTopupRequest.findUnique.mockResolvedValue({
        id: 'req-topup-1',
        status: PaymentStatus.PAID,
        tenant: mockTenant,
      });

      await expect(
        superAdminService.approveTopupRequest('req-topup-1', 'admin-mitul')
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('4. Super Admin Rejection Workflow', () => {
    it('should mark request as REJECTED with notes and NEVER add credits', async () => {
      const balanceBefore = mockTenant.creditBalance;

      mockPrisma.creditTopupRequest.findUnique.mockResolvedValue({
        id: 'req-topup-invalid',
        tenantId: mockTenant.id,
        status: PaymentStatus.PENDING,
      });

      const result = await superAdminService.rejectTopupRequest(
        'req-topup-invalid',
        'Invalid TrxID - no SMS received from bKash',
        'admin-mitul'
      );

      expect(result.status).toBe('REJECTED');
      expect(mockPrisma.creditTopupRequest.update).toHaveBeenCalledWith({
        where: { id: 'req-topup-invalid' },
        data: expect.objectContaining({
          status: PaymentStatus.REJECTED,
          adminNotes: 'Invalid TrxID - no SMS received from bKash',
          approvedBy: 'admin-mitul',
        }),
      });

      // Confirm tenant balance was NOT altered
      expect(mockTenant.creditBalance).toBe(balanceBefore);
    });
  });

  describe('5. Automated Stripe Verification Workflow', () => {
    it('should atomically add credits immediately upon verified Stripe payment', async () => {
      mockTenant.creditBalance = 500;

      mockPrisma.creditTopupRequest.findFirst.mockResolvedValue({
        id: 'req-stripe-1',
        tenantId: mockTenant.id,
        credits: 5000,
        amountBdt: 2600,
        status: PaymentStatus.PENDING,
      });

      const stripeResult = await billingService.verifyStripeTopup({
        tenantId: mockTenant.id,
        userId: mockUser.id,
        requestId: 'req-stripe-1',
        paymentIntentId: 'pi_3M9810239',
      });

      expect((stripeResult as any).status).toBe('SUCCESS');
      expect((stripeResult as any).addedCredits).toBe(5000);
      expect((stripeResult as any).newBalance).toBe(5500);

      expect(mockPrisma.tenant.update).toHaveBeenCalledWith({
        where: { id: mockTenant.id },
        data: { creditBalance: 5500 },
      });

      expect(mockPrisma.aiCreditTransaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: mockTenant.id,
          amount: 5000,
          type: CreditTransactionType.TOPUP_PURCHASE,
          idempotencyKey: 'stripe-topup-req-stripe-1',
        }),
      });
    });
  });
});
