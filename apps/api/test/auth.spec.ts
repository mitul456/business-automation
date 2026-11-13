import { AuthService } from '../src/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UserStatus, WorkspaceRole } from '@omniflow/shared';

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
      userSession: {
        create: jest.fn().mockResolvedValue({ id: 'session-123' }),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
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

  it('should guarantee newly registered users strictly receive isSuperAdmin=false', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockImplementation(({ data }) => Promise.resolve({
      id: 'user-new-id',
      ...data,
    }));
    mockPrisma.tenant.create.mockResolvedValue({
      id: 'tenant-new-id',
      name: 'New Shop',
      creditBalance: 500,
    });

    const result = await authService.register({
      name: 'New Owner',
      email: 'newowner@test.com',
      password: 'SecurePass123!',
    });

    expect(result.user.isSuperAdmin).toBe(false);
    expect(mockPrisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          isSuperAdmin: false,
        }),
      })
    );
  });

  it('should reject login attempt if user account is suspended', async () => {
    const passwordHash = await bcrypt.hash('Password123!', 10);
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-suspended',
      email: 'suspended@test.com',
      passwordHash,
      status: UserStatus.SUSPENDED,
      memberships: [{ tenantId: 'tenant-1', role: WorkspaceRole.OWNER }],
    });

    await expect(
      authService.login({
        email: 'suspended@test.com',
        password: 'Password123!',
      })
    ).rejects.toThrow('Your account has been suspended or deactivated');
  });

  it('should invalidate active sessions upon user logout', async () => {
    mockPrisma.userSession.updateMany.mockResolvedValue({ count: 1 });

    const result = await authService.logout('user-123', 'refresh-token-xyz');

    expect(result.success).toBe(true);
    expect(mockPrisma.userSession.updateMany).toHaveBeenCalledWith({
      where: expect.objectContaining({
        userId: 'user-123',
        revoked: false,
      }),
      data: { revoked: true },
    });
  });

  it('should invalidate all active sessions for a user on emergency revocation', async () => {
    mockPrisma.userSession.updateMany.mockResolvedValue({ count: 4 });

    const result = await authService.revokeAllSessions('user-123');

    expect(result.success).toBe(true);
    expect(mockPrisma.userSession.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-123', revoked: false },
      data: { revoked: true },
    });
  });
});
