'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useI18n } from '@/lib/i18n-context';
import {
  Bot,
  Sparkles,
  Globe,
  ArrowRight,
  Menu,
  X,
  MessageSquare,
  Zap,
  CreditCard,
  Truck,
  Shield,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react';
import { Button } from '@omniflow/ui';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { locale, setLocale } = useI18n();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Features', href: '/features' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'About', href: '/about' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Contact', href: '/contact' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      {/* Top Value Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white text-xs py-2 px-4 text-center font-medium flex items-center justify-center gap-2 border-b border-indigo-900/50">
        <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
        <span>
          Next-Gen AI Business Automation for Bangladesh & Global Brands • Official bKash, Nagad, Steadfast & Meta APIs
        </span>
      </div>

      {/* Main Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-200 group-hover:scale-105 transition-transform">
              <Bot className="w-5 h-5" />
            </div>
            <div className="flex items-center">
              <span className="font-extrabold text-xl tracking-tight text-slate-900">
                Omni<span className="text-indigo-600">Flow</span>
              </span>
              <span className="text-[10px] ml-1.5 px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                AI
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`transition-colors hover:text-indigo-600 ${
                  pathname === link.href ? 'text-indigo-600 font-semibold' : ''
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Action Cluster */}
          <div className="hidden md:flex items-center gap-3">
            {/* Language Switcher */}
            <button
              onClick={() => setLocale(locale === 'en' ? 'bn' : 'en')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors"
              title="Toggle Language"
            >
              <Globe className="w-3.5 h-3.5 text-indigo-600" />
              <span>{locale === 'en' ? 'বাংলা' : 'English'}</span>
            </button>

            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>

            <Link href="/register">
              <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                Get Started Free
              </Button>
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setLocale(locale === 'en' ? 'bn' : 'en')}
              className="p-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700"
            >
              {locale === 'en' ? 'বাংলা' : 'EN'}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-700 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-down Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top-2">
            <nav className="flex flex-col space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium ${
                    pathname === link.href
                      ? 'bg-indigo-50 text-indigo-600 font-semibold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full">
                  Sign In
                </Button>
              </Link>
              <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="primary" className="w-full">
                  Get Started Free
                </Button>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Main Page Content */}
      <main className="flex-1">{children}</main>

      {/* Rich Professional Footer */}
      <footer className="bg-slate-900 text-slate-400 text-sm border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
            {/* Col 1: Brand Info */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow-sm shadow-indigo-500/30">
                  <Bot className="w-4 h-4" />
                </div>
                <span className="font-extrabold text-xl text-white">OmniFlow AI</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                OmniFlow is the commercial-grade AI business automation platform. Connect social channels, automate sales and customer care with multimodal AI, process instant payments with bKash, and book courier consignments in one unified dashboard.
              </p>
              <div className="space-y-1.5 text-xs text-slate-400 pt-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>Level 8, Crystal Tower, Gulshan-1, Dhaka 1212, Bangladesh</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>support@omniflow.ai</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>+880 1800-OMNIFLOW (Mon-Sat, 9AM - 8PM)</span>
                </div>
              </div>
            </div>

            {/* Col 2: Product */}
            <div>
              <h4 className="font-semibold text-white text-xs uppercase tracking-wider mb-4">Product</h4>
              <ul className="space-y-2.5 text-xs">
                <li><Link href="/features" className="hover:text-white transition-colors">Omnichannel Inbox</Link></li>
                <li><Link href="/features" className="hover:text-white transition-colors">Multimodal AI Agents</Link></li>
                <li><Link href="/features" className="hover:text-white transition-colors">Visual Product Matching</Link></li>
                <li><Link href="/features" className="hover:text-white transition-colors">Whisper Voice STT</Link></li>
                <li><Link href="/features" className="hover:text-white transition-colors">bKash & Courier Hub</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing & Plans</Link></li>
              </ul>
            </div>

            {/* Col 3: Company */}
            <div>
              <h4 className="font-semibold text-white text-xs uppercase tracking-wider mb-4">Company</h4>
              <ul className="space-y-2.5 text-xs">
                <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="/faq" className="hover:text-white transition-colors">FAQ & Knowledge</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact Sales</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Credit Pricing</Link></li>
                <li><Link href="/dashboard" className="hover:text-white transition-colors">Business Dashboard</Link></li>
              </ul>
            </div>

            {/* Col 4: Platform */}
            <div>
              <h4 className="font-semibold text-white text-xs uppercase tracking-wider mb-4">Account & Access</h4>
              <ul className="space-y-2.5 text-xs">
                <li><Link href="/login" className="hover:text-white transition-colors">Business Sign In</Link></li>
                <li><Link href="/register" className="hover:text-white transition-colors">Free Registration</Link></li>
                <li><Link href="/dashboard" className="hover:text-white transition-colors">Launch App Console</Link></li>
                <li><a href="/documents.html" target="_blank" className="hover:text-white transition-colors">Platform Documentation</a></li>
                <li><span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Systems Operational</span></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <p>© 2026 OmniFlow Inc. All rights reserved. Built for Bangladesh & international businesses.</p>
            <div className="flex items-center gap-6">
              <Link href="/about" className="hover:text-slate-400">Privacy Policy</Link>
              <Link href="/about" className="hover:text-slate-400">Terms of Service</Link>
              <Link href="/about" className="hover:text-slate-400">Security & Isolation</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
