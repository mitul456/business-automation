'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ShieldAlert, ArrowLeft, LogOut, Lock } from 'lucide-react';
import { Button } from '@omniflow/ui';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();

  // Strict Client Route Guard: Only authentic Super Admin accounts can enter
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // Not logged in -> redirect to login
        router.replace('/login');
      } else if (!user.isSuperAdmin) {
        // Regular user attempted unauthorized URL access -> bounce to store dashboard
        router.replace('/dashboard');
      }
    }
  }, [user, isLoading, router]);

  // Block unauthorized rendering completely while verifying
  if (isLoading || !user || !user.isSuperAdmin) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-mono">Verifying Super-Admin Authorization...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Top Admin Bar */}
      <header className="h-16 bg-slate-950 border-b border-slate-800 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-white">
              Omni<span className="text-amber-400">Flow</span> Platform Super-Admin
            </span>
            <span className="text-[10px] ml-2 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono font-bold">
              ROOT CONSOLE
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 mr-2 text-xs text-slate-400 font-mono">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Authenticated: {user.email}</span>
          </div>
          <Link href="/dashboard">
            <Button size="sm" variant="outline" className="text-slate-200 border-slate-700 bg-slate-800 hover:bg-slate-700" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Return to Store Dashboard
            </Button>
          </Link>
          <Button
            size="sm"
            variant="outline"
            onClick={logout}
            className="text-rose-400 border-rose-900/50 bg-rose-950/30 hover:bg-rose-900/50 hover:text-rose-300"
            leftIcon={<LogOut className="w-4 h-4" />}
          >
            Sign Out
          </Button>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">{children}</main>
    </div>
  );
}
