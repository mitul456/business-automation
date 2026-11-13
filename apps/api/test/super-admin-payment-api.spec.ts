import { SuperAdminService } from '../src/super-admin/super-admin.service';
import { UserStatus } from '@omniflow/shared';
import { EncryptionService } from '@omniflow/integrations';

describe('Super Admin Dynamic Payment Methods & API Management', () => {
  let superAdminService: SuperAdminService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      paymentMethodConfig: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'pm-bkash',
            code: 'BKASH',
            name: 'bKash Merchant',
            type: 'MANUAL',
            merchantNumber: '01712-345678',
            apiKeyEncrypted: 'enc_api_key_123',
            secretEncrypted: 'enc_secret_456',
            isActive: true,
            displayOrder: 1,
          },
        ]),
        create: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({ id: 'pm-new', ...data })
        ),
        update: jest.fn().mockImplementation(({ where, data }) =>
          Promise.resolve({ id: where.id, ...data })
        ),
        delete: jest.fn().mockResolvedValue({ id: 'pm-delete', code: 'NAGAD' }),
      },
      dynamicApiConfig: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'api-1',
            providerKey: 'OPENAI',
            name: 'OpenAI GPT-4o',
            category: 'AI',
            baseUrl: 'https://api.openai.com/v1',
            apiKeyEncrypted: 'enc_key_openai',
            isActive: true,
            lastTestStatus: 'CONNECTED',
            lastTestLatencyMs: 380,
          },
        ]),
        findUnique: jest.fn().mockImplementation(({ where }) => {
          if (where.providerKey === 'OPENAI') {
            return Promise.resolve({
              providerKey: 'OPENAI',
              baseUrl: 'https://api.openai.com/v1',
              apiKeyEncrypted: EncryptionService.encrypt('sk-test-secret-key-1234'),
            });
          }
          return Promise.resolve(null);
        }),
        upsert: jest.fn().mockImplementation(({ where, update, create }) =>
          Promise.resolve({ id: 'api-upsert', ...create, ...update })
        ),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      user: {
        findUnique: jest.fn().mockImplementation(({ where }) => {
          if (where.id === 'user-1') {
            return Promise.resolve({
              id: 'user-1',
              name: 'Tanvir Hossain',
              email: 'tanvir@apexlifestyle.bd',
              status: UserStatus.ACTIVE,
              memberships: [
                {
                  tenantId: 'tenant-apex',
                  tenant: { id: 'tenant-apex', name: 'Apex Lifestyle', creditBalance: 1200 },
                },
              ],
            });
          }
          return Promise.resolve(null);
        }),
        update: jest.fn().mockImplementation(({ where, data }) =>
          Promise.resolve({ id: where.id, ...data })
        ),
      },
      tenant: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'tenant-apex',
          creditBalance: 1200,
        }),
        update: jest.fn().mockImplementation(({ where, data }) =>
          Promise.resolve({ id: where.id, ...data })
        ),
      },
      aiCreditTransaction: {
        create: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({ id: 'tx-adj-1', ...data })
        ),
      },
      auditLog: {
        create: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({ id: 'aud-log-1', ...data })
        ),
      },
      $transaction: jest.fn(async (callback) => {
        return callback(mockPrisma);
      }),
    };

    superAdminService = new SuperAdminService(mockPrisma);
  });

  describe('1. Dynamic Payment Method Configuration', () => {
    it('should list payment methods with encrypted API credentials masked', async () => {
      const methods = await superAdminService.listPaymentMethods();

      expect(methods.length).toBeGreaterThan(0);
      expect(methods[0].code).toBe('BKASH');
      // Verify keys are masked for security
      expect(methods[0].apiKeyEncrypted).toBe('••••••••••••••••');
      expect(methods[0].secretEncrypted).toBe('••••••••••••••••');
    });

    it('should encrypt secret credentials using AES-256-GCM when creating a method', async () => {
      await superAdminService.createPaymentMethod(
        {
          code: 'ROCKET',
          name: 'DBBL Rocket',
          type: 'MANUAL',
          merchantNumber: '01912-345678',
          apiKey: 'secret_plain_api_key',
          instructions: 'Send Money via Rocket',
        },
        'admin-mitul'
      );

      expect(mockPrisma.paymentMethodConfig.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          code: 'ROCKET',
          name: 'DBBL Rocket',
          apiKeyEncrypted: expect.stringMatching(/^[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/),
        }),
      });
    });

    it('should update payment method and log audit entry', async () => {
      await superAdminService.updatePaymentMethod(
        'pm-bkash',
        { merchantNumber: '01700-999888', isActive: false },
        'admin-mitul'
      );

      expect(mockPrisma.paymentMethodConfig.update).toHaveBeenCalledWith({
        where: { id: 'pm-bkash' },
        data: expect.objectContaining({
          merchantNumber: '01700-999888',
          isActive: false,
        }),
      });

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'UPDATE_PAYMENT_METHOD',
          entityId: 'pm-bkash',
          userId: 'admin-mitul',
        }),
      });
    });
  });

  describe('2. Dynamic API Configurations & Connection Testing', () => {
    it('should list dynamic API configs with masked tokens', async () => {
      const configs = await superAdminService.listApiConfigs();

      expect(configs.length).toBeGreaterThan(0);
      expect(configs[0].providerKey).toBe('OPENAI');
      expect(configs[0].apiKeyEncrypted).toBe('••••••••••••••••');
    });

    it('should execute live API ping test and record latency in milliseconds', async () => {
      const testResult = await superAdminService.testApiConnection('OPENAI');

      expect(testResult.providerKey).toBe('OPENAI');
      expect(['CONNECTED', 'ERROR']).toContain(testResult.status);
      expect(testResult.latencyMs).toBeGreaterThan(0);
      expect(testResult.testedAt).toBeDefined();

      expect(mockPrisma.dynamicApiConfig.updateMany).toHaveBeenCalledWith({
        where: { providerKey: 'OPENAI' },
        data: expect.objectContaining({
          lastTestStatus: testResult.status,
          lastTestLatencyMs: testResult.latencyMs,
        }),
      });
    });
  });

  describe('3. User Details & Direct Balance Adjustment', () => {
    it('should adjust user credit balance with mandatory audit log description', async () => {
      const result = await superAdminService.adjustUserCredits(
        'user-1',
        500,
        'Apology grant for maintenance downtime',
        'admin-mitul'
      );

      expect(result.status).toBe('SUCCESS');
      expect(result.addedCredits).toBe(500);
      expect(result.newBalance).toBe(1700);

      expect(mockPrisma.tenant.update).toHaveBeenCalledWith({
        where: { id: 'tenant-apex' },
        data: { creditBalance: 1700 },
      });

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'ADMIN_CREDIT_INJECTION',
          userId: 'admin-mitul',
          details: expect.objectContaining({
            amount: 500,
            reason: 'Apology grant for maintenance downtime',
          }),
        }),
      });
    });
  });
});
