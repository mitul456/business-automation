'use client';

import React, { useState } from 'react';
import {
  ShieldAlert,
  Building2,
  DollarSign,
  Bot,
  Activity,
  Plus,
  Ban,
  CheckCircle2,
  Search,
} from 'lucide-react';
import { Button, Input, Card, Badge, Modal } from '@omniflow/ui';

export default function SuperAdminPage() {
  const [stats, setStats] = useState({
    totalTenants: 284,
    activeTenants: 279,
    totalGMV: 48900000,
    totalConversations: 124800,
    systemHealth: '100% Operational',
  });

  const [tenants, setTenants] = useState<any[]>([
    {
      id: 't-1',
      name: 'Apex Lifestyle & Tech',
      slug: 'apex-store',
      planTier: 'PRO',
      creditBalance: 2480,
      ordersCount: 68,
      status: 'ACTIVE',
      createdAt: '2026-10-01',
    },
    {
      id: 't-2',
      name: 'Daraz Hub BD Store',
      slug: 'daraz-hub',
      planTier: 'ENTERPRISE',
      creditBalance: 14500,
      ordersCount: 412,
      status: 'ACTIVE',
      createdAt: '2026-09-15',
    },
    {
      id: 't-3',
      name: 'Shurjomukhi Fashion',
      slug: 'shurjomukhi-bd',
      planTier: 'GROWTH',
      creditBalance: 840,
      ordersCount: 34,
      status: 'ACTIVE',
      createdAt: '2026-10-10',
    },
    {
      id: 't-4',
      name: 'Dhaka Gadget Gallery',
      slug: 'dhaka-gadgets',
      planTier: 'STARTER',
      creditBalance: 120,
      ordersCount: 8,
      status: 'SUSPENDED',
      createdAt: '2026-10-25',
    },
  ]);

  const [search, setSearch] = useState('');
  const [selectedTenantForCredits, setSelectedTenantForCredits] = useState<any | null>(null);
  const [bonusAmount, setBonusAmount] = useState(1000);
  const [bonusReason, setBonusReason] = useState('Partner Promotion');

  const handleToggleStatus = (id: string) => {
    setTenants((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status: t.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' }
          : t
      )
    );
  };

  const handleGrantBonus = () => {
    if (!selectedTenantForCredits) return;
    setTenants((prev) =>
      prev.map((t) =>
        t.id === selectedTenantForCredits.id
          ? { ...t, creditBalance: t.creditBalance + bonusAmount }
          : t
      )
    );
    setSelectedTenantForCredits(null);
  };

  const filtered = tenants.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-400" />
            <span>Platform Overview & Tenant Governance</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Global monitoring for all registered businesses, AI credit consumption, and automated GMV.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/70 text-emerald-400 border border-emerald-800 text-xs font-semibold">
          <Activity className="w-4 h-4 animate-pulse text-emerald-400" />
          <span>All Services Operational (MySQL & Redis BullMQ Healthy)</span>
        </div>
      </div>

      {/* Global Platform KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-slate-950 border border-slate-800">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total SaaS Stores</p>
          <p className="text-2xl font-bold text-white mt-1">{stats.totalTenants}</p>
          <p className="text-[11px] text-emerald-400 mt-0.5">{stats.activeTenants} Active Workspaces</p>
        </div>

        <div className="p-5 rounded-xl bg-slate-950 border border-slate-800">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Platform Gross GMV</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">৳{(stats.totalGMV / 1000000).toFixed(1)}M BDT</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Through bKash, COD & Cards</p>
        </div>

        <div className="p-5 rounded-xl bg-slate-950 border border-slate-800">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Automated Inquiries</p>
          <p className="text-2xl font-bold text-indigo-400 mt-1">{(stats.totalConversations / 1000).toFixed(1)}k Chats</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Across FB, WA & IG</p>
        </div>

        <div className="p-5 rounded-xl bg-slate-950 border border-slate-800">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">LLM Latency</p>
          <p className="text-2xl font-bold text-white mt-1">1.8s</p>
          <p className="text-[11px] text-emerald-400 mt-0.5">Whisper & GPT-4o Fast Response</p>
        </div>
      </div>

      {/* Search and Table */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tenant name, slug..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Tenants Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="border-b border-slate-800 bg-slate-900/80 text-[11px] font-semibold text-slate-400 uppercase">
              <tr>
                <th className="px-4 py-3.5">Store Name</th>
                <th className="px-4 py-3.5">Slug</th>
                <th className="px-4 py-3.5">Plan</th>
                <th className="px-4 py-3.5">AI Credit Balance</th>
                <th className="px-4 py-3.5">Orders Count</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.map((tn) => (
                <tr key={tn.id} className="hover:bg-slate-900/50">
                  <td className="px-4 py-3.5 font-bold text-white">{tn.name}</td>
                  <td className="px-4 py-3.5 font-mono text-slate-400">/{tn.slug}</td>
                  <td className="px-4 py-3.5 font-semibold text-indigo-400">{tn.planTier}</td>
                  <td className="px-4 py-3.5 font-bold text-amber-400">{tn.creditBalance.toLocaleString()}</td>
                  <td className="px-4 py-3.5 text-slate-300">{tn.ordersCount} Orders</td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        tn.status === 'ACTIVE'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-rose-950 text-rose-400 border border-rose-800'
                      }`}
                    >
                      {tn.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedTenantForCredits(tn)}
                        className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 text-[11px] font-semibold transition-colors"
                      >
                        + Grant Credits
                      </button>
                      <button
                        onClick={() => handleToggleStatus(tn.id)}
                        className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                          tn.status === 'ACTIVE'
                            ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                        }`}
                      >
                        {tn.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grant Credits Modal */}
      {selectedTenantForCredits && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedTenantForCredits(null)}
          title={`Grant AI Credits to ${selectedTenantForCredits.name}`}
          description="Injected credits will be available immediately for multimodal AI operations."
        >
          <div className="space-y-4">
            <Input
              label="Bonus Credits Amount"
              type="number"
              value={bonusAmount}
              onChange={(e) => setBonusAmount(parseInt(e.target.value, 10))}
            />
            <Input
              label="Audit Reason"
              value={bonusReason}
              onChange={(e) => setBonusReason(e.target.value)}
              placeholder="e.g. Compensation or Promo grant"
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setSelectedTenantForCredits(null)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleGrantBonus}>
                Confirm Credit Grant
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
