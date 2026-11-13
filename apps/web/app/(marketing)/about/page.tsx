'use client';

import React from 'react';
import Link from 'next/link';
import {
  Bot,
  Sparkles,
  ShieldCheck,
  Zap,
  Globe,
  Users,
  Award,
  HeartHandshake,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { Button, Badge, Card } from '@omniflow/ui';

export default function AboutPage() {
  const stats = [
    { label: 'Conversations Handled', value: '4.8M+' },
    { label: 'Merchant GMV Processed', value: '৳৮৫০M+ BDT' },
    { label: 'Average AI Resolution Rate', value: '86.4%' },
    { label: 'First Response Time', value: '< 2.4 sec' },
  ];

  const values = [
    {
      title: 'Real, Functional Software',
      desc: 'We never deliver static mockups or superficial bots. OmniFlow executes real transactions, verifies live bKash payments, and books actual courier consignments.',
      icon: Zap,
    },
    {
      title: 'South Asian & Global First',
      desc: 'Engineered specifically for the nuances of social commerce in Bangladesh and emerging markets, with native Bengali language fluency and COD workflows.',
      icon: Globe,
    },
    {
      title: 'Multi-Tenant Data Privacy',
      desc: 'Your catalog, customer CRM records, and conversation histories are completely isolated with AES-256 encryption. We never train public models on your customer data.',
      icon: ShieldCheck,
    },
    {
      title: 'Human-in-the-Loop Collaboration',
      desc: 'AI is designed to empower human staff, not replace them. When high-ticket negotiations or sensitive inquiries arise, agents seamlessly take over.',
      icon: HeartHandshake,
    },
  ];

  return (
    <div className="space-y-24 py-16">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        <Badge variant="purple" size="md">
          Our Mission & Company Story
        </Badge>
        <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15] max-w-4xl mx-auto">
          Powering the Future of{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
            Autonomous Commerce
          </span>
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          OmniFlow was built to solve a critical problem faced by modern businesses: millions of customer inquiries flood social channels daily, but manual replies cause delayed sales, lost revenue, and exhausted staff.
        </p>
      </section>

      {/* Metrics Counter */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-slate-900 text-white p-10 sm:p-14 shadow-2xl">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {stats.map((s, idx) => (
              <div key={idx} className="space-y-2">
                <p className="text-3xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-300">
                  {s.value}
                </p>
                <p className="text-xs sm:text-sm text-slate-400 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story & Origins */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 text-slate-700 leading-relaxed text-sm sm:text-base">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 sm:p-12 space-y-6 shadow-sm">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Built for High-Growth Bangladeshi & Global Retailers
          </h2>
          <p>
            In Dhaka, Chittagong, and across the globe, social media is no longer just a marketing channel — it is the primary storefront. Thousands of merchants receive hundreds of Messenger inquiries, WhatsApp voice notes, and screenshot photos every hour.
          </p>
          <p>
            Traditional chatbots fail because they rely on rigid keyword trees. When a customer speaks in regional Banglish ("bhai ei red color shirt er size 40 hobe?"), generic bots break.
          </p>
          <p>
            OmniFlow combines OpenAI’s state-of-the-art GPT-4o multimodal reasoning with regional logistics and financial plumbing: official Meta Graph API v20.0, WhatsApp Cloud API, bKash Tokenized Checkout, and Steadfast Courier.
          </p>
        </div>
      </section>

      {/* Engineering Values */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 max-w-2xl mx-auto mb-16">
          <Badge variant="purple">Engineering Excellence</Badge>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            Our Guiding Engineering Principles
          </h2>
          <p className="text-sm text-slate-500">
            The core values behind every API, queue processor, and UI component we build.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {values.map((v, idx) => {
            const Icon = v.icon;
            return (
              <Card key={idx} className="p-8 border-slate-200/90 flex gap-5">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                  <Icon className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-lg text-slate-900">{v.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{v.desc}</p>
                </div>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
