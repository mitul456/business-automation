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
} from 'lucide-react';
import { StatsCard, Card, CardHeader, CardTitle, Table, TableHeader, TableRow, TableHead, TableBody, TableCell, Badge, Button } from '@omniflow/ui';
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
  const [metrics, setMetrics] = useState<any>({
    revenue: { total: 184500, currency: 'BDT', growthPercentage: 16.4 },
    orders: { total: 68, growthPercentage: 22.1 },
    customers: { total: 142, growthPercentage: 14.8 },
    conversations: { total: 318, aiResolutionRate: 86, avgResponseTimeSec: 1.8 },
    revenueTrend: [
      { day: 'Mon', revenue: 18000, orders: 8 },
      { day: 'Tue', revenue: 24500, orders: 11 },
      { day: 'Wed', revenue: 21000, orders: 9 },
      { day: 'Thu', revenue: 29800, orders: 14 },
      { day: 'Fri', revenue: 38400, orders: 18 },
      { day: 'Sat', revenue: 42000, orders: 20 },
      { day: 'Sun', revenue: 31000, orders: 15 },
    ],
    recentOrders: [
      {
        id: 'ord-1',
        orderNumber: 'APX-2026-001',
        customer: { name: 'Tanvir Ahmed', phone: '+8801712345678', city: 'Dhaka' },
        totalAmount: 2910,
        status: 'CONFIRMED',
        paymentStatus: 'UNPAID',
        paymentMethod: 'COD',
        courierName: 'Steadfast Courier',
      },
      {
        id: 'ord-2',
        orderNumber: 'APX-2026-002',
        customer: { name: 'Nusrat Jahan', phone: '+8801812345678', city: 'Chittagong' },
        totalAmount: 3450,
        status: 'PROCESSING',
        paymentStatus: 'PAID',
        paymentMethod: 'BKASH',
        courierName: 'Steadfast Courier',
      },
      {
        id: 'ord-3',
        orderNumber: 'APX-2026-003',
        customer: { name: 'Farhan Kabir', phone: '+8801912345678', city: 'Sylhet' },
        totalAmount: 5700,
        status: 'SHIPPED',
        paymentStatus: 'UNPAID',
        paymentMethod: 'COD',
        courierName: 'Pathao Courier',
      },
    ],
  });

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const data = await ApiClient.get('/analytics/dashboard');
        if (data) setMetrics(data);
      } catch (err) {
        // Keeps rich fallback demo metrics
      }
    };
    fetchMetrics();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg shadow-indigo-900/10">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-indigo-200 text-[11px] font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
            <span>AI Automation Active</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Welcome back, {activeTenant?.name || 'Apex Store'}
          </h1>
          <p className="text-xs text-indigo-200 mt-1">
            Multimodal AI has resolved 86% of customer inquiries across Messenger, Instagram & WhatsApp today.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link href="/dashboard/inbox">
            <Button variant="secondary" size="sm" className="bg-white text-slate-900 hover:bg-slate-100">
              Open Inbox
            </Button>
          </Link>
          <Link href="/dashboard/orders">
            <Button size="sm" className="bg-indigo-600 text-white hover:bg-indigo-700 shadow-md">
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
          subtitle="Resolved without human agent"
          icon={<Bot className="w-5 h-5" />}
        />
        <StatsCard
          title="Avg Response Time"
          value={`${metrics.conversations.avgResponseTimeSec}s`}
          change="-0.5s"
          isPositive={true}
          subtitle="Real-time automated replies"
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
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `৳${v / 1000}k`} />
                <Tooltip
                  formatter={(value: any) => [`৳${Number(value).toLocaleString()}`, 'Revenue']}
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
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
                  <span>58% (184 DMs)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: '58%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    WhatsApp Business
                  </span>
                  <span>28% (89 chats)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '28%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-pink-500"></span>
                    Instagram Direct
                  </span>
                  <span>14% (45 DMs)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-pink-500 rounded-full" style={{ width: '14%' }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 mt-6">
            <Link href="/dashboard/integrations">
              <Button variant="outline" size="sm" className="w-full">
                Connect New Channel
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* Recent Orders Section */}
      <Card className="border-slate-200 overflow-hidden">
        <CardHeader>
          <div>
            <CardTitle>Recent Orders & Courier Dispatches</CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">Automated orders awaiting or assigned to couriers</p>
          </div>
          <Link href="/dashboard/orders">
            <Button variant="ghost" size="sm" rightIcon={<ArrowUpRight className="w-4 h-4" />}>
              View All Orders
            </Button>
          </Link>
        </CardHeader>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Destination</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Courier</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {metrics.recentOrders.map((ord: any) => (
              <TableRow key={ord.id}>
                <TableCell className="font-semibold text-slate-900">{ord.orderNumber}</TableCell>
                <TableCell>
                  <p className="font-medium text-slate-800">{ord.customer.name}</p>
                  <p className="text-[11px] text-slate-400">{ord.customer.phone}</p>
                </TableCell>
                <TableCell>{ord.customer.city}</TableCell>
                <TableCell className="font-bold text-slate-900">৳{ord.totalAmount.toLocaleString()}</TableCell>
                <TableCell>
                  <Badge variant={ord.paymentStatus === 'PAID' ? 'success' : 'warning'}>
                    {ord.paymentMethod} ({ord.paymentStatus})
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1 text-xs text-slate-700">
                    <Truck className="w-3.5 h-3.5 text-indigo-600" />
                    {ord.courierName}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant={ord.status === 'CONFIRMED' ? 'info' : ord.status === 'PROCESSING' ? 'purple' : 'success'}>
                    {ord.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
