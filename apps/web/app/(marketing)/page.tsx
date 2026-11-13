'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n-context';
import {
  Bot,
  MessageSquare,
  Sparkles,
  Zap,
  ShieldCheck,
  Truck,
  CreditCard,
  Mic,
  Image as ImageIcon,
  CheckCircle2,
  ArrowRight,
  Send,
  ShoppingBag,
  TrendingUp,
  Headphones,
  Star,
  Layers,
  ChevronDown,
  Clock,
  Check,
  Play,
  LayoutDashboard,
  Filter,
} from 'lucide-react';
import { Button, Badge, Card } from '@omniflow/ui';

export default function MarketingPage() {
  const { locale } = useI18n();

  // Interactive AI Demo State
  const [demoInput, setDemoInput] = useState('আপনাদের নীল পাঞ্জাবিটার সাইজ ৪২ কি স্টকে আছে?');
  const [demoChat, setDemoChat] = useState<Array<{ sender: 'user' | 'ai'; text: string; hasCard?: boolean }>>([
    {
      sender: 'user',
      text: 'আসসালামু আলাইকুম, আপনাদের নীল পাঞ্জাবিটার সাইজ ৪২ কি স্টকে আছে?',
    },
    {
      sender: 'ai',
      text: 'ওয়ালাইকুম আসসালাম! জি, আমাদের "Royal Navy Blue Embroidered Panjabi" সাইজ ৪২ স্টকে অ্যাভেইলেবল আছে। মূল্য ২,৮৫০ টাকা। ক্যাশ অন ডেলিভারিতে হোম ডেলিভারি নিতে পারেন। আপনি কি এখনই অর্ডার করতে চান?',
      hasCard: true,
    },
  ]);
  const [isDemoTyping, setIsDemoTyping] = useState(false);

  // Interactive Automation Demo State
  const [activeWorkflowTab, setActiveWorkflowTab] = useState<'cart' | 'voice' | 'courier'>('cart');

  const handleSendDemoMessage = (textToSend?: string) => {
    const text = textToSend || demoInput;
    if (!text.trim()) return;

    setDemoChat((prev) => [...prev, { sender: 'user', text }]);
    setDemoInput('');
    setIsDemoTyping(true);

    setTimeout(() => {
      let reply = 'ধন্যবাদ! আপনার অর্ডারটি ড্রাফট করা হয়েছে। ঢাকার ভেতরে ৬০ টাকা এবং বাইরে ১২০ টাকা ডেলিভারি চার্জ। ক্যাশ অন ডেলিভারি নাকি বিকাশে পে করতে চান?';
      let hasCard = false;

      if (text.includes('ছবি') || text.includes('photo') || text.includes('ঘড়ি') || text.includes('watch')) {
        reply = 'আমরা আপনার পাঠানো পণ্যটি আমাদের ক্যাটালগে শনাক্ত করেছি: "Apex Ultra Smart Watch (AMOLED Bluetooth)"। অফার প্রাইজ ৩,৪৫০ টাকা!';
        hasCard = true;
      } else if (text.includes('voice') || text.includes('ভয়েস') || text.includes('audio')) {
        reply = 'আপনার অডিও মেসেজটি ট্রান্সক্রাইব করা হয়েছে: "আমি ২ পিস নিতে চাচ্ছি"। আমরা এখনই কনফার্মেশন লিংক পাঠাচ্ছি!';
      }

      setDemoChat((prev) => [...prev, { sender: 'ai', text: reply, hasCard }]);
      setIsDemoTyping(false);
    }, 750);
  };

  const testimonials = [
    {
      quote:
        'OmniFlow AI changed our business overnight. We receive over 400 messages a day during Eid sales. Previously, 6 agents worked overtime; now the AI handles 85% of queries, accepts bKash, and creates Steadfast parcels instantly.',
      name: 'Rahim Chowdhury',
      role: 'Founder & CEO',
      company: 'Apex Heritage Wear, Dhaka',
      rating: 5,
    },
    {
      quote:
        'The Voice Note Transcription is unbelievable. In Bangladesh, half our customers send WhatsApp voice clips. OmniFlow transcribes Bengali audio and confirms the order with no human intervention.',
      name: 'Nusrat Jahan',
      role: 'Head of Operations',
      company: 'Dhaka Glamour & Cosmetics',
      rating: 5,
    },
    {
      quote:
        'The tokenized bKash integration inside chat increased our conversion by 34%. Customers do not have to leave Messenger or WhatsApp to make payments.',
      name: 'Farhan Kabir',
      role: 'Managing Director',
      company: 'GadgetZone Bangladesh',
      rating: 5,
    },
  ];

  const landingFaqs = [
    {
      q: 'How fast can I set up OmniFlow AI?',
      a: 'Under 3 minutes. Connect your Facebook Page via official Meta OAuth, link your WhatsApp number, add your products with prices, and the AI agent is active immediately.',
    },
    {
      q: 'Does it support Bengali and Banglish?',
      a: 'Yes! OmniFlow natively understands formal Bengali, standard English, and colloquial Banglish, tailoring its replies to your preferred brand tone.',
    },
    {
      q: 'How does Steadfast Courier integration work?',
      a: 'With one click on an order in the inbox sidebar, OmniFlow calls the official Steadfast API, books the shipment, receives a consignment tracking code, and notifies the customer automatically.',
    },
    {
      q: 'Can I take over conversations manually?',
      a: 'Always. OmniFlow has a built-in 1-click "Human Handover" mode that pauses AI responses for that conversation and notifies your support team.',
    },
  ];

  return (
    <div className="space-y-28 pb-24 overflow-hidden">
      {/* 1. Hero Section */}
      <section className="relative pt-16 pb-12 sm:pt-24 sm:pb-20 bg-gradient-to-b from-indigo-50/60 via-slate-50/30 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6 max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-semibold shadow-xs">
              <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
              <span>The Autonomous AI Business Platform for Bangladesh & Global Brands</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.12]">
              Turn Social Chats Into{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-600">
                Automated Revenue
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
              Connect Messenger, Instagram, and WhatsApp. Multimodal AI closes sales, transcribes customer voice notes, recognizes product photos, accepts bKash, and dispatches Steadfast parcels automatically.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link href="/register">
                <Button size="lg" className="px-8 shadow-lg shadow-indigo-300 font-bold">
                  Start 14-Day Free Trial
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" size="lg" className="border-slate-300 hover:bg-slate-50">
                  Launch Live Console
                </Button>
              </Link>
            </div>

            {/* Integration Logos Bar */}
            <div className="pt-8 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-semibold text-slate-500">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                <span>Meta Messenger & IG</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>WhatsApp Cloud API</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-pink-600"></span>
                <span>bKash Tokenized</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-600"></span>
                <span>Nagad Direct</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                <span>Steadfast & Pathao</span>
              </div>
            </div>
          </div>

          {/* 2. Product Dashboard Preview */}
          <div className="mt-14 max-w-5xl mx-auto rounded-3xl border border-slate-200/90 bg-white shadow-2xl p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span>
                  <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
                  <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
                </div>
                <span className="text-xs font-semibold text-slate-500">
                  OmniFlow Command Center • Apex Lifestyle & Tech (Live)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="indigo" size="sm">
                  AI Active: 24/7
                </Badge>
                <Badge variant="success" size="sm">
                  bKash Live
                </Badge>
              </div>
            </div>

            {/* Dashboard Mockup Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <p className="text-[11px] font-semibold text-slate-400 uppercase">Monthly Revenue</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">৳৪,৮৫,২০০</p>
                <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" /> +28.4% vs last month
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <p className="text-[11px] font-semibold text-slate-400 uppercase">AI Resolution Rate</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">86.4%</p>
                <p className="text-xs text-indigo-600 font-medium mt-1">
                  3,120 of 3,610 chats automated
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <p className="text-[11px] font-semibold text-slate-400 uppercase">Orders Captured</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">648</p>
                <p className="text-xs text-emerald-600 font-semibold mt-1">
                  ৳৩,২৪০ Avg Basket Value
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <p className="text-[11px] font-semibold text-slate-400 uppercase">Steadfast Dispatches</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">582</p>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  98.2% on-time delivery
                </p>
              </div>
            </div>
          </div>

          {/* 3. Interactive Live AI Console Simulation */}
          <div className="mt-14 max-w-4xl mx-auto rounded-3xl border border-slate-200/90 bg-white shadow-2xl shadow-slate-200/50 overflow-hidden">
            <div className="bg-slate-900 px-5 py-3.5 flex items-center justify-between text-white border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                </div>
                <span className="text-xs font-semibold tracking-wide text-slate-300">
                  OmniFlow AI Multimodal Live Simulator
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="purple" size="sm">
                  Active Model: GPT-4o
                </Badge>
                <Badge variant="success" size="sm">
                  RAG Connected
                </Badge>
              </div>
            </div>

            <div className="p-6 bg-slate-50/60 min-h-[340px] flex flex-col justify-between">
              {/* Chat Thread */}
              <div className="space-y-4 overflow-y-auto max-h-[300px] pr-2">
                {demoChat.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-3 ${
                      msg.sender === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {msg.sender === 'ai' && (
                      <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 text-xs font-bold shadow-sm">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}
                    <div
                      className={`max-w-md rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-sm ${
                        msg.sender === 'user'
                          ? 'bg-indigo-600 text-white rounded-br-xs'
                          : 'bg-white text-slate-800 border border-slate-200/70 rounded-bl-xs'
                      }`}
                    >
                      <p>{msg.text}</p>

                      {/* Attached Product Card Simulation */}
                      {msg.hasCard && (
                        <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center gap-3">
                          <img
                            src="https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?w=200&auto=format&fit=crop"
                            alt="Panjabi"
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                          <div className="flex-1">
                            <p className="font-bold text-xs text-slate-900">Royal Navy Blue Panjabi</p>
                            <p className="text-[11px] text-slate-500">Size: 42 | Stock: 45 Available</p>
                            <p className="text-xs font-bold text-indigo-600">৳২,৮৫০ BDT</p>
                          </div>
                          <Link href="/register">
                            <Button size="sm" variant="success" className="text-xs py-1 px-2.5">
                              Buy Now
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isDemoTyping && (
                  <div className="flex items-center gap-2 text-xs text-slate-400 pl-11">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span>
                    <span>AI Assistant is generating response...</span>
                  </div>
                )}
              </div>

              {/* Quick Prompt Pill Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-200/60 flex flex-wrap gap-2">
                <span className="text-[11px] text-slate-400 self-center font-medium">Try clicking:</span>
                <button
                  onClick={() => handleSendDemoMessage('পাঞ্জাবির সাথে কি ম্যাচিং পায়জামা আছে?')}
                  className="text-xs bg-white border border-slate-200 hover:border-indigo-400 text-slate-700 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  "পাঞ্জাবির সাথে কি পায়জামা আছে?"
                </button>
                <button
                  onClick={() => handleSendDemoMessage('আমি ক্যাশ অন ডেলিভারিতে ১ পিস নিবো।')}
                  className="text-xs bg-white border border-slate-200 hover:border-indigo-400 text-slate-700 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  "ক্যাশ অন ডেলিভারিতে অর্ডার করবো"
                </button>
                <button
                  onClick={() => handleSendDemoMessage('Customer sent an audio voice note 🎙️')}
                  className="text-xs bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Mic className="w-3 h-3" /> Voice Note Simulation
                </button>
                <button
                  onClick={() => handleSendDemoMessage('Customer uploaded a product photo 📷')}
                  className="text-xs bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <ImageIcon className="w-3 h-3" /> Photo Recognition
                </button>
              </div>

              {/* Simulator Input Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendDemoMessage();
                }}
                className="mt-3 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={demoInput}
                  onChange={(e) => setDemoInput(e.target.value)}
                  placeholder="Type a message to test AI agent..."
                  className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent shadow-xs"
                />
                <Button type="submit" size="md">
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Feature Pillar Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 max-w-2xl mx-auto mb-16">
          <Badge variant="purple">Omnichannel Superpowers</Badge>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            Everything your business needs to scale social sales
          </h2>
          <p className="text-sm text-slate-500">
            Engineered from the ground up for modern social commerce, automated support, and high-volume delivery logistics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="p-6 hover:shadow-lg transition-all border-slate-200">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-4">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-2">Omnichannel Unified Inbox</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Consolidate Facebook Messenger, Instagram DM, and WhatsApp conversations into one live workspace. Filter by channel, assign agents, and respond in seconds.
            </p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-all border-slate-200">
            <div className="w-12 h-12 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600 mb-4">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-2">Multimodal AI Intelligence</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Whisper STT transcribes customer voice messages instantly. GPT-4o Vision scans shared screenshots to match products in your catalog automatically.
            </p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-all border-slate-200">
            <div className="w-12 h-12 rounded-xl bg-pink-50 flex items-center justify-center text-pink-600 mb-4">
              <CreditCard className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-2">bKash, Nagad & Stripe Checkout</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Send instant 1-click tokenized payment links inside customer chat. Automatically verify transactions and update order payment statuses server-side.
            </p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-all border-slate-200">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-4">
              <Truck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-2">1-Click Steadfast & Pathao Courier</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Generate consignment IDs, print shipping invoices, and track parcel delivery stages across Bangladesh without leaving the inbox.
            </p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-all border-slate-200">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 mb-4">
              <Headphones className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-2">Seamless Human Handover</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              When a customer asks for a human or a high-ticket negotiation occurs, the AI pauses gracefully and notifies your sales team for instant takeover.
            </p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-all border-slate-200">
            <div className="w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600 mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-2">Enterprise Multi-Tenant Security</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Bank-grade AES-256 encrypted credentials, strict logical tenant data isolation, role-based access control, and complete audit trails.
            </p>
          </Card>
        </div>
      </section>

      {/* 5. Automation Workflow Demonstration */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-slate-900 text-white p-8 sm:p-12 space-y-8 shadow-2xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <Badge variant="purple" size="sm" className="bg-indigo-900 text-indigo-300 border-indigo-700">
                Automated Sequences
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-2">
                See How OmniFlow Automations Work in Real Time
              </h2>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setActiveWorkflowTab('cart')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  activeWorkflowTab === 'cart' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Abandoned Cart
              </button>
              <button
                onClick={() => setActiveWorkflowTab('voice')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  activeWorkflowTab === 'voice' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Voice Note Ingestion
              </button>
              <button
                onClick={() => setActiveWorkflowTab('courier')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  activeWorkflowTab === 'courier' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Courier Dispatch
              </button>
            </div>
          </div>

          {/* Workflow Sequence Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-slate-800/80 border border-slate-700 p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
                <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center">1</span>
                Trigger Event
              </div>
              <h4 className="font-bold text-sm text-white">
                {activeWorkflowTab === 'cart' && 'Customer Inactive for 2 Hours'}
                {activeWorkflowTab === 'voice' && 'WhatsApp Voice Message Received'}
                {activeWorkflowTab === 'courier' && 'Order Confirmed via bKash / COD'}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {activeWorkflowTab === 'cart' && 'Customer added item to chat cart but stopped before sending delivery address.'}
                {activeWorkflowTab === 'voice' && 'Customer sent a 14-second audio note in regional Bengali dialect.'}
                {activeWorkflowTab === 'courier' && 'Payment verified with bKash API or phone verification passed.'}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-800/80 border border-slate-700 p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-violet-400 uppercase tracking-wider">
                <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-300 flex items-center justify-center">2</span>
                AI Execution
              </div>
              <h4 className="font-bold text-sm text-white">
                {activeWorkflowTab === 'cart' && 'Policy Check & Personalized Message'}
                {activeWorkflowTab === 'voice' && 'Whisper-1 STT & Intent Extraction'}
                {activeWorkflowTab === 'courier' && 'Steadfast Parcel Ingestion API'}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {activeWorkflowTab === 'cart' && 'Verifies 24-hr Meta window and generates polite discount nudge.'}
                {activeWorkflowTab === 'voice' && 'Converts voice note to text: "Amake 2ta panjabi size 42 pathan".'}
                {activeWorkflowTab === 'courier' && 'Sends delivery payload to Steadfast API and receives consignment tracking.'}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-800/80 border border-slate-700 p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center">3</span>
                Automated Outcome
              </div>
              <h4 className="font-bold text-sm text-white">
                {activeWorkflowTab === 'cart' && 'Recovered Order + ৳২,৮৫০ GMV'}
                {activeWorkflowTab === 'voice' && 'Instant Structured Order Draft'}
                {activeWorkflowTab === 'courier' && 'Tracking Code Sent to Customer'}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {activeWorkflowTab === 'cart' && 'Customer clicks "Confirm" and pays. No human staff effort expended.'}
                {activeWorkflowTab === 'voice' && 'Voice message is summarized, CRM profile updated, order link generated.'}
                {activeWorkflowTab === 'courier' && 'Consignment code ST-942851 logged and live tracking link delivered.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Testimonials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 max-w-2xl mx-auto mb-16">
          <Badge variant="purple">Trusted By Fast-Growing Brands</Badge>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            Loved by Retailers Across Bangladesh
          </h2>
          <p className="text-sm text-slate-500">
            Real feedback from merchants automating thousands of daily social conversations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, idx) => (
            <Card key={idx} className="p-8 border-slate-200 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-1 text-amber-400">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed italic">
                  "{t.quote}"
                </p>
              </div>

              <div className="pt-6 border-t border-slate-100 mt-6">
                <p className="font-bold text-sm text-slate-900">{t.name}</p>
                <p className="text-xs text-indigo-600 font-semibold">{t.role}</p>
                <p className="text-[11px] text-slate-400">{t.company}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* 7. FAQ Preview */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <Badge variant="purple">Common Inquiries</Badge>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {landingFaqs.map((faq, fIdx) => (
            <div key={fIdx} className="rounded-xl border border-slate-200 bg-white p-5 space-y-2">
              <h4 className="font-bold text-sm text-slate-900">{faq.q}</h4>
              <p className="text-xs text-slate-600 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>

        <div className="text-center pt-2">
          <Link href="/faq" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1">
            Browse All Frequently Asked Questions <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      {/* 8. Conversion CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-8 sm:p-14 text-white text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="relative z-10 max-w-3xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
              Start Automating Social Sales in Minutes
            </h2>
            <p className="text-sm sm:text-base text-indigo-200 leading-relaxed">
              No credit card required for trial. 500 complimentary AI credits granted immediately upon signup.
            </p>
            <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
              <Link href="/register">
                <Button size="lg" className="bg-white text-indigo-900 hover:bg-slate-100 font-bold px-8 shadow-xl">
                  Get Started Free
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" size="lg" className="text-white border-indigo-400/50 hover:bg-white/10">
                  Explore App Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
