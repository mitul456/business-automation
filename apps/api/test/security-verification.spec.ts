import { AuthService } from '../src/auth/auth.service';
import { SuperAdminGuard } from '../src/common/guards/super-admin.guard';
import { JwtService } from '@nestjs/jwt';
import { ForbiddenException } from '@nestjs/common';
import { WorkspaceRole } from '@omniflow/shared';

describe('Security & Authentication Verification Suite', () => {
  let authService: AuthService;
  let superAdminGuard: SuperAdminGuard;
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
      },
      aiAgentConfig: {
        create: jest.fn(),
      },
      userSession: {
        create: jest.fn().mockResolvedValue({ id: 'session-123' }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      $transaction: jest.fn(async (cb) => cb(mockPrisma)),
    };

    jwtService = new JwtService({ secret: 'test-jwt-secret-verification-key' });
    authService = new AuthService(mockPrisma, jwtService);
    superAdminGuard = new SuperAdminGuard();
  });

  describe('1. Super Admin Access & Role Protection', () => {
    it('MUST throw 403 Forbidden when a standard user (isSuperAdmin = false) attempts to access Super Admin resources', () => {
      const standardUserContext: any = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: {
              id: 'user-standard-1',
              email: 'mitul@apexstore.com',
              isSuperAdmin: false,
              role: WorkspaceRole.OWNER,
            },
          }),
        }),
      };

      expect(() => superAdminGuard.canActivate(standardUserContext)).toThrow(ForbiddenException);
      expect(() => superAdminGuard.canActivate(standardUserContext)).toThrow(
        'Super Admin privilege is required to access this resource'
      );
    });

    it('MUST throw 403 Forbidden when an unauthenticated request attempts to access Super Admin resources', () => {
      const unauthContext: any = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: null,
          }),
        }),
      };

      expect(() => superAdminGuard.canActivate(unauthContext)).toThrow(ForbiddenException);
    });

    it('MUST allow access when the user is a verified Super Admin (isSuperAdmin = true)', () => {
      const superAdminContext: any = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: {
              id: 'user-superadmin-1',
              email: 'admin@omniflow.ai',
              isSuperAdmin: true,
              role: WorkspaceRole.OWNER,
            },
          }),
        }),
      };

      expect(superAdminGuard.canActivate(superAdminContext)).toBe(true);
    });
  });

  describe('2. Registration Privilege Escalation Prevention', () => {
    it('MUST strictly assign isSuperAdmin = false to newly registered users', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockImplementation(({ data }) =>
        Promise.resolve({
          id: 'user-reg-1',
          ...data,
        })
      );
      mockPrisma.tenant.create.mockResolvedValue({
        id: 'tenant-reg-1',
        name: 'New Shop',
        currency: 'BDT',
        creditBalance: 500,
      });

      // Attempt to register, simulating an attacker attempting privilege escalation
      const maliciousPayload: any = {
        name: 'Attacker User',
        email: 'attacker@test.com',
        password: 'Password123!',
        isSuperAdmin: true, // Should be completely disregarded and overridden
      };

      const result = await authService.register(maliciousPayload);

      expect(result.user.isSuperAdmin).toBe(false);
      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isSuperAdmin: false,
          }),
        })
      );
    });
  });

  describe('3. Session Logout & Revocation', () => {
    it('MUST invalidate user session in database upon logout', async () => {
      const result = await authService.logout('user-123', 'refresh-token-active');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Successfully logged out');
      expect(mockPrisma.userSession.updateMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          userId: 'user-123',
          revoked: false,
        }),
        data: { revoked: true },
      });
    });

    it('MUST invalidate all active sessions for a user upon emergency revocation', async () => {
      const result = await authService.revokeAllSessions('user-123');

      expect(result.success).toBe(true);
      expect(mockPrisma.userSession.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-123', revoked: false },
        data: { revoked: true },
      });
    });
  });
});
