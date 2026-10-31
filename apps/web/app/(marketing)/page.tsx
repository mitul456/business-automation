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
      } else if (text.includes('voice') || text.includes('ভয়েস')) {
        reply = 'আপনার অডিও মেসেজটি ট্রান্সক্রাইব করা হয়েছে: "আমি ২ পিস নিতে চাচ্ছি"। আমরা এখনই কনফার্মেশন লিংক পাঠাচ্ছি!';
      }

      setDemoChat((prev) => [...prev, { sender: 'ai', text: reply, hasCard }]);
      setIsDemoTyping(false);
    }, 800);
  };

  return (
    <div className="space-y-24 pb-24 overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-16 pb-12 sm:pt-24 sm:pb-16 bg-gradient-to-b from-indigo-50/50 via-white to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6 max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold animate-in fade-in duration-500">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>The #1 AI Social Commerce Platform for Bangladesh & Global Brands</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
              Turn Social Conversations Into{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
                Automated Sales
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
              Connect Facebook Messenger, Instagram, and WhatsApp. Let multimodal AI close orders, understand customer voice notes and photos, accept bKash & Cards, and book Steadfast parcels automatically.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link href="/dashboard">
                <Button size="lg" className="px-8 shadow-md shadow-indigo-300">
                  Get Started Free
                </Button>
              </Link>
              <Link href="/dashboard/inbox">
                <Button variant="outline" size="lg">
                  Explore Live Demo
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

          {/* Interactive Live AI Console Simulation */}
          <div className="mt-14 max-w-4xl mx-auto rounded-2xl border border-slate-200/90 bg-white shadow-2xl shadow-slate-200/50 overflow-hidden">
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
                          <Link href="/dashboard/orders">
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
                  className="text-xs bg-white border border-slate-200 hover:border-indigo-400 text-slate-700 px-2.5 py-1 rounded-lg transition-colors"
                >
                  "পাঞ্জাবির সাথে কি পায়জামা আছে?"
                </button>
                <button
                  onClick={() => handleSendDemoMessage('আমি ক্যাশ অন ডেলিভারিতে ১ পিস নিবো।')}
                  className="text-xs bg-white border border-slate-200 hover:border-indigo-400 text-slate-700 px-2.5 py-1 rounded-lg transition-colors"
                >
                  "ক্যাশ অন ডেলিভারিতে অর্ডার করবো"
                </button>
                <button
                  onClick={() => handleSendDemoMessage('Customer sent an audio voice note 🎙️')}
                  className="text-xs bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors"
                >
                  <Mic className="w-3 h-3" /> Voice Note Simulation
                </button>
                <button
                  onClick={() => handleSendDemoMessage('Customer uploaded a product photo 📷')}
                  className="text-xs bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors"
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

      {/* Feature Pillar Grid */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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

      {/* Pricing Section */}
      <section id="pricing" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 max-w-2xl mx-auto mb-16">
          <Badge variant="purple">Transparent Pricing</Badge>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            Plans built to grow with your business
          </h2>
          <p className="text-sm text-slate-500">
            All plans include full access to the omnichannel inbox, AI sales agent, catalog, and courier integrations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Starter Plan */}
          <Card className="p-6 flex flex-col justify-between border-slate-200">
            <div className="space-y-4">
              <h3 className="font-bold text-lg text-slate-900">Starter</h3>
              <p className="text-xs text-slate-500">For rising entrepreneurs and boutique shops.</p>
              <div className="text-3xl font-extrabold text-slate-900">
                ৳১,৯৫০ <span className="text-xs font-normal text-slate-500">/ month ($19 USD)</span>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-600 pt-4">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> 1 Facebook Page + WhatsApp</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> 1,500 AI Responses/month</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Steadfast & Pathao Courier</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> bKash & Cash on Delivery</li>
              </ul>
            </div>
            <Link href="/dashboard" className="pt-8">
              <Button variant="outline" className="w-full">Get Started</Button>
            </Link>
          </Card>

          {/* Growth / Pro Plan */}
          <Card className="p-6 flex flex-col justify-between border-indigo-500 shadow-xl relative bg-white ring-2 ring-indigo-600">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-indigo-600 text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                Most Popular
              </span>
            </div>
            <div className="space-y-4 pt-2">
              <h3 className="font-bold text-lg text-slate-900">Growth Pro</h3>
              <p className="text-xs text-slate-500">For scaling e-commerce brands and active stores.</p>
              <div className="text-3xl font-extrabold text-slate-900">
                ৳৪,৯৫০ <span className="text-xs font-normal text-slate-500">/ month ($49 USD)</span>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-600 pt-4">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-600" /> Unlimited Channels (FB, IG, WA)</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-600" /> 10,000 AI Credits + GPT-4o Vision</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-600" /> Voice Message Understanding</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-600" /> 5 Team Member Seats</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-600" /> Automated Follow-up Sequences</li>
              </ul>
            </div>
            <Link href="/dashboard" className="pt-8">
              <Button variant="primary" className="w-full shadow-md shadow-indigo-300">
                Start 14-Day Free Trial
              </Button>
            </Link>
          </Card>

          {/* Enterprise */}
          <Card className="p-6 flex flex-col justify-between border-slate-200">
            <div className="space-y-4">
              <h3 className="font-bold text-lg text-slate-900">Enterprise</h3>
              <p className="text-xs text-slate-500">For retail enterprises and high-volume operations.</p>
              <div className="text-3xl font-extrabold text-slate-900">
                ৳১২,৫০০ <span className="text-xs font-normal text-slate-500">/ month ($120 USD)</span>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-600 pt-4">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Unlimited Team Members</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> 50,000+ AI Credits</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Custom LLM & Fine-tuning</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Dedicated Account Manager</li>
              </ul>
            </div>
            <Link href="/dashboard" className="pt-8">
              <Button variant="outline" className="w-full">Contact Sales</Button>
            </Link>
          </Card>
        </div>
      </section>
    </div>
  );
}
