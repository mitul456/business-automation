'use client';

import React from 'react';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n-context';
import { Bot, Sparkles, Globe, ArrowRight } from 'lucide-react';
import { Button } from '@omniflow/ui';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { locale, setLocale, t } = useI18n();

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white text-xs py-2 px-4 text-center font-medium flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-indigo-300 animate-pulse" />
        <span>Built for high-volume commerce in Bangladesh and global businesses. Support for bKash, Nagad, Steadfast & Stripe.</span>
      </div>

      {/* Main Navbar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <Bot className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">
              Omni<span className="text-indigo-600">Flow</span><span className="text-xs ml-1 px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">AI</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-indigo-600 transition-colors">Features</a>
            <a href="#omnichannel" className="hover:text-indigo-600 transition-colors">Omnichannel</a>
            <a href="#ai-brain" className="hover:text-indigo-600 transition-colors">Multimodal AI</a>
            <a href="#integrations" className="hover:text-indigo-600 transition-colors">bKash & Logistics</a>
            <a href="#pricing" className="hover:text-indigo-600 transition-colors">Pricing</a>
          </nav>

          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <button
              onClick={() => setLocale(locale === 'en' ? 'bn' : 'en')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-indigo-600" />
              <span>{locale === 'en' ? 'বাংলা' : 'English'}</span>
            </button>

            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>

            <Link href="/dashboard">
              <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Launch Console
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-sm border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
                  <Bot className="w-4 h-4" />
                </div>
                <span className="font-bold text-lg text-white">OmniFlow AI</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                The enterprise AI business automation platform. Automate customer support, capture orders, and integrate payments & logistics seamlessly.
              </p>
              <p className="text-xs text-slate-500">© 2026 OmniFlow Inc. All rights reserved.</p>
            </div>

            <div>
              <h4 className="font-semibold text-white text-xs uppercase tracking-wider mb-3">Product</h4>
              <ul className="space-y-2 text-xs">
                <li><Link href="/dashboard/inbox" className="hover:text-white">Unified Inbox</Link></li>
                <li><Link href="/dashboard/ai-agent" className="hover:text-white">AI Agent Persona</Link></li>
                <li><Link href="/dashboard/products" className="hover:text-white">Product Catalog</Link></li>
                <li><Link href="/dashboard/orders" className="hover:text-white">Order Pipeline</Link></li>
                <li><Link href="/dashboard/integrations" className="hover:text-white">bKash & Steadfast</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white text-xs uppercase tracking-wider mb-3">Integrations</h4>
              <ul className="space-y-2 text-xs">
                <li>Facebook Messenger</li>
                <li>Instagram Direct</li>
                <li>WhatsApp Cloud API</li>
                <li>bKash & Nagad</li>
                <li>Steadfast Courier & Pathao</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white text-xs uppercase tracking-wider mb-3">Security & Compliance</h4>
              <p className="text-xs text-slate-400 mb-2">
                Strict multi-tenant data isolation, AES-256 encrypted access tokens, official Meta Graph API webhooks, and audit logs.
              </p>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 text-[11px] text-emerald-400 border border-slate-700">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                SOC2 & Meta Platform Compliant
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
