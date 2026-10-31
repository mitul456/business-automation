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
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string, workspaceName?: string) => Promise<void>;
  logout: () => void;
  switchWorkspace: (tenantId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  activeTenant: null,
  workspaces: [],
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  switchWorkspace: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [activeTenant, setActiveTenant] = useState<ActiveTenant | null>(null);
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initial check from localStorage or default demo workspace
    const initAuth = async () => {
      const token = localStorage.getItem('omniflow_token');
      if (token) {
        try {
          const profile = await ApiClient.get('/auth/me');
          setUser(profile);
          setWorkspaces(profile.workspaces || []);
          const savedTenantId = localStorage.getItem('omniflow_active_tenant_id');
          const current = (profile.workspaces || []).find((w: any) => w.id === savedTenantId) || profile.workspaces?.[0];
          if (current) {
            setActiveTenant(current);
            localStorage.setItem('omniflow_active_tenant_id', current.id);
          }
        } catch {
          setDefaultDemo();
        }
      } else {
        setDefaultDemo();
      }
      setIsLoading(false);
    };

    const setDefaultDemo = () => {
      // High-fidelity active demo state for instant exploratory experience
      const demoUser: AuthenticatedUser = {
        id: 'user-apex-owner',
        name: 'Mitul Chowdhury',
        email: 'mitul@apexstore.com',
        isSuperAdmin: false,
        tenantId: 'tenant-apex-1',
        role: WorkspaceRole.OWNER,
      };
      const demoTenant: ActiveTenant = {
        id: 'tenant-apex-1',
        name: 'Apex Lifestyle & Tech',
        slug: 'apex-store',
        currency: 'BDT',
        creditBalance: 2480,
        role: WorkspaceRole.OWNER,
      };
      setUser(demoUser);
      setActiveTenant(demoTenant);
      setWorkspaces([demoTenant]);
      localStorage.setItem('omniflow_active_tenant_id', demoTenant.id);
    };

    initAuth();
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await ApiClient.post('/auth/login', { email, password: pass });
    localStorage.setItem('omniflow_token', res.token);
    setUser(res.user);
    setActiveTenant(res.activeTenant);
    setWorkspaces(res.workspaces || []);
    if (res.activeTenant?.id) {
      localStorage.setItem('omniflow_active_tenant_id', res.activeTenant.id);
    }
  };

  const register = async (name: string, email: string, pass: string, workspaceName?: string) => {
    const res = await ApiClient.post('/auth/register', {
      name,
      email,
      password: pass,
      workspaceName,
    });
    localStorage.setItem('omniflow_token', res.token);
    setUser(res.user);
    setActiveTenant(res.tenant);
    setWorkspaces([res.tenant]);
    if (res.tenant?.id) {
      localStorage.setItem('omniflow_active_tenant_id', res.tenant.id);
    }
  };

  const logout = () => {
    localStorage.removeItem('omniflow_token');
    localStorage.removeItem('omniflow_active_tenant_id');
    setUser(null);
    setActiveTenant(null);
    setWorkspaces([]);
  };

  const switchWorkspace = async (tenantId: string) => {
    try {
      const res = await ApiClient.post('/auth/switch-workspace', { tenantId });
      localStorage.setItem('omniflow_token', res.token);
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
