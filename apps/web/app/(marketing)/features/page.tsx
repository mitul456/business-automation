'use client';

import React from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  Bot,
  Sparkles,
  Camera,
  Mic,
  CreditCard,
  Truck,
  Zap,
  Shield,
  Layers,
  ArrowRight,
  CheckCircle2,
  Clock,
  RefreshCw,
  Sliders,
  DollarSign,
} from 'lucide-react';
import { Button, Badge, Card } from '@omniflow/ui';

export default function FeaturesPage() {
  const featureList = [
    {
      badge: 'Core Communication',
      title: 'Unified Omnichannel Inbox',
      description:
        'Eliminate chaotic multi-app tab hopping. Centralize customer chats from Facebook Messenger, Instagram DM, and WhatsApp Business Cloud API in one shared workspace.',
      icon: MessageSquare,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
      highlights: [
        'Real-time WebSocket streaming with zero lag',
        'Multi-agent conversation assignment & internal staff notes',
        'Filter by channel, unread count, and customer VIP tags',
        '1-click human handover mode when personal touch is needed',
      ],
    },
    {
      badge: 'Multimodal AI',
      title: 'Multimodal AI Sales Agent',
      description:
        'Powered by OpenAI GPT-4o with fine-tuned conversational intelligence for South Asian e-commerce. Speaks fluent English, Bengali (বাংলা), and Banglish.',
      icon: Bot,
      color: 'text-violet-600 bg-violet-50 border-violet-100',
      highlights: [
        'Understands natural customer queries and slang',
        'Consults real-time inventory and pricing automatically',
        'Generates rich interactive product buy cards inside chat',
        'Configurable agent personality, tone, and strict guardrails',
      ],
    },
    {
      badge: 'Computer Vision',
      title: 'Visual Product Recognition',
      description:
        'Customers frequently send photos or screenshots from other pages asking "Do you have this?". OmniFlow AI scans images and matches your inventory in seconds.',
      icon: Camera,
      color: 'text-pink-600 bg-pink-50 border-pink-100',
      highlights: [
        'Extracts color, pattern, category, and visual attributes',
        'Searches store catalog using vector similarity search',
        'Returns exact match or closest matching stock alternatives',
        'Enables instantaneous 1-click cart addition from photos',
      ],
    },
    {
      badge: 'Speech Intelligence',
      title: 'Voice Message Understanding',
      description:
        'Over 40% of Bangladeshi social media buyers send voice clips instead of typing. Whisper-1 transcribes audio messages into actionable text in real time.',
      icon: Mic,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
      highlights: [
        'Transcribes Bengali and English regional audio clips',
        'AI agents interpret customer intent directly from transcripts',
        'Provides readable transcriptions for human support agents',
        'Audio waveforms with playback speed control (1x, 1.5x, 2x)',
      ],
    },
    {
      badge: 'Regional & Global Payments',
      title: 'bKash, Nagad & Stripe Checkout',
      description:
        'Send secure tokenized payment links directly inside conversations. Verify payments server-side and trigger instant order confirmation.',
      icon: CreditCard,
      color: 'text-amber-600 bg-amber-50 border-amber-100',
      highlights: [
        'bKash Tokenized Checkout (Sandbox & Production verified)',
        'Nagad Direct Payment Gateway integration',
        'Stripe Checkout for international debit and credit cards',
        'Cash on Delivery (COD) workflow with automated phone confirmation',
      ],
    },
    {
      badge: 'Logistics Automation',
      title: '1-Click Steadfast & Pathao Courier',
      description:
        'Create parcels, fetch consignment IDs, print packaging receipts, and monitor delivery status directly from the order sidebar.',
      icon: Truck,
      color: 'text-sky-600 bg-sky-50 border-sky-100',
      highlights: [
        'Instant parcel creation via official Steadfast Courier API',
        'Real-time consignment tracking (`ST-XXXXXXXX`) updates',
        'Automatic order status transition from Shipped to Delivered',
        'Live merchant courier account balance inquiries',
      ],
    },
    {
      badge: 'Lifecycle Marketing',
      title: 'Meta 24h-Compliant Workflow Engine',
      description:
        'Automate cart abandonment follow-ups, post-delivery feedback surveys, and VIP customer reward sequences without violating Meta policies.',
      icon: Zap,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
      highlights: [
        'Event-driven triggers: New Conversation, Cart Inactivity, Status Change',
        'Automated 2-hour cart reminder with discount incentives',
        'Scheduled follow-ups and calendar appointment bookings',
        'Visual multi-step trigger and action builder',
      ],
    },
    {
      badge: 'Architecture & Trust',
      title: 'Multi-Tenant Security & Isolation',
      description:
        'Engineered for maximum reliability with bank-level encryption, tenant isolation, and strict server-side authorization.',
      icon: Shield,
      color: 'text-slate-700 bg-slate-100 border-slate-200',
      highlights: [
        'AES-256-GCM encryption for all third-party API credentials',
        'Row-level tenant data isolation with compound database indexes',
        'Raw body HMAC-SHA256 signature verification on webhooks',
        'Metered credit billing ledger with complete audit logging',
      ],
    },
  ];

  return (
    <div className="space-y-24 py-16">
      {/* Hero Header */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        <Badge variant="purple" size="md">
          Platform Architecture & Capabilities
        </Badge>
        <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-[1.15]">
          Autonomous Commerce Infrastructure for{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
            High-Growth Brands
          </span>
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          From the first customer inquiry on WhatsApp to tokenized bKash payment verification and courier parcel dispatch, OmniFlow automates every stage of social commerce.
        </p>
        <div className="flex items-center justify-center gap-4 pt-2">
          <Link href="/register">
            <Button size="lg" className="shadow-md shadow-indigo-300">
              Start 14-Day Free Trial
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" size="lg">
              Explore Live Console
            </Button>
          </Link>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {featureList.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <Card key={idx} className="p-8 border-slate-200/90 hover:shadow-xl transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${feat.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <Badge variant="secondary" size="sm">
                      {feat.badge}
                    </Badge>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{feat.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
                    {feat.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-2.5">
                  {feat.highlights.map((h, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Conversion Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-8 sm:p-14 text-white text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="relative z-10 max-w-3xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Ready to automate customer conversations and 10x your sales?
            </h2>
            <p className="text-sm sm:text-base text-indigo-200 leading-relaxed">
              Join leading e-commerce merchants in Bangladesh and worldwide. Connect your Facebook Page and WhatsApp number in less than 3 minutes.
            </p>
            <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
              <Link href="/register">
                <Button size="lg" className="bg-white text-indigo-900 hover:bg-slate-100 font-bold px-8 shadow-lg">
                  Create Workspace Free
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="outline" size="lg" className="text-white border-indigo-400/50 hover:bg-white/10">
                  Talk to Sales Team
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
