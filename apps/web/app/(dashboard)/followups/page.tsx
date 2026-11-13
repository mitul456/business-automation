'use client';

import React, { useState } from 'react';
import {
  Clock,
  Plus,
  Zap,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  Trash2,
  Sliders,
  DollarSign,
  MessageSquare,
} from 'lucide-react';
import { Button, Badge, Card, Modal, Input, Textarea } from '@omniflow/ui';

export default function FollowupsPage() {
  const [sequences, setSequences] = useState([
    {
      id: 'seq-1',
      name: '2-Hour Abandoned Cart Recovery',
      trigger: 'Cart created without address for 2 hours',
      delayMinutes: 120,
      active: true,
      recoveredCount: 142,
      recoveredRevenue: 384000,
      conversionRate: '31.4%',
      metaCompliant: true,
      messageTemplate: 'আসসালামু আলাইকুম {{customer_name}}, আপনার কার্টে থাকা {{product_name}} অর্ডারটি কি আমরা কনফার্ম করবো? এখনই কনফার্ম করলে ফ্রি ডেলিভারি পাচ্ছেন!',
    },
    {
      id: 'seq-2',
      name: 'Post-Delivery Customer Feedback & Review',
      trigger: 'Steadfast status changes to DELIVERED',
      delayMinutes: 1440, // 24 hours later
      active: true,
      recoveredCount: 310,
      recoveredRevenue: 0,
      conversionRate: '68.2%',
      metaCompliant: true,
      messageTemplate: 'হ্যালো {{customer_name}}! আপনার পার্সেলটি সফলভাবে ডেলিভারি হয়েছে। পণ্যের কোয়ালিটি কেমন লেগেছে? ১-৫ স্টার রেটিং দিয়ে আমাদের সাহায্য করুন!',
    },
    {
      id: 'seq-3',
      name: 'VIP Customer 14-Day Re-engagement',
      trigger: '14 days after last completed order',
      delayMinutes: 20160,
      active: false,
      recoveredCount: 45,
      recoveredRevenue: 128500,
      conversionRate: '18.6%',
      metaCompliant: true,
      messageTemplate: 'প্রিয় {{customer_name}}, আমাদের নতুন এক্সক্লুসিভ কালেকশন এসে গেছে! আপনার জন্য থাকছে ফ্ল্যাট ১০% ডিসকাউন্ট কুপন: VIP10।',
    },
  ]);

  const [modalOpen, setModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDelay, setNewDelay] = useState('120');
  const [newTemplate, setNewTemplate] = useState('');

  const toggleSequence = (id: string) => {
    setSequences((prev) =>
      prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s))
    );
  };

  const deleteSequence = (id: string) => {
    setSequences((prev) => prev.filter((s) => s.id !== id));
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const newSeq = {
      id: `seq-${Date.now()}`,
      name: newName,
      trigger: `Custom delay: ${newDelay} minutes`,
      delayMinutes: parseInt(newDelay, 10) || 60,
      active: true,
      recoveredCount: 0,
      recoveredRevenue: 0,
      conversionRate: '0.0%',
      metaCompliant: true,
      messageTemplate: newTemplate,
    };
    setSequences([newSeq, ...sequences]);
    setModalOpen(false);
    setNewName('');
    setNewDelay('120');
    setNewTemplate('');
  };

  const totalRecoveredGMV = sequences.reduce((a, c) => a + c.recoveredRevenue, 0);
  const totalRecoveredOrders = sequences.reduce((a, c) => a + c.recoveredCount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Follow-Up Sequences & Cart Recovery
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Automate timely reminders, reviews, and recovery sequences within official Meta 24-hour compliance rules.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Create Sequence
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4 border-slate-200">
          <p className="text-[11px] font-semibold text-slate-400 uppercase">Recovered Revenue</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            ৳{totalRecoveredGMV.toLocaleString()} BDT
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Direct from abandoned carts</p>
        </Card>
        <Card className="p-4 border-slate-200">
          <p className="text-[11px] font-semibold text-slate-400 uppercase">Recovered Orders</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {totalRecoveredOrders} Orders
          </p>
          <p className="text-xs text-emerald-600 font-semibold mt-0.5">+24.8% net GMV lift</p>
        </Card>
        <Card className="p-4 border-slate-200">
          <p className="text-[11px] font-semibold text-slate-400 uppercase">Avg Recovery Rate</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">28.4%</p>
          <p className="text-xs text-slate-500 mt-0.5">Within 24-hr Meta policy</p>
        </Card>
        <Card className="p-4 border-slate-200">
          <p className="text-[11px] font-semibold text-slate-400 uppercase">Active Sequences</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {sequences.filter((s) => s.active).length} of {sequences.length}
          </p>
          <p className="text-xs text-indigo-600 font-medium mt-0.5">Automated BullMQ worker</p>
        </Card>
      </div>

      {/* Meta Policy Compliance Banner */}
      <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-4 flex items-start gap-3">
        <Clock className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="text-xs text-indigo-900 leading-relaxed">
          <p className="font-bold">Meta 24-Hour Messaging Policy Guardrail Active</p>
          <p className="text-indigo-700 mt-0.5">
            OmniFlow automatically checks the customer interaction timestamp before dispatching follow-up messages. Free standard messages are strictly delivered within 24 hours of customer contact to protect your Facebook Pages and WhatsApp accounts from bans.
          </p>
        </div>
      </div>

      {/* Sequence List */}
      <div className="space-y-4">
        {sequences.map((seq) => (
          <Card key={seq.id} className="p-6 border-slate-200/90 hover:shadow-md transition-all space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                    seq.active ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{seq.name}</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <Clock className="w-3.5 h-3.5" /> Trigger: {seq.trigger}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant={seq.active ? 'success' : 'secondary'} size="sm">
                  {seq.active ? 'Active & Running' : 'Paused'}
                </Badge>
                <Badge variant="indigo" size="sm">
                  Meta Compliant
                </Badge>
              </div>
            </div>

            {/* Template Preview */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-xs text-slate-700 font-mono">
              {seq.messageTemplate}
            </div>

            {/* Metrics & Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-2 border-t border-slate-100 gap-3">
              <div className="flex items-center gap-6 text-xs">
                <div>
                  <span className="text-slate-400">Recovered: </span>
                  <span className="font-bold text-slate-800">{seq.recoveredCount} orders</span>
                </div>
                <div>
                  <span className="text-slate-400">Revenue Lift: </span>
                  <span className="font-bold text-emerald-600">
                    ৳{seq.recoveredRevenue.toLocaleString()} BDT
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Conversion: </span>
                  <span className="font-bold text-indigo-600">{seq.conversionRate}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleSequence(seq.id)}
                  leftIcon={seq.active ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                >
                  {seq.active ? 'Pause Sequence' : 'Resume Sequence'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-rose-600 hover:bg-rose-50"
                  onClick={() => deleteSequence(seq.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Create Sequence Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create Automated Follow-up Sequence"
        description="Configure trigger timing and the template message."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Sequence Name *"
            required
            placeholder="e.g. 1-Hour Cart Recovery"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <Input
            label="Delay (Minutes) *"
            type="number"
            required
            placeholder="120"
            value={newDelay}
            onChange={(e) => setNewDelay(e.target.value)}
            hint="For Meta 24-hr compliance, keep delays under 1440 minutes (24 hours)."
          />
          <Textarea
            label="Message Template (Bengali / English) *"
            required
            rows={3}
            placeholder="আসসালামু আলাইকুম {{customer_name}}, আপনার অর্ডারটি কি কনফার্ম করবো?"
            value={newTemplate}
            onChange={(e) => setNewTemplate(e.target.value)}
          />
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save & Activate Sequence
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
