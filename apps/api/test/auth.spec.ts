import { AuthService } from '../src/auth/auth.service';
import { JwtService } from '@nestjs/jwt';

describe('AuthService Unit Tests', () => {
  let authService: AuthService;
  let mockPrisma: any;
  let jwtService: JwtService;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      tenant: {
        create: jest.fn(),
      },
      tenantSubscription: {
        create: jest.fn(),
      },
      aiCreditTransaction: {
        create: jest.fn(),
      },
      workspaceMember: {
        create: jest.fn(),
        findUnique: jest.fn(),
      },
      aiAgentConfig: {
        create: jest.fn(),
      },
      $transaction: jest.fn(async (cb) => {
        return cb(mockPrisma);
      }),
    };

    jwtService = new JwtService({ secret: 'test-secret' });
    authService = new AuthService(mockPrisma, jwtService);
  });

  it('should register a new user, create their workspace with 500 bonus credits, and return a signed JWT', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    mockPrisma.user.create.mockResolvedValue({
      id: 'user-123',
      email: 'founder@test.com',
      name: 'Test Founder',
      isSuperAdmin: false,
    });

    mockPrisma.tenant.create.mockResolvedValue({
      id: 'tenant-456',
      name: "Test's Workspace",
      slug: 'test-workspace-1234',
      currency: 'BDT',
      creditBalance: 500,
    });

    const result = await authService.register({
      name: 'Test Founder',
      email: 'founder@test.com',
      password: 'SecurePassword123!',
      workspaceName: "Test's Workspace",
    });

    expect(result).toHaveProperty('token');
    expect(result.user.email).toBe('founder@test.com');
    expect(result.tenant.creditBalance).toBe(500);
    expect(mockPrisma.aiCreditTransaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tenantId: 'tenant-456',
          amount: 500,
        }),
      })
    );
  });

  it('should reject registration if email is already taken', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'existing-id',
      email: 'existing@test.com',
    });

    await expect(
      authService.register({
        name: 'Another User',
        email: 'existing@test.com',
        password: 'Password123',
      })
    ).rejects.toThrow('An account with this email already exists');
  });
});
