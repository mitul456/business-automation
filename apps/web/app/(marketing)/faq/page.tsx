'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ChevronDown,
  Search,
  HelpCircle,
  MessageSquare,
  Bot,
  CreditCard,
  Truck,
  Shield,
  ArrowRight,
} from 'lucide-react';
import { Button, Input, Badge, Card } from '@omniflow/ui';

export default function FAQPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({
    'gen-0': true,
    'ai-0': true,
    'pay-0': true,
  });

  const toggleItem = (id: string) => {
    setOpenItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const categories = [
    {
      category: 'General & Getting Started',
      icon: HelpCircle,
      items: [
        {
          id: 'gen-0',
          q: 'What is OmniFlow AI and how does it help my business?',
          a: 'OmniFlow AI is an omnichannel business automation platform. It connects your Facebook Pages, Instagram accounts, and WhatsApp numbers into one collaborative inbox. An autonomous AI agent answers customer questions, captures orders, checks product inventory, accepts bKash/Nagad payments, and books Steadfast courier deliveries 24/7.',
        },
        {
          id: 'gen-1',
          q: 'Do I need programming skills or technical experience to set it up?',
          a: 'None at all. OmniFlow is a turnkey cloud SaaS platform. You connect your Facebook Page with standard Meta OAuth, scan a QR code for WhatsApp, add your products with prices, and your AI assistant is instantly live.',
        },
        {
          id: 'gen-2',
          q: 'Can human staff still reply to messages manually?',
          a: 'Yes, absolutely. The collaborative inbox is designed for seamless teamwork. Staff can take over any chat with one click, pause the AI agent, add private internal notes, and re-enable AI whenever needed.',
        },
      ],
    },
    {
      category: 'AI Multimodal Intelligence & Bengali Language',
      icon: Bot,
      items: [
        {
          id: 'ai-0',
          q: 'Can the AI understand Bengali (বাংলা) and Banglish?',
          a: 'Yes. OmniFlow is specifically fine-tuned for South Asian commerce. It natively understands formal Bengali, standard English, and colloquial Banglish (Bengali written in English letters like "bhai ei panjabi ta ki size 42 hobe?").',
        },
        {
          id: 'ai-1',
          q: 'How does Visual Product Recognition work?',
          a: 'When a customer sends a photo, screenshot, or design snippet, GPT-4o Vision scans the image, extracts category, color, and design attributes, searches your product catalog using semantic vector search, and replies with matching product cards and prices.',
        },
        {
          id: 'ai-2',
          q: 'How does customer voice note transcription work?',
          a: 'Whenever a customer sends an audio clip on WhatsApp or Messenger, OpenAI Whisper-1 automatically converts the voice message into clean text within 2 seconds. The AI agent reads the text and replies naturally.',
        },
      ],
    },
    {
      category: 'Payments (bKash/Nagad) & Courier Logistics',
      icon: CreditCard,
      items: [
        {
          id: 'pay-0',
          q: 'How does the bKash Tokenized Checkout work inside chat?',
          a: 'When an order is drafted, the AI agent or staff member generates a secure 1-click tokenized payment link. The customer clicks, pays via their bKash PIN in the official bKash gateway, and OmniFlow receives a verified server-to-server webhook confirmation instantly.',
        },
        {
          id: 'pay-1',
          q: 'Can I use Cash on Delivery (COD)?',
          a: 'Yes. Cash on Delivery is fully supported with automated phone number validation, address confirmation, and optional advance delivery fee collection via bKash.',
        },
        {
          id: 'pay-2',
          q: 'How does Steadfast Courier parcel dispatch work?',
          a: 'With one click on an order in your inbox sidebar, OmniFlow calls the official Steadfast Courier API, books the shipment, receives a consignment tracking ID (`ST-XXXXXXXX`), and sends a tracking link to the customer.',
        },
      ],
    },
    {
      category: 'Security, Privacy & Data Isolation',
      icon: Shield,
      items: [
        {
          id: 'sec-0',
          q: 'Is my customer data shared or used to train other AI models?',
          a: 'Never. OmniFlow enforces strict multi-tenant logical data isolation. Every query is filtered by your workspace tenant ID. All API credentials and tokens are encrypted at rest with AES-256-GCM. We never share or train on your customer conversations.',
        },
        {
          id: 'sec-1',
          q: 'Are Meta Graph API and WhatsApp official integrations?',
          a: 'Yes. OmniFlow connects exclusively through official Meta Graph API v20.0 and WhatsApp Business Cloud API with HMAC-SHA256 verified webhooks, ensuring 100% policy compliance.',
        },
      ],
    },
  ];

  return (
    <div className="space-y-20 py-16">
      {/* Header & Search */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        <Badge variant="purple" size="md">
          Help & Frequently Asked Questions
        </Badge>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          Everything You Need to Know About{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
            OmniFlow AI
          </span>
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
          Clear answers to common questions about our omnichannel inbox, multimodal AI models, bKash payments, and courier logistics.
        </p>

        {/* Search Bar */}
        <div className="max-w-md mx-auto pt-2">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search questions (e.g. bKash, voice note, Bengali)..."
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
          />
        </div>
      </section>

      {/* Accordion Categories */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {categories.map((cat, cIdx) => {
          const filteredItems = cat.items.filter(
            (it) =>
              !searchTerm ||
              it.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
              it.a.toLowerCase().includes(searchTerm.toLowerCase())
          );

          if (filteredItems.length === 0) return null;

          const Icon = cat.icon;

          return (
            <div key={cIdx} className="space-y-4">
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200">
                <Icon className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-bold text-slate-900">{cat.category}</h2>
              </div>

              <div className="space-y-3">
                {filteredItems.map((item) => {
                  const isOpen = !!openItems[item.id];
                  return (
                    <div
                      key={item.id}
                      className="rounded-xl border border-slate-200/90 bg-white overflow-hidden transition-all shadow-xs"
                    >
                      <button
                        onClick={() => toggleItem(item.id)}
                        className="w-full p-5 text-left flex items-center justify-between gap-4 font-semibold text-sm text-slate-900 hover:bg-slate-50/50 transition-colors"
                      >
                        <span>{item.q}</span>
                        <ChevronDown
                          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                            isOpen ? 'rotate-180 text-indigo-600' : ''
                          }`}
                        />
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/40">
                          {item.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </section>

      {/* Still have questions CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center space-y-4 shadow-sm">
          <h3 className="text-xl font-bold text-slate-900">Still have questions?</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            Our Dhaka-based product specialists and technical engineers are available to answer your questions via phone or WhatsApp.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link href="/contact">
              <Button variant="primary" size="md">
                Contact Support Team
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="outline" size="md">
                Create Free Account
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
