'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Plus,
  Search,
  Filter,
  Flame,
  MessageSquare,
  ArrowRight,
  TrendingUp,
  DollarSign,
  CheckCircle2,
  Phone,
  Mail,
} from 'lucide-react';
import { Button, Badge, Card, Modal, Input } from '@omniflow/ui';

export default function LeadsPage() {
  const [stageFilter, setStageFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [leads, setLeads] = useState([
    {
      id: 'lead-1',
      name: 'Tanvir Ahmed',
      phone: '+880 1711-223344',
      source: 'WHATSAPP',
      stage: 'QUALIFIED',
      score: 'HOT',
      dealValue: 12500,
      interest: 'Wedding Panjabi & Suit Set (3 pcs)',
      lastActivity: '10 mins ago',
      assignedTo: 'AI Assistant',
    },
    {
      id: 'lead-2',
      name: 'Sabrina Mostafa',
      phone: '+880 1819-556677',
      source: 'INSTAGRAM',
      stage: 'PROPOSAL_SENT',
      score: 'HOT',
      dealValue: 8400,
      interest: 'Designer Silk Saree Collection',
      lastActivity: '45 mins ago',
      assignedTo: 'Nadia (Sales Rep)',
    },
    {
      id: 'lead-3',
      name: 'Mahbubur Rahman',
      phone: '+880 1912-334455',
      source: 'MESSENGER',
      stage: 'NEW',
      score: 'WARM',
      dealValue: 3450,
      interest: 'Smart Fitness Watch + Earbuds',
      lastActivity: '2 hours ago',
      assignedTo: 'AI Assistant',
    },
    {
      id: 'lead-4',
      name: 'Dr. Kazi Imran',
      phone: '+880 1715-889900',
      source: 'WHATSAPP',
      stage: 'WON',
      score: 'HOT',
      dealValue: 18900,
      interest: 'Bulk Corporate Gifting (10 pcs)',
      lastActivity: 'Yesterday',
      assignedTo: 'Rahim (Manager)',
    },
    {
      id: 'lead-5',
      name: 'Farzana Akter',
      phone: '+880 1622-445566',
      source: 'MESSENGER',
      stage: 'CONTACTED',
      score: 'COLD',
      dealValue: 2200,
      interest: 'Casual Kurti & Scarf',
      lastActivity: '2 days ago',
      assignedTo: 'AI Assistant',
    },
  ]);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newSource, setNewSource] = useState('WHATSAPP');
  const [newDealValue, setNewDealValue] = useState('5000');
  const [newInterest, setNewInterest] = useState('');

  const filteredLeads = leads.filter((l) => {
    const matchStage = stageFilter === 'ALL' || l.stage === stageFilter;
    const matchSearch =
      !searchTerm ||
      l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.phone.includes(searchTerm) ||
      l.interest.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStage && matchSearch;
  });

  const totalPipelineValue = filteredLeads.reduce((acc, curr) => acc + curr.dealValue, 0);

  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    const newLead = {
      id: `lead-${Date.now()}`,
      name: newName,
      phone: newPhone,
      source: newSource,
      stage: 'NEW',
      score: 'WARM',
      dealValue: parseFloat(newDealValue) || 0,
      interest: newInterest || 'General Inquiry',
      lastActivity: 'Just now',
      assignedTo: 'AI Assistant',
    };
    setLeads([newLead, ...leads]);
    setAddModalOpen(false);
    setNewName('');
    setNewPhone('');
    setNewInterest('');
  };

  const updateStage = (id: string, newStage: string) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, stage: newStage } : l))
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Leads & Sales Qualification Pipeline
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track high-intent customers identified by AI agents across Messenger, Instagram, and WhatsApp.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setAddModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create Lead
          </Button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4 border-slate-200">
          <p className="text-[11px] font-semibold text-slate-400 uppercase">Active Leads</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{filteredLeads.length}</p>
          <p className="text-xs text-emerald-600 font-semibold mt-0.5">82% AI-qualified</p>
        </Card>
        <Card className="p-4 border-slate-200">
          <p className="text-[11px] font-semibold text-slate-400 uppercase">Pipeline Value</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">
            ৳{totalPipelineValue.toLocaleString()} BDT
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Estimated gross deal value</p>
        </Card>
        <Card className="p-4 border-slate-200">
          <p className="text-[11px] font-semibold text-slate-400 uppercase">Hot Leads (🔥)</p>
          <p className="text-2xl font-bold text-rose-600 mt-1">
            {filteredLeads.filter((l) => l.score === 'HOT').length}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Ready for closing</p>
        </Card>
        <Card className="p-4 border-slate-200">
          <p className="text-[11px] font-semibold text-slate-400 uppercase">Closed Won GMV</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            ৳{leads.filter((l) => l.stage === 'WON').reduce((a, c) => a + c.dealValue, 0).toLocaleString()} BDT
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Successfully captured orders</p>
        </Card>
      </div>

      {/* Controls: Search and Stage Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'WON'].map((stg) => (
            <button
              key={stg}
              onClick={() => setStageFilter(stg)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                stageFilter === stg
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {stg.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-64">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search leads..."
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
            inputSize="sm"
          />
        </div>
      </div>

      {/* Leads Table */}
      <Card className="border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3.5">Lead / Customer</th>
                <th className="px-4 py-3.5">Source Channel</th>
                <th className="px-4 py-3.5">Interest & Deal Value</th>
                <th className="px-4 py-3.5">Lead Score</th>
                <th className="px-4 py-3.5">Pipeline Stage</th>
                <th className="px-4 py-3.5">Assigned To</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-bold text-slate-900 text-sm">{lead.name}</p>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3" /> {lead.phone}
                    </p>
                  </td>

                  <td className="px-4 py-4">
                    <Badge
                      variant={
                        lead.source === 'WHATSAPP'
                          ? 'success'
                          : lead.source === 'INSTAGRAM'
                          ? 'purple'
                          : 'default'
                      }
                      size="sm"
                    >
                      {lead.source}
                    </Badge>
                  </td>

                  <td className="px-4 py-4">
                    <p className="font-semibold text-slate-800">{lead.interest}</p>
                    <p className="font-bold text-indigo-600 mt-0.5">
                      ৳{lead.dealValue.toLocaleString()} BDT
                    </p>
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex items-center gap-1 font-bold text-[11px] px-2 py-0.5 rounded-full ${
                        lead.score === 'HOT'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : lead.score === 'WARM'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {lead.score === 'HOT' ? '🔥 HOT' : lead.score}
                    </span>
                  </td>

                  <td className="px-4 py-4">
                    <select
                      value={lead.stage}
                      onChange={(e) => updateStage(lead.id, e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-600 cursor-pointer"
                    >
                      <option value="NEW">NEW</option>
                      <option value="CONTACTED">CONTACTED</option>
                      <option value="QUALIFIED">QUALIFIED</option>
                      <option value="PROPOSAL_SENT">PROPOSAL SENT</option>
                      <option value="WON">WON (CAPTURED)</option>
                      <option value="LOST">LOST</option>
                    </select>
                  </td>

                  <td className="px-4 py-4 text-slate-600 font-medium">
                    {lead.assignedTo}
                  </td>

                  <td className="px-5 py-4 text-right">
                    <Link href="/inbox">
                      <Button variant="outline" size="sm" rightIcon={<MessageSquare className="w-3.5 h-3.5" />}>
                        Open Chat
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Lead Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add New Customer Lead"
        description="Enter customer details to track their sales progress."
      >
        <form onSubmit={handleCreateLead} className="space-y-4">
          <Input
            label="Customer Name *"
            required
            placeholder="e.g. Sajeeb Hasan"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <Input
            label="Phone Number *"
            required
            placeholder="+880 1700-000000"
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">Source *</label>
              <select
                value={newSource}
                onChange={(e) => setNewSource(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-medium"
              >
                <option value="WHATSAPP">WhatsApp</option>
                <option value="MESSENGER">Facebook Messenger</option>
                <option value="INSTAGRAM">Instagram DM</option>
              </select>
            </div>
            <Input
              label="Estimated Value (BDT) *"
              type="number"
              required
              value={newDealValue}
              onChange={(e) => setNewDealValue(e.target.value)}
            />
          </div>
          <Input
            label="Product Interest / Inquiry"
            placeholder="e.g. 2 pcs Cotton Panjabi Size 42"
            value={newInterest}
            onChange={(e) => setNewInterest(e.target.value)}
          />
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Create Lead
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
