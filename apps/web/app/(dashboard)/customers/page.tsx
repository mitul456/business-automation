'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n-context';
import { ApiClient } from '@/lib/api';
import {
  Users,
  Search,
  Filter,
  Phone,
  Mail,
  MapPin,
  ShoppingBag,
  Clock,
  Tag,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { Button, Input, Card, Badge, Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@omniflow/ui';

export default function CustomersPage() {
  const { activeTenant } = useAuth();
  const { t } = useI18n();

  const [customers, setCustomers] = useState<any[]>([
    {
      id: 'cust-1',
      name: 'Tanvir Ahmed',
      email: 'tanvir@example.com',
      phone: '+8801712345678',
      city: 'Dhaka',
      district: 'Dhaka',
      address: 'House 42, Road 11, Sector 4, Uttara',
      leadStage: 'QUALIFIED',
      tags: ['vip', 'festive-shopper'],
      totalOrders: 2,
      totalSpent: 5820,
      createdAt: '2026-10-15',
    },
    {
      id: 'cust-2',
      name: 'Nusrat Jahan',
      email: 'nusrat@example.com',
      phone: '+8801812345678',
      city: 'Chittagong',
      district: 'Chittagong',
      address: 'GEC Circle, Nasirabad',
      leadStage: 'WON',
      tags: ['smartwatch-buyer'],
      totalOrders: 1,
      totalSpent: 3570,
      createdAt: '2026-10-20',
    },
    {
      id: 'cust-3',
      name: 'Farhan Kabir',
      email: 'farhan@example.com',
      phone: '+8801912345678',
      city: 'Sylhet',
      district: 'Sylhet',
      address: 'Zindabazar, Sylhet',
      leadStage: 'CONTACTED',
      tags: ['new-lead'],
      totalOrders: 0,
      totalSpent: 0,
      createdAt: '2026-10-31',
    },
  ]);

  const [search, setSearch] = useState('');
  const [selectedStage, setSelectedStage] = useState('ALL');

  const filtered = customers.filter((c) => {
    if (selectedStage !== 'ALL' && c.leadStage !== selectedStage) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.phone.includes(search)) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <span>Customer CRM & Social Lead Pipeline</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Omnichannel profiles synchronized from Facebook, WhatsApp, and Instagram interactions.
          </p>
        </div>
      </div>

      {/* CRM Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-slate-200">
          <p className="text-xs text-slate-500 font-medium">Total Captured Contacts</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{customers.length} Leads</p>
        </Card>
        <Card className="p-4 border-slate-200">
          <p className="text-xs text-slate-500 font-medium">Avg Lifetime Value (LTV)</p>
          <p className="text-xl font-bold text-slate-900 mt-1">৳3,130 BDT</p>
        </Card>
        <Card className="p-4 border-slate-200">
          <p className="text-xs text-slate-500 font-medium">Conversion Rate</p>
          <p className="text-xl font-bold text-slate-900 mt-1">66.7% Lead to Buyer</p>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {['ALL', 'NEW', 'CONTACTED', 'QUALIFIED', 'WON', 'LOST'].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStage(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                selectedStage === st
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, phone number..."
            className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-600"
          />
        </div>
      </div>

      {/* Customer CRM Table */}
      <Card className="border-slate-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Lead Stage</TableHead>
              <TableHead>Orders Count</TableHead>
              <TableHead>Total Spent</TableHead>
              <TableHead>Tags</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                      {c.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 text-xs sm:text-sm">{c.name}</p>
                      <p className="text-[11px] text-slate-400">{c.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs text-slate-700">{c.phone}</TableCell>
                <TableCell className="text-xs text-slate-600">
                  {c.address ? `${c.address}, ` : ''}{c.city}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      c.leadStage === 'WON'
                        ? 'success'
                        : c.leadStage === 'QUALIFIED'
                        ? 'purple'
                        : c.leadStage === 'CONTACTED'
                        ? 'info'
                        : 'default'
                    }
                  >
                    {c.leadStage}
                  </Badge>
                </TableCell>
                <TableCell className="font-semibold text-slate-900 text-center">{c.totalOrders}</TableCell>
                <TableCell className="font-bold text-slate-900">৳{c.totalSpent.toLocaleString()} BDT</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {c.tags.map((t: string, idx: number) => (
                      <span key={idx} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                        #{t}
                      </span>
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
