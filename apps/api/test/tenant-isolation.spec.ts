import { UnauthorizedException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { AuthService } from '../src/auth/auth.service';
import { TenantsService } from '../src/tenants/tenants.service';
import { OrdersService } from '../src/orders/orders.service';
import { TenantGuard } from '../src/common/guards/tenant.guard';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { ROLES_KEY } from '../src/common/decorators/roles.decorator';
import { WorkspaceRole, OrderStatus, PaymentMethod } from '@omniflow/shared';
import { JwtService } from '@nestjs/jwt';

describe('OmniFlow Multi-Tenant Isolation & RBAC Test Suite', () => {
  const TENANT_ALPHA_ID = 'tenant-alpha-1111';
  const TENANT_BETA_ID = 'tenant-beta-2222';
  const USER_ALPHA_ID = 'user-alpha-9999';
  const USER_BETA_ID = 'user-beta-8888';

  let mockPrisma: any;
  let authService: AuthService;
  let tenantsService: TenantsService;
  let ordersService: OrdersService;
  let tenantGuard: TenantGuard;
  let rolesGuard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    mockPrisma = {
      tenant: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      workspaceMember: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      userSession: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      order: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn().mockResolvedValue(2),
        create: jest.fn(),
        update: jest.fn(),
      },
      product: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      customer: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(async (cb) => (typeof cb === 'function' ? cb(mockPrisma) : cb)),
    };

    const jwtService = new JwtService({ secret: 'test-jwt-secret' });
    authService = new AuthService(mockPrisma, jwtService);
    tenantsService = new TenantsService(mockPrisma);
    ordersService = new OrdersService(mockPrisma);
    tenantGuard = new TenantGuard(mockPrisma);
    reflector = new Reflector();
    rolesGuard = new RolesGuard(reflector);
  });

  // -------------------------------------------------------------
  // Test Suite 1: Multi-Tenant Data Read & Query Scoping
  // -------------------------------------------------------------
  describe('Multi-Tenant Data Read Isolation', () => {
    it('Tenant A cannot retrieve an order belonging to Tenant B by ID', async () => {
      const orderBetaId = 'order-beta-777';

      // Mock database state: Order exists under Tenant Beta, NOT Tenant Alpha
      mockPrisma.order.findFirst.mockImplementation(({ where }: any) => {
        if (where.id === orderBetaId && where.tenantId === TENANT_ALPHA_ID) {
          return Promise.resolve(null); // Not found in Tenant Alpha's partition
        }
        if (where.id === orderBetaId && where.tenantId === TENANT_BETA_ID) {
          return Promise.resolve({
            id: orderBetaId,
            tenantId: TENANT_BETA_ID,
            orderNumber: 'ORD-BETA-001',
            totalAmount: 1500,
          });
        }
        return Promise.resolve(null);
      });

      // Tenant Alpha queries for orderBetaId
      await expect(
        ordersService.getOrder(TENANT_ALPHA_ID, orderBetaId)
      ).rejects.toThrow(NotFoundException);

      // Verify that Prisma findFirst was strictly scoped by tenantId
      expect(mockPrisma.order.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: orderBetaId,
            tenantId: TENANT_ALPHA_ID,
          }),
        })
      );
    });

    it('Tenant A listing orders only returns records scoped to Tenant A', async () => {
      const alphaOrders = [
        { id: 'order-alpha-1', tenantId: TENANT_ALPHA_ID, orderNumber: 'ORD-ALPHA-1' },
        { id: 'order-alpha-2', tenantId: TENANT_ALPHA_ID, orderNumber: 'ORD-ALPHA-2' },
      ];

      mockPrisma.order.findMany.mockImplementation(({ where }: any) => {
        if (where.tenantId === TENANT_ALPHA_ID) {
          return Promise.resolve(alphaOrders);
        }
        return Promise.resolve([]);
      });
      mockPrisma.order.count.mockResolvedValue(2);

      const results = await ordersService.listOrders({ tenantId: TENANT_ALPHA_ID });

      expect(results.orders).toHaveLength(2);
      expect(results.orders.every((o: any) => o.tenantId === TENANT_ALPHA_ID)).toBe(true);
      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: TENANT_ALPHA_ID,
          }),
        })
      );
    });
  });

  // -------------------------------------------------------------
  // Test Suite 2: Multi-Tenant Mutation & Destruction Isolation
  // -------------------------------------------------------------
  describe('Multi-Tenant Mutation & Destruction Isolation', () => {
    it('Tenant A cannot update the status of Tenant B order', async () => {
      const orderBetaId = 'order-beta-777';

      // findFirst returns null because tenantId does not match
      mockPrisma.order.findFirst.mockResolvedValue(null);

      await expect(
        ordersService.updateOrderStatus(TENANT_ALPHA_ID, orderBetaId, {
          status: OrderStatus.SHIPPED,
        })
      ).rejects.toThrow(NotFoundException);

      // Ensure no update was executed on Tenant B's order
      expect(mockPrisma.order.update).not.toHaveBeenCalled();
    });

    it('Tenant A cannot remove a member from Tenant B workspace', async () => {
      const memberBetaId = 'member-beta-001';

      // Tenant A requests removal of memberBetaId, but findFirst filters by tenantId
      mockPrisma.workspaceMember.findFirst.mockImplementation(({ where }: any) => {
        if (where.id === memberBetaId && where.tenantId === TENANT_ALPHA_ID) {
          return Promise.resolve(null);
        }
        return Promise.resolve(null);
      });

      await expect(
        tenantsService.removeMember(TENANT_ALPHA_ID, memberBetaId)
      ).rejects.toThrow(NotFoundException);

      expect(mockPrisma.workspaceMember.delete).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------
  // Test Suite 3: Cross-Tenant Workspace Switching Access Guard
  // -------------------------------------------------------------
  describe('Cross-Tenant Workspace Access & Switching', () => {
    it('User Alpha cannot switch to Tenant Beta workspace without membership', async () => {
      // User Alpha is NOT a member of Tenant Beta
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);

      await expect(
        authService.switchWorkspace(USER_ALPHA_ID, TENANT_BETA_ID)
      ).rejects.toThrow(UnauthorizedException);

      expect(mockPrisma.workspaceMember.findUnique).toHaveBeenCalledWith({
        where: {
          tenantId_userId: {
            tenantId: TENANT_BETA_ID,
            userId: USER_ALPHA_ID,
          },
        },
        include: expect.any(Object),
      });
    });

    it('User Alpha successfully switches to Tenant Alpha where they are a member', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({
        id: 'member-alpha-1',
        tenantId: TENANT_ALPHA_ID,
        userId: USER_ALPHA_ID,
        role: WorkspaceRole.OWNER,
        tenant: {
          id: TENANT_ALPHA_ID,
          name: 'Alpha Store',
          slug: 'alpha-store',
          currency: 'BDT',
          creditBalance: 1200,
        },
        user: {
          id: USER_ALPHA_ID,
          email: 'alpha@test.com',
          isSuperAdmin: false,
        },
      });

      const response = await authService.switchWorkspace(USER_ALPHA_ID, TENANT_ALPHA_ID);

      expect(response).toHaveProperty('token');
      expect(response.activeTenant.id).toBe(TENANT_ALPHA_ID);
      expect(response.activeTenant.role).toBe(WorkspaceRole.OWNER);
    });
  });

  // -------------------------------------------------------------
  // Test Suite 4: TenantGuard Enforcement
  // -------------------------------------------------------------
  describe('TenantGuard Context & Verification', () => {
    it('TenantGuard rejects unauthenticated requests', async () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({ user: null }),
        }),
      } as unknown as ExecutionContext;

      await expect(tenantGuard.canActivate(mockContext)).rejects.toThrow(ForbiddenException);
    });

    it('TenantGuard rejects when x-tenant-id claims a workspace the user does not belong to', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);

      const mockRequest = {
        user: { id: USER_ALPHA_ID, email: 'alpha@test.com', isSuperAdmin: false },
        headers: { 'x-tenant-id': TENANT_BETA_ID },
        url: '/api/v1/workspaces/current',
      };

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as unknown as ExecutionContext;

      await expect(tenantGuard.canActivate(mockContext)).rejects.toThrow(ForbiddenException);
    });

    it('TenantGuard allows access and populates tenant context when user is an active member', async () => {
      const membership = {
        id: 'mem-1',
        tenantId: TENANT_ALPHA_ID,
        userId: USER_ALPHA_ID,
        role: WorkspaceRole.OWNER,
        tenant: { id: TENANT_ALPHA_ID, name: 'Alpha Store' },
      };
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(membership);

      const mockRequest: any = {
        user: { id: USER_ALPHA_ID, email: 'alpha@test.com', isSuperAdmin: false },
        headers: { 'x-tenant-id': TENANT_ALPHA_ID },
        url: '/api/v1/workspaces/current',
      };

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as unknown as ExecutionContext;

      const allowed = await tenantGuard.canActivate(mockContext);

      expect(allowed).toBe(true);
      expect(mockRequest.tenantId).toBe(TENANT_ALPHA_ID);
      expect(mockRequest.workspaceRole).toBe(WorkspaceRole.OWNER);
      expect(mockRequest.tenant.name).toBe('Alpha Store');
    });
  });

  // -------------------------------------------------------------
  // Test Suite 5: RBAC Server-Side RolesGuard Hierarchy
  // -------------------------------------------------------------
  describe('RBAC RolesGuard Hierarchy Enforcement', () => {
    const createMockExecutionContext = (role: WorkspaceRole, allowedRoles: WorkspaceRole[]) => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(allowedRoles);

      return {
        switchToHttp: () => ({
          getRequest: () => ({
            workspaceRole: role,
            user: { role },
          }),
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
      } as unknown as ExecutionContext;
    };

    it('VIEWER cannot perform ADMIN operations (e.g. invite members)', () => {
      const context = createMockExecutionContext(WorkspaceRole.VIEWER, [
        WorkspaceRole.ADMIN,
        WorkspaceRole.OWNER,
      ]);

      expect(() => rolesGuard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('SUPPORT_AGENT cannot perform OWNER operations (e.g. modify member roles)', () => {
      const context = createMockExecutionContext(WorkspaceRole.SUPPORT_AGENT, [
        WorkspaceRole.OWNER,
      ]);

      expect(() => rolesGuard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('ADMIN is authorized for ADMIN and MANAGER operations', () => {
      const context = createMockExecutionContext(WorkspaceRole.ADMIN, [
        WorkspaceRole.ADMIN,
        WorkspaceRole.OWNER,
      ]);

      expect(rolesGuard.canActivate(context)).toBe(true);
    });

    it('OWNER inherits top-tier permissions for all workspace operations', () => {
      const context = createMockExecutionContext(WorkspaceRole.OWNER, [
        WorkspaceRole.ADMIN,
      ]);

      expect(rolesGuard.canActivate(context)).toBe(true);
    });
  });
});
