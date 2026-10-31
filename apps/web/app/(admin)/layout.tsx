'use client';

import React from 'react';
import Link from 'next/link';
import { Bot, ShieldAlert, ArrowLeft, Globe } from 'lucide-react';
import { Button } from '@omniflow/ui';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
          <Link href="/dashboard">
            <Button size="sm" variant="outline" className="text-slate-200 border-slate-700 bg-slate-800 hover:bg-slate-700" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Return to Store Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">{children}</main>
    </div>
  );
}
