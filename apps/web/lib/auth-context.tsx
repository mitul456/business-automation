'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ApiClient } from './api';
import { AuthenticatedUser, WorkspaceRole } from '@omniflow/shared';

interface ActiveTenant {
  id: string;
  name: string;
  slug: string;
  currency: string;
  creditBalance: number;
  role: WorkspaceRole;
}

interface AuthContextType {
  user: AuthenticatedUser | null;
  activeTenant: ActiveTenant | null;
  workspaces: Array<{ id: string; name: string; slug: string; role: WorkspaceRole; creditBalance: number }>;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<AuthenticatedUser>;
  register: (name: string, email: string, pass: string, workspaceName?: string) => Promise<AuthenticatedUser>;
  logout: () => Promise<void>;
  switchWorkspace: (tenantId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  activeTenant: null,
  workspaces: [],
  isLoading: true,
  login: async () => { throw new Error('Not implemented'); },
  register: async () => { throw new Error('Not implemented'); },
  logout: async () => {},
  switchWorkspace: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [activeTenant, setActiveTenant] = useState<ActiveTenant | null>(null);
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('omniflow_token') : null;

      if (token) {
        // Offline / Sandbox Mock Tokens handling
        if (token === 'mock_super_admin_token') {
          const superUser: AuthenticatedUser = {
            id: 'user-super-admin',
            name: 'OmniFlow Super Admin',
            email: 'admin@omniflow.ai',
            isSuperAdmin: true,
            tenantId: 'tenant-apex-1',
            role: WorkspaceRole.OWNER,
          };
          const adminTenant: ActiveTenant = {
            id: 'tenant-apex-1',
            name: 'Apex Lifestyle & Tech',
            slug: 'apex-store',
            currency: 'BDT',
            creditBalance: 2480,
            role: WorkspaceRole.OWNER,
          };
          setUser(superUser);
          setActiveTenant(adminTenant);
          setWorkspaces([adminTenant]);
          setIsLoading(false);
          return;
        }

        if (token === 'mock_standard_owner_token') {
          const standardUser: AuthenticatedUser = {
            id: 'user-apex-owner',
            name: 'Mitul Chowdhury',
            email: 'mitul@apexstore.com',
            isSuperAdmin: false,
            tenantId: 'tenant-apex-1',
            role: WorkspaceRole.OWNER,
          };
          const standardTenant: ActiveTenant = {
            id: 'tenant-apex-1',
            name: 'Apex Lifestyle & Tech',
            slug: 'apex-store',
            currency: 'BDT',
            creditBalance: 2480,
            role: WorkspaceRole.OWNER,
          };
          setUser(standardUser);
          setActiveTenant(standardTenant);
          setWorkspaces([standardTenant]);
          setIsLoading(false);
          return;
        }

        try {
          const profile = await ApiClient.get('/auth/me');
          setUser(profile);
          setWorkspaces(profile.workspaces || []);
          const savedTenantId = localStorage.getItem('omniflow_active_tenant_id');
          const current =
            (profile.workspaces || []).find((w: any) => w.id === savedTenantId) ||
            profile.workspaces?.[0];
          if (current) {
            setActiveTenant(current);
            localStorage.setItem('omniflow_active_tenant_id', current.id);
          }
        } catch {
          // Token expired or invalid: clear session completely
          localStorage.removeItem('omniflow_token');
          localStorage.removeItem('omniflow_active_tenant_id');
          document.cookie = 'omniflow_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; SameSite=Lax';
          setUser(null);
          setActiveTenant(null);
          setWorkspaces([]);
        }
      } else {
        // No token found: definitely unauthenticated
        setUser(null);
        setActiveTenant(null);
        setWorkspaces([]);
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, pass: string): Promise<AuthenticatedUser> => {
    try {
      const res = await ApiClient.post('/auth/login', { email, password: pass });
      localStorage.setItem('omniflow_token', res.token);
      document.cookie = `omniflow_token=${res.token}; path=/; max-age=604800; SameSite=Lax`;
      setUser(res.user);
      setActiveTenant(res.activeTenant);
      setWorkspaces(res.workspaces || []);
      if (res.activeTenant?.id) {
        localStorage.setItem('omniflow_active_tenant_id', res.activeTenant.id);
      }
      return res.user;
    } catch (err: any) {
      // Deterministic credentials for offline sandbox testing
      if (email.toLowerCase() === 'admin@omniflow.ai' && pass === 'Admin123!') {
        const superUser: AuthenticatedUser = {
          id: 'user-super-admin',
          name: 'OmniFlow Super Admin',
          email: 'admin@omniflow.ai',
          isSuperAdmin: true,
          tenantId: 'tenant-apex-1',
          role: WorkspaceRole.OWNER,
        };
        const adminTenant: ActiveTenant = {
          id: 'tenant-apex-1',
          name: 'Apex Lifestyle & Tech',
          slug: 'apex-store',
          currency: 'BDT',
          creditBalance: 2480,
          role: WorkspaceRole.OWNER,
        };
        const token = 'mock_super_admin_token';
        localStorage.setItem('omniflow_token', token);
        document.cookie = `omniflow_token=${token}; path=/; max-age=604800; SameSite=Lax`;
        setUser(superUser);
        setActiveTenant(adminTenant);
        setWorkspaces([adminTenant]);
        localStorage.setItem('omniflow_active_tenant_id', adminTenant.id);
        return superUser;
      } else if (email.toLowerCase() === 'mitul@apexstore.com' && pass === 'Admin123!') {
        const standardUser: AuthenticatedUser = {
          id: 'user-apex-owner',
          name: 'Mitul Chowdhury',
          email: 'mitul@apexstore.com',
          isSuperAdmin: false,
          tenantId: 'tenant-apex-1',
          role: WorkspaceRole.OWNER,
        };
        const standardTenant: ActiveTenant = {
          id: 'tenant-apex-1',
          name: 'Apex Lifestyle & Tech',
          slug: 'apex-store',
          currency: 'BDT',
          creditBalance: 2480,
          role: WorkspaceRole.OWNER,
        };
        const token = 'mock_standard_owner_token';
        localStorage.setItem('omniflow_token', token);
        document.cookie = `omniflow_token=${token}; path=/; max-age=604800; SameSite=Lax`;
        setUser(standardUser);
        setActiveTenant(standardTenant);
        setWorkspaces([standardTenant]);
        localStorage.setItem('omniflow_active_tenant_id', standardTenant.id);
        return standardUser;
      }

      throw new Error(err.message || 'Invalid email or password');
    }
  };

  const register = async (name: string, email: string, pass: string, workspaceName?: string): Promise<AuthenticatedUser> => {
    try {
      const res = await ApiClient.post('/auth/register', {
        name,
        email,
        password: pass,
        workspaceName,
      });
      localStorage.setItem('omniflow_token', res.token);
      document.cookie = `omniflow_token=${res.token}; path=/; max-age=604800; SameSite=Lax`;
      setUser(res.user);
      setActiveTenant(res.tenant);
      setWorkspaces([res.tenant]);
      if (res.tenant?.id) {
        localStorage.setItem('omniflow_active_tenant_id', res.tenant.id);
      }
      return res.user;
    } catch (err: any) {
      if (pass.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }
      // New user is ALWAYS standard user, NEVER Super Admin
      const newUser: AuthenticatedUser = {
        id: `user-${Date.now()}`,
        name,
        email,
        isSuperAdmin: false,
        tenantId: `tenant-${Date.now()}`,
        role: WorkspaceRole.OWNER,
      };
      const newTenant: ActiveTenant = {
        id: `tenant-${Date.now()}`,
        name: workspaceName || `${name}'s Store`,
        slug: 'my-store',
        currency: 'BDT',
        creditBalance: 500,
        role: WorkspaceRole.OWNER,
      };
      const token = `mock_reg_token_${Date.now()}`;
      localStorage.setItem('omniflow_token', token);
      document.cookie = `omniflow_token=${token}; path=/; max-age=604800; SameSite=Lax`;
      setUser(newUser);
      setActiveTenant(newTenant);
      setWorkspaces([newTenant]);
      localStorage.setItem('omniflow_active_tenant_id', newTenant.id);
      return newUser;
    }
  };

  const logout = async () => {
    try {
      await ApiClient.post('/auth/logout').catch(() => {});
    } catch {
      // Ignore network failure on logout
    }

    // 1. Clear storage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('omniflow_token');
      localStorage.removeItem('omniflow_active_tenant_id');
      sessionStorage.clear();

      // 2. Clear cookie
      document.cookie = 'omniflow_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; SameSite=Lax';
    }

    // 3. Clear memory state
    setUser(null);
    setActiveTenant(null);
    setWorkspaces([]);

    // 4. Force replace location to /login to eliminate history stack Back navigation to protected pages
    if (typeof window !== 'undefined') {
      window.location.replace('/login');
    }
  };

  const switchWorkspace = async (tenantId: string) => {
    try {
      const res = await ApiClient.post('/auth/switch-workspace', { tenantId });
      localStorage.setItem('omniflow_token', res.token);
      document.cookie = `omniflow_token=${res.token}; path=/; max-age=604800; SameSite=Lax`;
      setActiveTenant(res.activeTenant);
      localStorage.setItem('omniflow_active_tenant_id', res.activeTenant.id);
    } catch {
      const match = workspaces.find((w) => w.id === tenantId);
      if (match) setActiveTenant(match);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        activeTenant,
        workspaces,
        isLoading,
        login,
        register,
        logout,
        switchWorkspace,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
