'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bot,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Building2,
  Sparkles,
  ShoppingBag,
  Globe,
  MessageSquare,
  Facebook,
  Instagram,
  Phone,
  Upload,
  Plus,
  Send,
  HelpCircle,
  Clock,
  ShieldCheck,
  ChevronRight,
  Smartphone,
} from 'lucide-react';
import { Button, Input, Card, Badge } from '@omniflow/ui';
import { useAuth } from '@/lib/auth-context';

export default function OnboardingPage() {
  const router = useRouter();
  const { user, activeTenant } = useAuth();
  const [step, setStep] = useState(1);
  const totalSteps = 8;

  // Step 2: Business Profile
  const [businessName, setBusinessName] = useState('Apex Lifestyle');
  const [slug, setSlug] = useState('apex-lifestyle');
  const [country, setCountry] = useState('BD');
  const [currency, setCurrency] = useState('BDT');
  const [timezone, setTimezone] = useState('Asia/Dhaka');

  // Step 3: Business Category
  const [category, setCategory] = useState('FASHION');

  // Step 4: Channels
  const [connectedChannels, setConnectedChannels] = useState<string[]>(['FACEBOOK_PAGE', 'WHATSAPP_BUSINESS']);

  // Step 5: Products
  const [products, setProducts] = useState([
    { name: 'Classic Oxford Cotton Shirt', sku: 'OXF-001', price: '1,850', stock: '45' },
    { name: 'Slim Fit Chino Pants', sku: 'CHI-002', price: '2,200', stock: '30' },
  ]);
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdSku, setNewProdSku] = useState('');

  // Step 6: Knowledge Base
  const [faq, setFaq] = useState(
    'Delivery: 2-3 business days inside Dhaka (৳60), 3-5 days outside Dhaka (৳120). Return Policy: 7 days exchange with intact tags. Payment: Cash on Delivery (COD), bKash, and Credit Cards accepted.'
  );

  // Step 7: AI Configuration
  const [personaName, setPersonaName] = useState('Nova AI Specialist');
  const [tone, setTone] = useState('FRIENDLY');
  const [language, setLanguage] = useState('AUTO');

  // Step 8: AI Testing Simulation
  const [testMessages, setTestMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string }>>([
    {
      sender: 'bot',
      text: 'হ্যালো! Apex Lifestyle-এ স্বাগতম। আমি আপনার এআই অ্যাসিস্ট্যান্ট Nova। আজ আপনাকে কিভাবে সাহায্য করতে পারি?',
    },
  ]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = (textToSend?: string) => {
    const question = textToSend || inputQuestion;
    if (!question.trim()) return;

    const newMsgs = [...testMessages, { sender: 'user' as const, text: question }];
    setTestMessages(newMsgs);
    setInputQuestion('');
    setIsTyping(true);

    setTimeout(() => {
      let botResponse = '';
      const q = question.toLowerCase();
      if (q.includes('charge') || q.includes('চার্জ') || q.includes('delivery') || q.includes('ডেলিভারি')) {
        botResponse = 'আমাদের ডেলিভারি চার্জ: ঢাকা সিটিতে ৳৬০ (২-৩ কার্যদিবস) এবং ঢাকার বাইরে ৳১২০ (৩-৫ কার্যদিবস)। আপনি ক্যাশ অন ডেলিভারিতে নিতে পারবেন!';
      } else if (q.includes('return') || q.includes('রিটার্ন') || q.includes('exchange')) {
        botResponse = 'আমাদের পলিসি অনুযায়ী প্রোডাক্ট রিসিভ করার পর ৭ দিনের মধ্যে ট্যাগ ইনট্যাক্ট রেখে সহজেই এক্সচেঞ্জ করতে পারবেন।';
      } else if (q.includes('shirt') || q.includes('শার্ট') || q.includes('দাম') || q.includes('price')) {
        botResponse = 'আমাদের ক্লাসিক অক্সফোর্ড কটন শার্টটির মূল্য মাত্র ১,৮৫০ টাকা। সাইজ M, L, XL অ্যাভেইলেবল রয়েছে। আপনি কি অর্ডার করতে চান?';
      } else {
        botResponse = `ধন্যবাদ! "${question}" সম্পর্কে আমরা সম্পূর্ণ তথ্য দিতে প্রস্তুত। আমাদের কাছে ক্লাসিক শার্ট এবং চিনো প্যান্ট অ্যাভেইলেবল রয়েছে। আপনি কি কোন নির্দিষ্ট প্রোডাক্ট দেখতে চান?`;
      }
      setTestMessages([...newMsgs, { sender: 'bot', text: botResponse }]);
      setIsTyping(false);
    }, 600);
  };

  const handleAddProduct = () => {
    if (!newProdName || !newProdPrice) return;
    setProducts([
      ...products,
      {
        name: newProdName,
        sku: newProdSku || `PROD-${Date.now().toString().slice(-3)}`,
        price: newProdPrice,
        stock: '25',
      },
    ]);
    setNewProdName('');
    setNewProdPrice('');
    setNewProdSku('');
  };

  const toggleChannel = (id: string) => {
    if (connectedChannels.includes(id)) {
      setConnectedChannels(connectedChannels.filter((c) => c !== id));
    } else {
      setConnectedChannels([...connectedChannels, id]);
    }
  };

  const handleFinishOnboarding = () => {
    router.push('/dashboard');
  };

  const categories = [
    { id: 'FASHION', name: 'Fashion & Apparel', desc: 'Clothing, footwear, watches, and accessories' },
    { id: 'ELECTRONICS', name: 'Electronics & Gadgets', desc: 'Smartphones, wearables, laptops, audio gear' },
    { id: 'BEAUTY_COSMETICS', name: 'Beauty & Cosmetics', desc: 'Skincare, makeup, perfumes, personal care' },
    { id: 'GROCERY_FOOD', name: 'Grocery & Food', desc: 'Packaged foods, gourmet items, organics' },
    { id: 'HOME_LIVING', name: 'Home & Living', desc: 'Furniture, kitchenware, decor, beddings' },
    { id: 'SERVICES', name: 'Professional Services', desc: 'Consulting, appointments, digital agencies' },
    { id: 'GENERAL_RETAIL', name: 'General Retail', desc: 'Multi-category retail and ecommerce' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-sm">
              <Bot className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg text-slate-900">
              Omni<span className="text-indigo-600">Flow</span> AI
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-500 font-medium">
              Step {step} of {totalSteps}
            </span>
            <div className="w-32 bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(step / totalSteps) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Form Container */}
      <main className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-8 flex-1">
        {/* Step 1: Welcome */}
        {step === 1 && (
          <Card className="p-8 text-center space-y-6 shadow-xl shadow-slate-200/50">
            <div className="w-16 h-16 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center mx-auto text-indigo-600 shadow-inner">
              <Sparkles className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Welcome to OmniFlow AI, {user?.name?.split(' ')[0] || 'Friend'}!
              </h1>
              <p className="mt-2 text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
                Let&apos;s configure your intelligent automated commerce assistant. In less than 2 minutes, you will connect your channels, train your AI on your catalog, and run your first live simulation.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left pt-2">
              <div className="p-4 rounded-xl border border-slate-200 bg-white">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mb-2" />
                <h4 className="text-xs font-bold text-slate-900">Omnichannel</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Messenger, Instagram, and WhatsApp Cloud.</p>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 bg-white">
                <CheckCircle2 className="w-5 h-5 text-indigo-600 mb-2" />
                <h4 className="text-xs font-bold text-slate-900">Bilingual AI</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Fluent in English, Bangla & Banglish.</p>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 bg-white">
                <CheckCircle2 className="w-5 h-5 text-violet-600 mb-2" />
                <h4 className="text-xs font-bold text-slate-900">500 Free Credits</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Bonus credits active on your workspace.</p>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <Button size="lg" className="w-full sm:w-auto" onClick={() => setStep(2)}>
                Get Started <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </Card>
        )}

        {/* Step 2: Business Profile */}
        {step === 2 && (
          <Card className="p-8 space-y-6 shadow-xl shadow-slate-200/50">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
                <Building2 className="w-4 h-4" /> Workspace Identity
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Set up your business profile</h2>
              <p className="text-xs text-slate-500 mt-1">This information brands your customer-facing notifications and receipts.</p>
            </div>

            <div className="space-y-4">
              <Input
                label="Business / Store Name"
                value={businessName}
                onChange={(e) => {
                  setBusinessName(e.target.value);
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'));
                }}
                placeholder="e.g. Apex Lifestyle"
              />

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Workspace URL Identifier (Slug)</label>
                <div className="flex rounded-lg border border-slate-300 bg-white shadow-sm overflow-hidden text-sm">
                  <span className="bg-slate-50 border-r border-slate-300 px-3 py-2 text-slate-500 text-xs">
                    omniflow.ai/
                  </span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase())}
                    className="flex-1 px-3 py-2 text-slate-900 focus:outline-none text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Country</label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 bg-white"
                  >
                    <option value="BD">Bangladesh</option>
                    <option value="US">United States</option>
                    <option value="UK">United Kingdom</option>
                    <option value="IN">India</option>
                    <option value="AE">United Arab Emirates</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Primary Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 bg-white"
                  >
                    <option value="BDT">BDT (৳ Taka)</option>
                    <option value="USD">USD ($ Dollar)</option>
                    <option value="EUR">EUR (€ Euro)</option>
                    <option value="GBP">GBP (£ Pound)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Timezone</label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 bg-white"
                  >
                    <option value="Asia/Dhaka">Asia/Dhaka (GMT+6)</option>
                    <option value="UTC">UTC (GMT+0)</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                    <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
              </Button>
              <Button onClick={() => setStep(3)}>
                Continue <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </Card>
        )}

        {/* Step 3: Business Category */}
        {step === 3 && (
          <Card className="p-8 space-y-6 shadow-xl shadow-slate-200/50">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
                <ShoppingBag className="w-4 h-4" /> Domain Vertical
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Select your business category</h2>
              <p className="text-xs text-slate-500 mt-1">This pre-configures domain-specific AI terminology, order fields, and courier defaults.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    category === cat.id
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-900">{cat.name}</span>
                    {category === cat.id && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">{cat.desc}</p>
                </div>
              ))}
            </div>

            <div className="pt-4 flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
              </Button>
              <Button onClick={() => setStep(4)}>
                Continue <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </Card>
        )}

        {/* Step 4: Channel Connection */}
        {step === 4 && (
          <Card className="p-8 space-y-6 shadow-xl shadow-slate-200/50">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
                <MessageSquare className="w-4 h-4" /> Omnichannel Messaging
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Connect your customer touchpoints</h2>
              <p className="text-xs text-slate-500 mt-1">Select channels to activate. You can link Meta permissions now or finalize later in Settings.</p>
            </div>

            <div className="space-y-3">
              <div
                onClick={() => toggleChannel('FACEBOOK_PAGE')}
                className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  connectedChannels.includes('FACEBOOK_PAGE')
                    ? 'border-indigo-600 bg-indigo-50/40'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                    <Facebook className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Facebook Page & Messenger</h4>
                    <p className="text-[11px] text-slate-500">Auto-reply to customer DMs and post comments.</p>
                  </div>
                </div>
                <Badge variant={connectedChannels.includes('FACEBOOK_PAGE') ? 'success' : 'outline'}>
                  {connectedChannels.includes('FACEBOOK_PAGE') ? 'Connected' : 'Click to Enable'}
                </Badge>
              </div>

              <div
                onClick={() => toggleChannel('INSTAGRAM')}
                className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  connectedChannels.includes('INSTAGRAM')
                    ? 'border-indigo-600 bg-indigo-50/40'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center">
                    <Instagram className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Instagram Messaging</h4>
                    <p className="text-[11px] text-slate-500">Engage story replies, reels comments, and direct messages.</p>
                  </div>
                </div>
                <Badge variant={connectedChannels.includes('INSTAGRAM') ? 'success' : 'outline'}>
                  {connectedChannels.includes('INSTAGRAM') ? 'Connected' : 'Click to Enable'}
                </Badge>
              </div>

              <div
                onClick={() => toggleChannel('WHATSAPP_BUSINESS')}
                className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  connectedChannels.includes('WHATSAPP_BUSINESS')
                    ? 'border-indigo-600 bg-indigo-50/40'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">WhatsApp Business Cloud API</h4>
                    <p className="text-[11px] text-slate-500">High-deliverability direct messages, OTPs, and order updates.</p>
                  </div>
                </div>
                <Badge variant={connectedChannels.includes('WHATSAPP_BUSINESS') ? 'success' : 'outline'}>
                  {connectedChannels.includes('WHATSAPP_BUSINESS') ? 'Connected' : 'Click to Enable'}
                </Badge>
              </div>

              <div
                onClick={() => toggleChannel('LIVECHAT')}
                className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  connectedChannels.includes('LIVECHAT')
                    ? 'border-indigo-600 bg-indigo-50/40'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">LiveChat Web Widget</h4>
                    <p className="text-[11px] text-slate-500">Embeddable JavaScript chat bubble for your website.</p>
                  </div>
                </div>
                <Badge variant={connectedChannels.includes('LIVECHAT') ? 'success' : 'outline'}>
                  {connectedChannels.includes('LIVECHAT') ? 'Connected' : 'Click to Enable'}
                </Badge>
              </div>
            </div>

            <div className="pt-4 flex justify-between">
              <Button variant="outline" onClick={() => setStep(3)}>
                <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
              </Button>
              <Button onClick={() => setStep(5)}>
                Continue <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </Card>
        )}

        {/* Step 5: Product Import */}
        {step === 5 && (
          <Card className="p-8 space-y-6 shadow-xl shadow-slate-200/50">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
                <ShoppingBag className="w-4 h-4" /> Catalog Grounding
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Seed your product inventory</h2>
              <p className="text-xs text-slate-500 mt-1">Your AI uses this catalog for instant product recommendations and order generation.</p>
            </div>

            {/* Quick Add Product */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-800">Quick Add Item</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Item Name (e.g. Polo Shirt)"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 bg-white"
                />
                <input
                  type="text"
                  placeholder="Price (e.g. 1500)"
                  value={newProdPrice}
                  onChange={(e) => setNewProdPrice(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 bg-white"
                />
                <input
                  type="text"
                  placeholder="SKU (Optional)"
                  value={newProdSku}
                  onChange={(e) => setNewProdSku(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 bg-white"
                />
              </div>
              <div className="flex justify-between items-center pt-1">
                <Button size="sm" variant="outline" className="text-xs">
                  <Upload className="w-3.5 h-3.5 mr-1" /> Import CSV File
                </Button>
                <Button size="sm" onClick={handleAddProduct}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Product
                </Button>
              </div>
            </div>

            {/* Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Product Name</th>
                    <th className="py-2.5 px-3">SKU</th>
                    <th className="py-2.5 px-3">Price ({currency})</th>
                    <th className="py-2.5 px-3">Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 font-medium text-slate-900">{p.name}</td>
                      <td className="py-2 px-3 text-slate-500 font-mono text-[11px]">{p.sku}</td>
                      <td className="py-2 px-3 text-slate-800 font-semibold">{p.price}</td>
                      <td className="py-2 px-3 text-emerald-600 font-medium">{p.stock} units</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-4 flex justify-between">
              <Button variant="outline" onClick={() => setStep(4)}>
                <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
              </Button>
              <Button onClick={() => setStep(6)}>
                Continue <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </Card>
        )}

        {/* Step 6: Business Knowledge Base */}
        {step === 6 && (
          <Card className="p-8 space-y-6 shadow-xl shadow-slate-200/50">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
                <HelpCircle className="w-4 h-4" /> FAQ & Policies
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Define your store knowledge</h2>
              <p className="text-xs text-slate-500 mt-1">Provide delivery charges, return rules, and hours so the AI answers accurately without hallucinating.</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Business Guidelines & Policies</label>
              <textarea
                rows={6}
                value={faq}
                onChange={(e) => setFaq(e.target.value)}
                className="w-full border border-slate-300 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-sans leading-relaxed"
                placeholder="Enter delivery zones, delivery fees, return policy, payment options..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-[11px] font-bold text-slate-900">24/7 Auto Responses</h5>
                  <p className="text-[10px] text-slate-500">AI responds in &lt; 3 seconds when human agents are offline.</p>
                </div>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-[11px] font-bold text-slate-900">Anti-Hallucination Safe</h5>
                  <p className="text-[10px] text-slate-500">Sticks strictly to your defined inventory and terms.</p>
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-between">
              <Button variant="outline" onClick={() => setStep(5)}>
                <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
              </Button>
              <Button onClick={() => setStep(7)}>
                Continue <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </Card>
        )}

        {/* Step 7: AI Configuration */}
        {step === 7 && (
          <Card className="p-8 space-y-6 shadow-xl shadow-slate-200/50">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
                <Bot className="w-4 h-4" /> AI Persona
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Configure your sales assistant</h2>
              <p className="text-xs text-slate-500 mt-1">Customize the tone, language handling, and human handover rules.</p>
            </div>

            <div className="space-y-4">
              <Input
                label="AI Persona Name"
                value={personaName}
                onChange={(e) => setPersonaName(e.target.value)}
                placeholder="e.g. Nova Specialist"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Conversation Tone</label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 bg-white"
                  >
                    <option value="FRIENDLY">Friendly & Helpful (বন্ধুত্বপূর্ণ)</option>
                    <option value="PROFESSIONAL">Professional & Formal (পেশাদার)</option>
                    <option value="PERSUASIVE">Persuasive & Sales-Oriented (বিক্রয়মুখী)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Language Mode</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 bg-white"
                  >
                    <option value="AUTO">Auto Detect (Bangla, English & Banglish)</option>
                    <option value="BENGALI">Bengali Only (বাংলা)</option>
                    <option value="ENGLISH">English Only</option>
                  </select>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/40 text-xs text-indigo-900 space-y-1">
                <span className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Automated Human Handover Enabled
                </span>
                <p className="text-indigo-700 text-[11px]">
                  When a customer types keywords like <em>&quot;human&quot;</em>, <em>&quot;agent&quot;</em>, or <em>&quot;প্রতিনিধি&quot;</em>, the AI automatically pauses and alerts your human agents in the Unified Inbox.
                </p>
              </div>
            </div>

            <div className="pt-4 flex justify-between">
              <Button variant="outline" onClick={() => setStep(6)}>
                <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
              </Button>
              <Button onClick={() => setStep(8)}>
                Test AI in Simulator <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </Card>
        )}

        {/* Step 8: AI Testing Simulation */}
        {step === 8 && (
          <Card className="p-6 sm:p-8 space-y-5 shadow-xl shadow-slate-200/50">
            <div className="flex items-center justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">
                  <Sparkles className="w-4 h-4" /> Step 8 of 8: Verification
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Test your AI assistant</h2>
                <p className="text-xs text-slate-500 mt-0.5">Chat with your configured AI in real time to verify tone and knowledge grounding.</p>
              </div>
              <Badge variant="success" className="text-xs">
                Live Simulator
              </Badge>
            </div>

            {/* Quick Test Chips */}
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="text-slate-400 text-[11px] self-center">Try asking:</span>
              <button
                type="button"
                onClick={() => handleSendMessage('ডেলিভারি চার্জ কত?')}
                className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 text-xs transition-colors"
              >
                ডেলিভারি চার্জ কত?
              </button>
              <button
                type="button"
                onClick={() => handleSendMessage('How can I return a shirt?')}
                className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 text-xs transition-colors"
              >
                How can I return a shirt?
              </button>
              <button
                type="button"
                onClick={() => handleSendMessage('শার্টের দাম কত?')}
                className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 text-xs transition-colors"
              >
                শার্টের দাম কত?
              </button>
            </div>

            {/* Interactive Chat Window */}
            <div className="border border-slate-200 rounded-2xl bg-slate-50 h-80 flex flex-col overflow-hidden">
              {/* Chat Header */}
              <div className="px-4 py-2.5 bg-white border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900">{personaName}</span>
                    <span className="flex items-center gap-1 text-[10px] text-emerald-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Online
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">OmniFlow Simulator v1.0</span>
              </div>

              {/* Chat Message List */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {testMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-sm ${
                        msg.sender === 'user'
                          ? 'bg-indigo-600 text-white rounded-br-none'
                          : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-slate-200 rounded-2xl px-3.5 py-2 text-xs text-slate-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse" />
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse delay-100" />
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse delay-200" />
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input Bar */}
              <div className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type a message to test your AI..."
                  value={inputQuestion}
                  onChange={(e) => setInputQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendMessage();
                  }}
                  className="flex-1 px-3 py-1.5 text-xs text-slate-800 focus:outline-none"
                />
                <Button size="sm" onClick={() => handleSendMessage()} disabled={!inputQuestion.trim()}>
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 flex justify-between items-center">
              <Button variant="outline" onClick={() => setStep(7)}>
                <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
              </Button>
              <Button
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-200"
                onClick={handleFinishOnboarding}
              >
                Complete Setup & Launch Dashboard <CheckCircle2 className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </Card>
        )}
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-200 bg-white">
        © 2026 OmniFlow AI. Multi-tenant secure workspace deployment.
      </footer>
    </div>
  );
}
