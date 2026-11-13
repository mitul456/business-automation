'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n-context';
import { ApiClient } from '@/lib/api';
import {
  TrendingUp,
  ShoppingBag,
  MessageSquare,
  Users,
  DollarSign,
  Bot,
  ArrowUpRight,
  Truck,
  CreditCard,
  Sparkles,
  ArrowRight,
  Clock,
  Phone,
  Flame,
} from 'lucide-react';
import {
  StatsCard,
  Card,
  CardHeader,
  CardTitle,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Badge,
  Button,
} from '@omniflow/ui';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export default function DashboardPage() {
  const { activeTenant } = useAuth();
  const { t } = useI18n();

  const [metrics, setMetrics] = useState({
    revenue: { total: 485200, currency: 'BDT', growthPercentage: 28.4 },
    orders: { total: 648, growthPercentage: 22.1 },
    customers: { total: 1420, growthPercentage: 18.5 },
    conversations: { total: 3610, aiResolutionRate: 86.4, avgResponseTimeSec: 2.1 },
    revenueTrend: [
      { day: 'Mon', revenue: 42000, orders: 18 },
      { day: 'Tue', revenue: 58500, orders: 24 },
      { day: 'Wed', revenue: 51000, orders: 21 },
      { day: 'Thu', revenue: 69800, orders: 32 },
      { day: 'Fri', revenue: 88400, orders: 41 },
      { day: 'Sat', revenue: 95000, orders: 46 },
      { day: 'Sun', revenue: 80500, orders: 38 },
    ],
    recentOrders: [
      {
        id: 'ord-1',
        orderNumber: 'APX-2026-9421',
        customer: { name: 'Rahim Chowdhury', phone: '+8801712345678', city: 'Dhaka' },
        totalAmount: 2850,
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        paymentMethod: 'BKASH',
        courierName: 'Steadfast Courier',
      },
      {
        id: 'ord-2',
        orderNumber: 'APX-2026-9420',
        customer: { name: 'Nusrat Jahan', phone: '+8801812345678', city: 'Chittagong' },
        totalAmount: 3450,
        status: 'PROCESSING',
        paymentStatus: 'PAID',
        paymentMethod: 'BKASH',
        courierName: 'Steadfast Courier',
      },
      {
        id: 'ord-3',
        orderNumber: 'APX-2026-9419',
        customer: { name: 'Farhan Kabir', phone: '+8801912345678', city: 'Sylhet' },
        totalAmount: 5700,
        status: 'SHIPPED',
        paymentStatus: 'UNPAID',
        paymentMethod: 'COD',
        courierName: 'Pathao Courier',
      },
      {
        id: 'ord-4',
        orderNumber: 'APX-2026-9418',
        customer: { name: 'Sabrina Mostafa', phone: '+8801622334455', city: 'Dhaka' },
        totalAmount: 8400,
        status: 'DELIVERED',
        paymentStatus: 'PAID',
        paymentMethod: 'STRIPE',
        courierName: 'Steadfast Courier',
      },
    ],
    recentConversations: [
      {
        id: 'conv-1',
        customer: 'Tanvir Ahmed',
        channel: 'WHATSAPP',
        preview: 'জি, আমি ক্যাশ অন ডেলিভারিতে ২ পিস সাইজ ৪২ নিবো।',
        time: '4 mins ago',
        aiHandled: true,
      },
      {
        id: 'conv-2',
        customer: 'Sabrina Mostafa',
        channel: 'INSTAGRAM',
        preview: 'Can you show me more colors for the embroidered silk saree?',
        time: '18 mins ago',
        aiHandled: false,
      },
      {
        id: 'conv-3',
        customer: 'Mahbubur Rahman',
        channel: 'MESSENGER',
        preview: 'পণ্যটি কত দিনের মধ্যে হাতে পাবো?',
        time: '35 mins ago',
        aiHandled: true,
      },
    ],
  });

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const data = await ApiClient.get('/analytics/dashboard');
        if (data) {
          setMetrics((prev) => ({ ...prev, ...data }));
        }
      } catch {
        // Keeps development seed data in place
      }
    };
    fetchMetrics();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-2xl p-6 text-white shadow-xl shadow-indigo-900/10">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-indigo-200 text-[11px] font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
            <span>AI Automation Active 24/7</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Welcome back, {activeTenant?.name || 'Apex Lifestyle & Tech'}
          </h1>
          <p className="text-xs text-indigo-200 mt-1 max-w-xl">
            Multimodal AI has resolved 86.4% of customer conversations across Messenger, Instagram & WhatsApp without human intervention today.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link href="/inbox">
            <Button variant="secondary" size="sm" className="bg-white text-slate-900 hover:bg-slate-100 font-bold shadow-xs">
              Live Inbox (3)
            </Button>
          </Link>
          <Link href="/orders">
            <Button size="sm" className="bg-indigo-600 text-white hover:bg-indigo-700 font-bold shadow-md shadow-indigo-500/30">
              Create Order
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Revenue (GMV)"
          value={`৳${metrics.revenue.total.toLocaleString()}`}
          change={`+${metrics.revenue.growthPercentage}%`}
          isPositive={true}
          subtitle="This week vs last week"
          icon={<DollarSign className="w-5 h-5" />}
        />
        <StatsCard
          title="Total Orders"
          value={metrics.orders.total}
          change={`+${metrics.orders.growthPercentage}%`}
          isPositive={true}
          subtitle="Captured via social & web"
          icon={<ShoppingBag className="w-5 h-5" />}
        />
        <StatsCard
          title="AI Resolution Rate"
          value={`${metrics.conversations.aiResolutionRate}%`}
          change="+4.2%"
          isPositive={true}
          subtitle="Resolved without human staff"
          icon={<Bot className="w-5 h-5" />}
        />
        <StatsCard
          title="Avg Response Latency"
          value={`${metrics.conversations.avgResponseTimeSec}s`}
          change="-0.4s"
          isPositive={true}
          subtitle="Real-time automated stream"
          icon={<TrendingUp className="w-5 h-5" />}
        />
      </div>

      {/* Revenue Chart & Channel Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend Chart */}
        <Card className="lg:col-span-2 p-6 border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Revenue & Sales Performance (BDT)</h3>
              <p className="text-xs text-slate-500">Daily sales generated across connected channels</p>
            </div>
            <Badge variant="purple">Live Data</Badge>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.revenueTrend}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `৳${v / 1000}k`} />
                <Tooltip
                  formatter={(value: any) => [`৳${Number(value).toLocaleString()} BDT`, 'Revenue']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    color: '#fff',
                    borderRadius: '10px',
                    fontSize: '12px',
                  }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Channel Breakdown Card */}
        <Card className="p-6 border-slate-200 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900 mb-1">Conversations by Channel</h3>
            <p className="text-xs text-slate-500 mb-5">Traffic distribution across Meta & WhatsApp</p>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                    Facebook Messenger
                  </span>
                  <span>45% (1,620 DMs)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: '45%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    WhatsApp Business
                  </span>
                  <span>40% (1,440 chats)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '40%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-pink-500"></span>
                    Instagram Direct
                  </span>
                  <span>15% (550 DMs)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-pink-500 rounded-full" style={{ width: '15%' }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 mt-6">
            <Link href="/channels">
              <Button variant="outline" size="sm" className="w-full">
                Manage Channels
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* Recent Orders & Recent Conversations Two-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders Table (2 Cols) */}
        <Card className="lg:col-span-2 border-slate-200 overflow-hidden">
          <CardHeader>
            <div>
              <CardTitle>Recent Orders & Courier Dispatches</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">Automated orders awaiting or assigned to couriers</p>
            </div>
            <Link href="/orders">
              <Button variant="ghost" size="sm" rightIcon={<ArrowUpRight className="w-4 h-4" />}>
                View All
              </Button>
            </Link>
          </CardHeader>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Courier</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <tbody className="divide-y divide-slate-100 bg-white">
              {metrics.recentOrders.map((ord: any) => (
                <TableRow key={ord.id}>
                  <TableCell className="font-semibold text-slate-900">{ord.orderNumber}</TableCell>
                  <TableCell>
                    <p className="font-medium text-slate-800">{ord.customer.name}</p>
                    <p className="text-[11px] text-slate-400">{ord.customer.city}</p>
                  </TableCell>
                  <TableCell className="font-bold text-slate-900">৳{ord.totalAmount.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={ord.paymentStatus === 'PAID' ? 'success' : 'warning'} size="sm">
                      {ord.paymentMethod}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1 text-xs text-slate-700">
                      <Truck className="w-3.5 h-3.5 text-indigo-600" />
                      {ord.courierName}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={ord.status === 'CONFIRMED' ? 'info' : ord.status === 'PROCESSING' ? 'purple' : 'success'} size="sm">
                      {ord.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </tbody>
          </Table>
        </Card>

        {/* Live Conversation Stream (1 Col) */}
        <Card className="border-slate-200 p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Recent Customer Inquiries</h3>
                <p className="text-xs text-slate-500">Live stream across social channels</p>
              </div>
              <Badge variant="indigo" size="sm">3 Unread</Badge>
            </div>

            <div className="space-y-3">
              {metrics.recentConversations.map((c) => (
                <div key={c.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-xs text-slate-900">{c.customer}</p>
                    <Badge
                      variant={
                        c.channel === 'WHATSAPP'
                          ? 'success'
                          : c.channel === 'INSTAGRAM'
                          ? 'purple'
                          : 'default'
                      }
                      size="sm"
                    >
                      {c.channel}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-snug">{c.preview}</p>
                  <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {c.time}
                    </span>
                    <span className={c.aiHandled ? 'text-indigo-600 font-semibold' : 'text-amber-600 font-semibold'}>
                      {c.aiHandled ? 'AI Replying' : 'Human Handover'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4">
            <Link href="/inbox">
              <Button variant="outline" size="sm" className="w-full" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                Open Unified Inbox
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
