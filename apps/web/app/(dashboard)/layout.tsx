'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n-context';
import {
  LayoutDashboard,
  MessageSquare,
  Bot,
  Package,
  ShoppingCart,
  Users,
  BookOpen,
  Zap,
  Calendar,
  Layers,
  CreditCard,
  UserCheck,
  Globe,
  Plus,
  Coins,
  ChevronDown,
  LogOut,
  Bell,
  Search,
  ShieldAlert,
} from 'lucide-react';
import { Button, Badge } from '@omniflow/ui';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, activeTenant, workspaces, switchWorkspace, logout } = useAuth();
  const { locale, setLocale, t } = useI18n();
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);

  const navItems = [
    { label: t.nav.analytics || 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: t.nav.inbox, href: '/dashboard/inbox', icon: MessageSquare, badge: '3' },
    { label: t.nav.aiAgent, href: '/dashboard/ai-agent', icon: Bot },
    { label: t.nav.catalog, href: '/dashboard/products', icon: Package },
    { label: t.nav.orders, href: '/dashboard/orders', icon: ShoppingCart },
    { label: t.nav.crm, href: '/dashboard/customers', icon: Users },
    { label: t.nav.knowledge, href: '/dashboard/knowledge', icon: BookOpen },
    { label: t.nav.workflows, href: '/dashboard/workflows', icon: Zap },
    { label: t.nav.bookings, href: '/dashboard/bookings', icon: Calendar },
    { label: 'Integrations Hub', href: '/dashboard/integrations', icon: Layers },
    { label: t.nav.billing, href: '/dashboard/billing', icon: CreditCard },
    { label: 'Team & Roles', href: '/dashboard/team', icon: UserCheck },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col shrink-0 z-30 select-none">
        {/* Brand & Workspace Header */}
        <div className="p-4 border-b border-slate-100">
          <Link href="/" className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <Bot className="w-4 h-4" />
            </div>
            <span className="font-bold text-base tracking-tight text-slate-900">
              Omni<span className="text-indigo-600">Flow</span> AI
            </span>
          </Link>

          {/* Workspace Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
              className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/80 hover:bg-slate-100/80 text-left transition-colors"
            >
              <div className="truncate">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {activeTenant?.name || 'Apex Lifestyle & Tech'}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {activeTenant?.creditBalance ?? 2480} AI Credits
                  </span>
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>

            {/* Dropdown Menu */}
            {showWorkspaceMenu && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-1.5 space-y-1">
                <p className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Workspaces
                </p>
                {workspaces.map((ws) => (
                  <button
                    key={ws.id}
                    onClick={() => {
                      switchWorkspace(ws.id);
                      setShowWorkspaceMenu(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      ws.id === activeTenant?.id
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="truncate">{ws.name}</span>
                    <Badge size="sm">{ws.role || 'OWNER'}</Badge>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-indigo-100 text-indigo-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Super Admin Switcher (If Super Admin) */}
        <div className="p-3 border-t border-slate-100">
          <Link
            href="/admin"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Super-Admin Console</span>
          </Link>
        </div>

        {/* User Card */}
        <div className="p-3 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 truncate">
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
              {user?.name ? user.name[0] : 'M'}
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-slate-800 truncate">{user?.name || 'Mitul Chowdhury'}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email || 'mitul@apexstore.com'}</p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Log out"
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-14 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between z-20">
          {/* Search bar */}
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={t.common.search}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600"
            />
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <button
              onClick={() => setLocale(locale === 'en' ? 'bn' : 'en')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-indigo-600" />
              <span>{locale === 'en' ? 'বাংলা' : 'English'}</span>
            </button>

            {/* AI Credits Pill */}
            <Link
              href="/dashboard/billing"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 hover:bg-indigo-100 transition-colors text-xs font-bold"
            >
              <Coins className="w-3.5 h-3.5 text-indigo-600" />
              <span>{activeTenant?.creditBalance ?? 2480} Credits</span>
              <Plus className="w-3 h-3 ml-0.5" />
            </Link>

            {/* Notifications */}
            <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              <Bell className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
