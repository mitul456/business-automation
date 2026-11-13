'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  DollarSign,
  MessageSquare,
  Bot,
  Truck,
  Users,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  ShoppingBag,
} from 'lucide-react';
import { Button, Badge, Card, AreaChart, BarChart } from '@omniflow/ui';

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  const revenueData = [
    { label: 'Day 1', value: 14500 },
    { label: 'Day 5', value: 18200 },
    { label: 'Day 10', value: 24800 },
    { label: 'Day 15', value: 31200 },
    { label: 'Day 20', value: 28400 },
    { label: 'Day 25', value: 42000 },
    { label: 'Day 30', value: 48500 },
  ];

  const channelData = [
    { label: 'Messenger', value: 1620 },
    { label: 'WhatsApp', value: 1440 },
    { label: 'Instagram', value: 550 },
  ];

  const topProducts = [
    { name: 'Royal Navy Blue Embroidered Panjabi', sales: 184, gmv: 524400, stock: 45 },
    { name: 'Apex Ultra Smart Watch (AMOLED)', sales: 142, gmv: 489900, stock: 28 },
    { name: 'Wireless Active Noise-Canceling Earbuds', sales: 98, gmv: 215600, stock: 62 },
    { name: 'Formal Tailored Slim-Fit Cotton Shirt', sales: 86, gmv: 159100, stock: 34 },
  ];

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Business & AI Performance Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time telemetry on revenue GMV, AI resolution accuracy, channel volume, and courier fulfillment.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setTimeRange('7d')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              timeRange === '7d' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setTimeRange('30d')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              timeRange === '30d' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Last 30 Days
          </button>
          <button
            onClick={() => setTimeRange('90d')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              timeRange === '90d' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            This Quarter (90d)
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4 border-slate-200">
          <p className="text-[11px] font-semibold text-slate-400 uppercase">Gross Merchandise Value</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">৳৪,৮৫,২০০ BDT</p>
          <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> +28.4% vs previous period
          </p>
        </Card>

        <Card className="p-4 border-slate-200">
          <p className="text-[11px] font-semibold text-slate-400 uppercase">AI Resolution Rate</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">86.4%</p>
          <p className="text-xs text-slate-500 mt-1">3,120 resolved without human</p>
        </Card>

        <Card className="p-4 border-slate-200">
          <p className="text-[11px] font-semibold text-slate-400 uppercase">Average First Response</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">2.1 seconds</p>
          <p className="text-xs text-emerald-600 font-semibold mt-1">98% under 5 seconds</p>
        </Card>

        <Card className="p-4 border-slate-200">
          <p className="text-[11px] font-semibold text-slate-400 uppercase">Steadfast Delivery Rate</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">94.2%</p>
          <p className="text-xs text-slate-500 mt-1">5.8% COD return rate</p>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Area Chart */}
        <Card className="lg:col-span-2 p-6 border-slate-200 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Revenue Sales Velocity (BDT)</h3>
              <p className="text-xs text-slate-500">Gross revenue captured across all channels.</p>
            </div>
            <Badge variant="indigo" size="sm">
              Live Daily GMV
            </Badge>
          </div>
          <AreaChart data={revenueData} height={240} color="#4f46e5" />
        </Card>

        {/* Channel Distribution Bar Chart */}
        <Card className="p-6 border-slate-200 space-y-4">
          <div className="pb-2 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-900">Conversation Volume by Channel</h3>
            <p className="text-xs text-slate-500">Distribution of customer messages.</p>
          </div>
          <BarChart data={channelData} height={200} color="#6366f1" />
          <div className="pt-4 border-t border-slate-100 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span> Facebook Messenger
              </span>
              <span className="font-bold text-slate-900">45.0% (1,620)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span> WhatsApp Cloud
              </span>
              <span className="font-bold text-slate-900">40.0% (1,440)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-pink-600"></span> Instagram DM
              </span>
              <span className="font-bold text-slate-900">15.0% (550)</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Top Products Table */}
      <Card className="p-6 border-slate-200 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Top Performing Products</h3>
            <p className="text-xs text-slate-500">Highest grossing items sold via AI and chat.</p>
          </div>
          <Link href="/products" className="text-xs text-indigo-600 font-bold hover:underline">
            View All Products
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3">Product Name</th>
                <th className="px-4 py-3">Units Sold</th>
                <th className="px-4 py-3">Total GMV (BDT)</th>
                <th className="px-4 py-3">Current Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {topProducts.map((prod, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-bold text-slate-900">{prod.name}</td>
                  <td className="px-4 py-3">{prod.sales} units</td>
                  <td className="px-4 py-3 font-bold text-indigo-600">৳{prod.gmv.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-emerald-600">{prod.stock} in stock</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
