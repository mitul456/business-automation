'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n-context';
import {
  LayoutDashboard,
  MessageSquare,
  Bot,
  Package,
  ShoppingCart,
  Users,
  Target,
  Clock,
  Calendar,
  BookOpen,
  Zap,
  TrendingUp,
  UserCheck,
  CreditCard,
  Settings,
  Layers,
  Globe,
  Plus,
  Coins,
  ChevronDown,
  LogOut,
  Bell,
  Search,
  ShieldAlert,
  Menu,
  X,
  CheckCircle2,
  Check,
  Building2,
  Sliders,
} from 'lucide-react';
import { Button, Badge } from '@omniflow/ui';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, activeTenant, workspaces, switchWorkspace, logout, isLoading } = useAuth();
  const { locale, setLocale, t } = useI18n();

  // Route Protection: Unauthenticated users are redirected to login
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [user, isLoading, router]);

  // Dropdown States
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Notification State
  const [unreadNotifications, setUnreadNotifications] = useState([
    {
      id: 'notif-1',
      title: 'New WhatsApp Order Confirmed',
      desc: 'Rahim Chowdhury placed order #ORD-9421 (৳২,৮৫০ BDT) via WhatsApp AI.',
      time: '3 mins ago',
      unread: true,
      type: 'order',
    },
    {
      id: 'notif-2',
      title: 'Steadfast Consignment Delivered',
      desc: 'Parcel ST-942851 was successfully delivered to Gulshan-1 customer.',
      time: '18 mins ago',
      unread: true,
      type: 'courier',
    },
    {
      id: 'notif-3',
      title: 'Human Handover Alert',
      desc: 'Customer Sabrina requested human agent in Messenger chat.',
      time: '42 mins ago',
      unread: true,
      type: 'handover',
    },
  ]);

  const markAllRead = () => {
    setUnreadNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const navItems = [
    { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Inbox', href: '/inbox', icon: MessageSquare, badge: '3' },
    { label: 'AI Agents', href: '/ai-agent', icon: Bot },
    { label: 'Channels', href: '/channels', icon: Layers },
    { label: 'Products', href: '/products', icon: Package },
    { label: 'Orders', href: '/orders', icon: ShoppingCart },
    { label: 'Customers', href: '/customers', icon: Users },
    { label: 'Leads', href: '/leads', icon: Target },
    { label: 'Follow-ups', href: '/followups', icon: Clock },
    { label: 'Bookings', href: '/bookings', icon: Calendar },
    { label: 'Knowledge Base', href: '/knowledge', icon: BookOpen },
    { label: 'Automations', href: '/workflows', icon: Zap },
    { label: 'Analytics', href: '/analytics', icon: TrendingUp },
    { label: 'Team', href: '/team', icon: UserCheck },
    { label: 'Billing', href: '/billing', icon: CreditCard },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Authenticating session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      {/* Desktop Sidebar Navigation */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-slate-200/80 flex-col shrink-0 z-30 select-none">
        {/* Brand & Workspace Header */}
        <div className="p-4 border-b border-slate-100">
          <Link href="/" className="flex items-center gap-2.5 mb-3 group">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-300">
              <Bot className="w-4 h-4" />
            </div>
            <div className="flex items-center">
              <span className="font-extrabold text-base tracking-tight text-slate-900">
                Omni<span className="text-indigo-600">Flow</span>
              </span>
              <span className="text-[10px] ml-1.5 px-1.5 py-0.2 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                AI
              </span>
            </div>
          </Link>

          {/* Workspace Switcher Button */}
          <div className="relative">
            <button
              onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/90 hover:bg-slate-100/80 text-left transition-colors cursor-pointer"
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

            {/* Workspace Dropdown */}
            {showWorkspaceMenu && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-1.5 space-y-1 animate-in fade-in-50 zoom-in-95">
                <p className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Select Workspace
                </p>
                {workspaces.map((ws) => (
                  <button
                    key={ws.id}
                    onClick={() => {
                      switchWorkspace(ws.id);
                      setShowWorkspaceMenu(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      ws.id === activeTenant?.id
                        ? 'bg-indigo-50 text-indigo-700 font-bold'
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

        {/* 16-Item Navigation Menu */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200 font-semibold'
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
                      isActive ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Super-Admin Link - Strictly isolated for Super Admin role only */}
        {user?.isSuperAdmin && (
          <div className="p-3 border-t border-slate-100">
            <Link
              href="/admin"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Super-Admin Governance</span>
            </Link>
          </div>
        )}

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
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Mobile Slide-Out Sidebar Drawer */}
      {mobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative w-72 max-w-[80vw] bg-white h-full flex flex-col z-50 shadow-2xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                  <Bot className="w-4 h-4" />
                </div>
                <span className="font-bold text-base text-slate-900">OmniFlow AI</span>
              </div>
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileSidebarOpen(false)}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium ${
                      isActive
                        ? 'bg-indigo-600 text-white font-semibold'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-indigo-100 text-indigo-700">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Mobile Super-Admin Switch - Isolated for Super Admin only */}
            {user?.isSuperAdmin && (
              <div className="pt-2 border-t border-slate-100">
                <Link
                  href="/admin"
                  onClick={() => setMobileSidebarOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>Super-Admin Governance</span>
                </Link>
              </div>
            )}

            {/* Mobile User Profile & Sign Out */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 truncate">
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                  {user?.name ? user.name[0] : 'U'}
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold text-slate-800 truncate">{user?.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={logout}
                title="Sign out"
                className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main App Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-14 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between z-20">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Quick Search */}
            <div className="relative w-48 sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={t.common?.search || 'Search chats, orders, products...'}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600"
              />
            </div>
          </div>

          {/* Right Header Action Cluster */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Switcher */}
            <button
              onClick={() => setLocale(locale === 'en' ? 'bn' : 'en')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
              title="Toggle English / Bengali"
            >
              <Globe className="w-3.5 h-3.5 text-indigo-600" />
              <span>{locale === 'en' ? 'বাংলা' : 'EN'}</span>
            </button>

            {/* AI Credits Pill */}
            <Link
              href="/billing"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 transition-colors text-xs font-bold"
            >
              <Coins className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">{activeTenant?.creditBalance ?? 2480} Credits</span>
              <span className="sm:hidden">{activeTenant?.creditBalance ?? 2480}</span>
              <Plus className="w-3 h-3 ml-0.5" />
            </Link>

            {/* Notification Center */}
            <div className="relative">
              <button
                onClick={() => setShowNotificationMenu(!showNotificationMenu)}
                className="relative p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifications.some((n) => n.unread) && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                )}
              </button>

              {/* Notification Popover */}
              {showNotificationMenu && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 z-50 space-y-3 animate-in fade-in-50 zoom-in-95">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="font-bold text-xs text-slate-900">Notifications</span>
                    <button
                      onClick={markAllRead}
                      className="text-[11px] text-indigo-600 hover:underline font-semibold cursor-pointer"
                    >
                      Mark all as read
                    </button>
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {unreadNotifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-2.5 rounded-xl border text-xs space-y-1 transition-colors ${
                          notif.unread
                            ? 'bg-indigo-50/50 border-indigo-100'
                            : 'bg-white border-slate-100 text-slate-500'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-slate-900">{notif.title}</p>
                          <span className="text-[10px] text-slate-400">{notif.time}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-snug">{notif.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  {user?.name ? user.name[0] : 'M'}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
              </button>

              {/* Profile Dropdown */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-2xl p-2 z-50 space-y-1 animate-in fade-in-50 zoom-in-95">
                  <div className="p-2 border-b border-slate-100">
                    <p className="font-bold text-xs text-slate-900">{user?.name || 'Mitul Chowdhury'}</p>
                    <p className="text-[10px] text-slate-400">{user?.email || 'mitul@apexstore.com'}</p>
                    <div className="mt-1.5">
                      <Badge variant="indigo" size="sm">Workspace Owner</Badge>
                    </div>
                  </div>

                  <Link
                    href="/settings"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-700 hover:bg-slate-100"
                  >
                    <Settings className="w-3.5 h-3.5" /> Workspace Settings
                  </Link>
                  <Link
                    href="/team"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-700 hover:bg-slate-100"
                  >
                    <UserCheck className="w-3.5 h-3.5" /> Manage Team Seats
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setShowProfileMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-rose-600 hover:bg-rose-50 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
