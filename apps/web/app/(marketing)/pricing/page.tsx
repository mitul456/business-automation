'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, XCircle, Sparkles, HelpCircle, ArrowRight } from 'lucide-react';
import { Button, Badge, Card } from '@omniflow/ui';

export default function PricingPage() {
  const [currency, setCurrency] = useState<'BDT' | 'USD'>('BDT');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const plans = [
    {
      name: 'Starter',
      badge: 'Boutique Stores',
      description: 'Perfect for new shops and solo sellers launching on Facebook & WhatsApp.',
      priceBDT: billingCycle === 'monthly' ? '১,৯৫০' : '১,৫৬০',
      priceUSD: billingCycle === 'monthly' ? '$19' : '$15',
      credits: '1,500 AI Credits / month',
      popular: false,
      channels: '1 Facebook Page + 1 WhatsApp Number',
      features: [
        'Unified Team Inbox',
        'GPT-4o Conversational AI Agent',
        'Standard Product Catalog (Up to 100 products)',
        'Cash on Delivery & bKash Manual Verifier',
        'Steadfast Courier 1-Click Parcel Booking',
        '2 Team Member Seats',
        'Email Support (24h SLA)',
      ],
      unavailable: [
        'GPT-4o Vision Photo Recognition',
        'Whisper Voice Note Transcription',
        'Automated Abandoned Cart Sequences',
        'Nagad & Stripe Tokenized Checkout',
        'Custom AI Personality & Guardrails',
      ],
    },
    {
      name: 'Growth Pro',
      badge: 'Most Popular',
      description: 'For established brands seeking 24/7 autonomous sales and customer care.',
      priceBDT: billingCycle === 'monthly' ? '৪,৯৫০' : '৩,৯৬০',
      priceUSD: billingCycle === 'monthly' ? '$49' : '$39',
      credits: '10,000 AI Credits / month',
      popular: true,
      channels: 'Unlimited Channels (FB, IG & WhatsApp)',
      features: [
        'Unified Inbox with Multi-Channel Filter',
        'Multimodal AI (Text + Voice + Vision)',
        'Whisper STT Audio Voice Transcription',
        'GPT-4o Vision Product Image Scanner',
        'Unlimited Products & Variant Tracking',
        'bKash, Nagad & Stripe Tokenized API',
        'Steadfast & Pathao Courier Automation',
        'Automated Cart Abandonment Sequences',
        '5 Team Member Seats',
        'Priority Chat & WhatsApp Support',
      ],
      unavailable: [
        'Dedicated Enterprise Account Manager',
        'Custom Dedicated Model Fine-Tuning',
      ],
    },
    {
      name: 'Enterprise',
      badge: 'High-Volume Retail',
      description: 'Dedicated infrastructure, custom model tuning, and priority onboarding.',
      priceBDT: billingCycle === 'monthly' ? '১২,৫০০' : '১০,০০০',
      priceUSD: billingCycle === 'monthly' ? '$120' : '$99',
      credits: '50,000+ AI Credits / month',
      popular: false,
      channels: 'Unlimited Channels + Multiple Brands',
      features: [
        'Everything in Growth Pro included',
        'Custom AI Fine-tuning on Store Data',
        'Custom RAG Vector Knowledge Base (100MB+)',
        'Unlimited Team Member Seats & RBAC',
        'Custom Webhook Integrations & ERP Sync',
        '99.9% Uptime SLA Agreement',
        'Dedicated Technical Account Manager',
        'VIP Phone & WhatsApp Dedicated Channel',
      ],
      unavailable: [],
    },
  ];

  const creditPackages = [
    { credits: '1,000 AI Credits', bdt: '৳৩৫০ BDT', usd: '$3.50 USD', desc: '~1,000 text replies or 200 voice transcriptions' },
    { credits: '5,000 AI Credits', bdt: '৳১,৫০০ BDT', usd: '$15.00 USD', desc: '~5,000 text replies or 500 vision scans', bestValue: true },
    { credits: '20,000 AI Credits', bdt: '৳৫,০০০ BDT', usd: '$50.00 USD', desc: '~20,000 text replies or high-volume sales campaign' },
  ];

  return (
    <div className="space-y-24 py-16">
      {/* Header & Controls */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        <Badge variant="purple" size="md">
          Simple, Transparent Pricing
        </Badge>
        <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
          Predictable Plans Designed for{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
            Real ROI
          </span>
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          No hidden fees or unexpected surcharges. Choose your currency, billing cadence, and scale your sales with automated AI.
        </p>

        {/* Currency & Billing Cadence Toggle */}
        <div className="flex flex-wrap items-center justify-center gap-6 pt-4">
          {/* Currency Toggle */}
          <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-100 p-1 text-xs font-semibold">
            <button
              onClick={() => setCurrency('BDT')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                currency === 'BDT' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ৳ BDT (Bangladesh)
            </button>
            <button
              onClick={() => setCurrency('USD')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                currency === 'USD' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              $ USD (International)
            </button>
          </div>

          {/* Billing Cycle Toggle */}
          <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-100 p-1 text-xs font-semibold">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                billingCycle === 'monthly' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                billingCycle === 'yearly' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Annual Billing</span>
              <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.5">
                Save 20%
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {plans.map((p, idx) => (
            <Card
              key={idx}
              className={`p-8 flex flex-col justify-between transition-all ${
                p.popular
                  ? 'border-indigo-600 ring-2 ring-indigo-600 shadow-2xl relative bg-white'
                  : 'border-slate-200 hover:shadow-xl'
              }`}
            >
              {p.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="bg-indigo-600 text-white text-[11px] font-bold px-3.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                    {p.badge}
                  </span>
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">{p.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 min-h-[36px]">{p.description}</p>
                </div>

                <div className="border-y border-slate-100 py-4 space-y-1">
                  <div className="text-4xl font-extrabold text-slate-900">
                    {currency === 'BDT' ? `৳${p.priceBDT}` : p.priceUSD}
                    <span className="text-xs font-normal text-slate-500 ml-1.5">
                      / month {billingCycle === 'yearly' && '(billed annually)'}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-indigo-600">
                    {p.credits}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {p.channels}
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Included Features:
                  </p>
                  <ul className="space-y-2.5 text-xs text-slate-700">
                    {p.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                    {p.unavailable.map((unfeat, uIdx) => (
                      <li key={uIdx} className="flex items-start gap-2.5 text-slate-400 line-through">
                        <XCircle className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                        <span>{unfeat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-8">
                <Link href="/register">
                  <Button
                    variant={p.popular ? 'primary' : 'outline'}
                    size="lg"
                    className="w-full font-bold"
                  >
                    {p.name === 'Enterprise' ? 'Contact Enterprise Sales' : 'Start 14-Day Free Trial'}
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Credit Top-up Packages */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-8 space-y-6">
          <div className="text-center space-y-2">
            <h3 className="text-xl font-bold text-slate-900">
              Need Extra AI Credits? Top Up Anytime
            </h3>
            <p className="text-xs text-slate-500">
              Credits never expire as long as your subscription is active. 1 credit = 1 standard text AI generation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {creditPackages.map((cp, cIdx) => (
              <div
                key={cIdx}
                className={`rounded-xl border p-5 bg-white space-y-2 text-center transition-all ${
                  cp.bestValue ? 'border-indigo-500 ring-1 ring-indigo-500 shadow-md' : 'border-slate-200'
                }`}
              >
                {cp.bestValue && (
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                    Best Value
                  </span>
                )}
                <p className="font-bold text-base text-slate-900">{cp.credits}</p>
                <p className="text-xl font-extrabold text-indigo-600">
                  {currency === 'BDT' ? cp.bdt : cp.usd}
                </p>
                <p className="text-[11px] text-slate-500 leading-snug">{cp.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
