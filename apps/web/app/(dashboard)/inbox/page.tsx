'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n-context';
import { ApiClient } from '@/lib/api';
import {
  MessageSquare,
  Bot,
  User,
  Send,
  Phone,
  MapPin,
  ShoppingBag,
  Sparkles,
  Headphones,
  Play,
  Image as ImageIcon,
  CheckCheck,
  Search,
  Filter,
  CreditCard,
  Plus,
  CheckCircle2,
} from 'lucide-react';
import { Button, Input, Badge, Card } from '@omniflow/ui';

export default function InboxPage() {
  const { activeTenant } = useAuth();
  const { t } = useI18n();

  const [channelFilter, setChannelFilter] = useState<'ALL' | 'FB' | 'WA' | 'IG'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConvId, setSelectedConvId] = useState<string>('conv-1');

  // Conversations List State
  const [conversations, setConversations] = useState<any[]>([
    {
      id: 'conv-1',
      customer: {
        id: 'cust-1',
        name: 'Tanvir Ahmed',
        phone: '+8801712345678',
        email: 'tanvir@example.com',
        city: 'Dhaka',
        address: 'House 42, Road 11, Sector 4, Uttara',
        leadStage: 'QUALIFIED',
        totalOrders: 1,
        totalSpent: 2910,
      },
      channel: { type: 'FACEBOOK_PAGE', name: 'Apex Facebook Page' },
      status: 'BOT_ACTIVE',
      lastMessagePreview: 'আপনাদের নীল পাঞ্জাবিটার সাইজ ৪২ কি স্টকে আছে?',
      lastMessageAt: '10m ago',
      unreadCount: 0,
      aiAssisted: true,
    },
    {
      id: 'conv-2',
      customer: {
        id: 'cust-2',
        name: 'Nusrat Jahan',
        phone: '+8801812345678',
        email: 'nusrat@example.com',
        city: 'Chittagong',
        address: 'GEC Circle, Nasirabad, Chittagong',
        leadStage: 'CONTACTED',
        totalOrders: 0,
        totalSpent: 0,
      },
      channel: { type: 'WHATSAPP_BUSINESS', name: 'Apex WhatsApp Support' },
      status: 'HUMAN_HANDOVER',
      lastMessagePreview: 'Customer sent a voice note 🎙️',
      lastMessageAt: '25m ago',
      unreadCount: 2,
      aiAssisted: false,
    },
    {
      id: 'conv-3',
      customer: {
        id: 'cust-3',
        name: 'Farhan Kabir',
        phone: '+8801912345678',
        email: 'farhan@example.com',
        city: 'Sylhet',
        address: 'Zindabazar, Sylhet',
        leadStage: 'QUALIFIED',
        totalOrders: 2,
        totalSpent: 5700,
      },
      channel: { type: 'INSTAGRAM', name: 'Apex Instagram' },
      status: 'BOT_ACTIVE',
      lastMessagePreview: 'Customer uploaded a product photo 📷',
      lastMessageAt: '1h ago',
      unreadCount: 0,
      aiAssisted: true,
    },
  ]);

  // Messages in Active Conversation
  const [messages, setMessages] = useState<any[]>([
    {
      id: 'm1',
      senderType: 'CUSTOMER',
      content: 'আসসালামু আলাইকুম, আপনাদের নীল পাঞ্জাবিটার সাইজ ৪২ কি স্টকে আছে?',
      contentType: 'TEXT',
      createdAt: '10:14 AM',
    },
    {
      id: 'm2',
      senderType: 'BOT',
      content: 'ওয়ালাইকুম আসসালাম! জি, আমাদের "Royal Navy Blue Embroidered Panjabi" সাইজ ৪২ স্টকে অ্যাভেইলেবল আছে। মূল্য ২,৮৫০ টাকা। আপনি কি এখনই ক্যাশ অন ডেলিভারিতে অর্ডার কনফার্ম করতে চান?',
      contentType: 'TEXT',
      aiGenerated: true,
      tokensUsed: 78,
      createdAt: '10:14 AM',
    },
    {
      id: 'm3',
      senderType: 'CUSTOMER',
      content: 'হ্যাঁ, আমি ১ পিস নিবো। নাম: তানভীর আহমেদ, উত্তরা সেক্টর ৪, ঢাকা। ফোন: ০১৭১২৩৪৫৬৭৮।',
      contentType: 'TEXT',
      createdAt: '10:18 AM',
    },
    {
      id: 'm4',
      senderType: 'BOT',
      content: 'ধন্যবাদ তানভীর ভাই! আপনার অর্ডারটি তৈরি করা হয়েছে। ঢাকার ভেতরে ডেলিভারি চার্জ ৬০ টাকা সহ মোট ২,৯১০ টাকা। আমরা খুব দ্রুত ডেলিভারি টিমকে জানাচ্ছি।',
      contentType: 'PRODUCT_CARD',
      aiGenerated: true,
      tokensUsed: 65,
      createdAt: '10:19 AM',
    },
  ]);

  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Quick Order Sidebar Form State
  const [orderProduct, setOrderProduct] = useState('PJ-ROYAL-NAVY-M');
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [orderDeliveryFee, setOrderDeliveryFee] = useState(60);
  const [orderPaymentMethod, setOrderPaymentMethod] = useState('COD');
  const [orderSuccessNotice, setOrderSuccessNotice] = useState(false);

  const activeConv = conversations.find((c) => c.id === selectedConvId) || conversations[0];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    const newMsg = {
      id: `msg-${Date.now()}`,
      senderType: 'AGENT',
      content: replyText,
      contentType: 'TEXT',
      createdAt: 'Just now',
    };

    setMessages((prev) => [...prev, newMsg]);
    setReplyText('');

    // If API endpoint reachable
    ApiClient.post('/inbox/messages', {
      conversationId: activeConv.id,
      content: replyText,
      contentType: 'TEXT',
    }).catch(() => {});
  };

  const handleToggleHandover = () => {
    const isCurrentlyHuman = activeConv.status === 'HUMAN_HANDOVER';
    const newStatus = isCurrentlyHuman ? 'BOT_ACTIVE' : 'HUMAN_HANDOVER';

    setConversations((prev) =>
      prev.map((c) => (c.id === activeConv.id ? { ...c, status: newStatus } : c))
    );

    const systemMsg = {
      id: `sys-${Date.now()}`,
      senderType: 'SYSTEM',
      content: isCurrentlyHuman
        ? 'AI Assistant reactivated for this conversation.'
        : 'Human agent took over this conversation. AI response paused.',
      contentType: 'TEXT',
      createdAt: 'Just now',
    };
    setMessages((prev) => [...prev, systemMsg]);

    const endpoint = isCurrentlyHuman
      ? `/inbox/conversations/${activeConv.id}/return-to-ai`
      : `/inbox/conversations/${activeConv.id}/takeover`;
    ApiClient.post(endpoint).catch(() => {});
  };

  const handleCreateQuickOrder = () => {
    setOrderSuccessNotice(true);
    const orderCardMsg = {
      id: `msg-ord-${Date.now()}`,
      senderType: 'BOT',
      content: `🎉 Order Placed! Order #APX-2026-004 for ${activeConv.customer.name} (Amount: ৳${2850 * orderQuantity + orderDeliveryFee} BDT - ${orderPaymentMethod}). Automated Steadfast parcel creation initiated.`,
      contentType: 'TEXT',
      createdAt: 'Just now',
    };
    setMessages((prev) => [...prev, orderCardMsg]);

    setTimeout(() => {
      setOrderSuccessNotice(false);
    }, 4000);
  };

  return (
    <div className="h-[calc(100vh-8.5rem)] flex gap-4 min-w-0">
      {/* COLUMN 1: Conversation List */}
      <div className="w-80 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col shrink-0 overflow-hidden">
        {/* Header & Filter Tabs */}
        <div className="p-3.5 border-b border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-600" />
              <span>Inbox</span>
            </h2>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
              3 Open
            </span>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search customer, phone..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-600"
            />
          </div>

          {/* Channel Filters */}
          <div className="flex gap-1">
            {(['ALL', 'FB', 'WA', 'IG'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setChannelFilter(tab)}
                className={`flex-1 py-1 text-[11px] font-semibold rounded-md transition-colors ${
                  channelFilter === tab
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab === 'ALL' ? 'All' : tab === 'FB' ? 'FB' : tab === 'WA' ? 'WhatsApp' : 'IG'}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation Items List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {conversations.map((conv) => {
            const isSelected = conv.id === activeConv.id;
            return (
              <div
                key={conv.id}
                onClick={() => setSelectedConvId(conv.id)}
                className={`p-3.5 cursor-pointer transition-colors flex items-start gap-3 ${
                  isSelected ? 'bg-indigo-50/70 border-l-4 border-indigo-600' : 'hover:bg-slate-50'
                }`}
              >
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-200 to-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs border border-slate-200">
                    {conv.customer.name.slice(0, 2).toUpperCase()}
                  </div>
                  {/* Channel Icon Badge */}
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white flex items-center justify-center text-[8px] text-white font-bold ${
                      conv.channel.type.includes('FACEBOOK')
                        ? 'bg-blue-600'
                        : conv.channel.type.includes('WHATSAPP')
                        ? 'bg-emerald-500'
                        : 'bg-pink-500'
                    }`}
                  ></span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-xs font-bold text-slate-900 truncate">{conv.customer.name}</p>
                    <span className="text-[10px] text-slate-400">{conv.lastMessageAt}</span>
                  </div>

                  <p className="text-xs text-slate-500 truncate">{conv.lastMessagePreview}</p>

                  <div className="flex items-center gap-1.5 mt-1.5">
                    {conv.status === 'BOT_ACTIVE' ? (
                      <Badge variant="purple" size="sm">
                        <Bot className="w-3 h-3" /> AI Active
                      </Badge>
                    ) : (
                      <Badge variant="warning" size="sm">
                        <Headphones className="w-3 h-3" /> Human Mode
                      </Badge>
                    )}

                    {conv.unreadCount > 0 && (
                      <span className="ml-auto w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* COLUMN 2: Active Chat Feed */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col min-w-0 overflow-hidden">
        {/* Chat Feed Header */}
        <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
              {activeConv.customer.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">{activeConv.customer.name}</h3>
                <span className="text-xs text-slate-400">({activeConv.customer.phone})</span>
              </div>
              <p className="text-[11px] text-slate-500 flex items-center gap-1">
                Connected via <span className="font-semibold text-slate-700">{activeConv.channel.name}</span>
              </p>
            </div>
          </div>

          {/* Handover Protocol Toggle Button */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={activeConv.status === 'BOT_ACTIVE' ? 'outline' : 'success'}
              onClick={handleToggleHandover}
              leftIcon={
                activeConv.status === 'BOT_ACTIVE' ? (
                  <Headphones className="w-3.5 h-3.5 text-amber-600" />
                ) : (
                  <Bot className="w-3.5 h-3.5" />
                )
              }
            >
              {activeConv.status === 'BOT_ACTIVE' ? 'Take Over (Human Mode)' : 'Return to AI'}
            </Button>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/50">
          {messages.map((msg) => {
            if (msg.senderType === 'SYSTEM') {
              return (
                <div key={msg.id} className="text-center my-2">
                  <span className="text-[11px] font-medium bg-slate-200/70 text-slate-600 px-3 py-1 rounded-full">
                    {msg.content}
                  </span>
                </div>
              );
            }

            const isCustomer = msg.senderType === 'CUSTOMER';
            const isBot = msg.senderType === 'BOT';

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-2.5 ${isCustomer ? 'justify-start' : 'justify-end'}`}
              >
                {!isCustomer && isBot && (
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 text-xs shadow-xs order-2">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}
                {!isCustomer && !isBot && (
                  <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-white shrink-0 text-xs shadow-xs order-2">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-md rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-xs ${
                    isCustomer
                      ? 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs'
                      : isBot
                      ? 'bg-indigo-600 text-white rounded-br-xs'
                      : 'bg-slate-800 text-white rounded-br-xs'
                  }`}
                >
                  <p>{msg.content}</p>

                  {/* Render Product Card If Attached */}
                  {msg.contentType === 'PRODUCT_CARD' && (
                    <div className="mt-2 p-2.5 bg-white/10 rounded-xl border border-white/20 text-white flex items-center justify-between">
                      <div>
                        <p className="font-bold text-xs">Royal Navy Blue Panjabi (42)</p>
                        <p className="text-[10px] text-indigo-100">Price: ৳২,৮৫০ | Shipping: ৳৬০</p>
                      </div>
                      <span className="text-xs font-bold bg-white text-indigo-700 px-2 py-0.5 rounded">
                        ৳২,৯১০ Total
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-1.5 mt-1 text-[10px] opacity-70">
                    {isBot && <span>AI Powered ({msg.tokensUsed || 60} tokens) • </span>}
                    <span>{msg.createdAt}</span>
                    {!isCustomer && <CheckCheck className="w-3 h-3" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Reply Bar */}
        <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-100 flex items-center gap-2">
          <input
            type="text"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder={
              activeConv.status === 'BOT_ACTIVE'
                ? 'AI is handling this chat. Type here to reply manually...'
                : 'Reply as Human Agent...'
            }
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600"
          />
          <Button type="submit" size="md" disabled={!replyText.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>

      {/* COLUMN 3: Customer CRM Profile & Quick Order Form */}
      <div className="w-80 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col shrink-0 overflow-y-auto divide-y divide-slate-100">
        {/* Customer Profile Summary */}
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Customer CRM Profile</h3>
            <Badge variant="success">Active Buyer</Badge>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
              {activeConv.customer.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">{activeConv.customer.name}</h4>
              <p className="text-xs text-slate-500">{activeConv.customer.phone}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2">
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <p className="text-[10px] text-slate-400 font-medium">Lifetime Spend</p>
              <p className="text-xs font-bold text-slate-900">৳{activeConv.customer.totalSpent.toLocaleString()}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <p className="text-[10px] text-slate-400 font-medium">Orders Count</p>
              <p className="text-xs font-bold text-slate-900">{activeConv.customer.totalOrders} Orders</p>
            </div>
          </div>

          <div className="space-y-1 text-xs text-slate-600 pt-1">
            <div className="flex items-start gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span>{activeConv.customer.address}, {activeConv.customer.city}</span>
            </div>
          </div>
        </div>

        {/* Quick Order Creator */}
        <div className="p-4 space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-indigo-600" />
              <span>1-Click Quick Order</span>
            </h3>
            <Badge variant="purple" size="sm">Auto-COD</Badge>
          </div>

          {orderSuccessNotice && (
            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Order created! Sent confirmation to customer.</span>
            </div>
          )}

          <div className="space-y-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Catalog Item</label>
              <select
                value={orderProduct}
                onChange={(e) => setOrderProduct(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:ring-1 focus:ring-indigo-600"
              >
                <option value="PJ-ROYAL-NAVY-M">Royal Navy Blue Panjabi (42) - ৳2,850</option>
                <option value="WT-AMOLED-ULTRA">Apex Ultra Smart Watch - ৳3,450</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={orderQuantity}
                  onChange={(e) => setOrderQuantity(parseInt(e.target.value, 10) || 1)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:ring-1 focus:ring-indigo-600"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Delivery Charge</label>
                <select
                  value={orderDeliveryFee}
                  onChange={(e) => setOrderDeliveryFee(parseInt(e.target.value, 10))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:ring-1 focus:ring-indigo-600"
                >
                  <option value={60}>Inside Dhaka (৳60)</option>
                  <option value={120}>Outside Dhaka (৳120)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Payment Method</label>
              <select
                value={orderPaymentMethod}
                onChange={(e) => setOrderPaymentMethod(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:ring-1 focus:ring-indigo-600"
              >
                <option value="COD">Cash on Delivery (COD)</option>
                <option value="BKASH">bKash Tokenized (Send Link)</option>
                <option value="NAGAD">Nagad Direct PG</option>
              </select>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs font-bold text-slate-900">
              <span>Total Payable:</span>
              <span className="text-indigo-600">
                ৳{(2850 * orderQuantity + orderDeliveryFee).toLocaleString()} BDT
              </span>
            </div>

            <Button
              className="w-full mt-2"
              variant="primary"
              onClick={handleCreateQuickOrder}
            >
              Confirm & Dispatch Order
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
