'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n-context';
import { ApiClient } from '@/lib/api';
import {
  Zap,
  Plus,
  ArrowRight,
  Clock,
  Play,
  Pause,
  MessageSquare,
  Sparkles,
  ShoppingBag,
  Truck,
  CheckCircle2,
} from 'lucide-react';
import { Button, Input, Card, Badge, Modal } from '@omniflow/ui';

export default function WorkflowsPage() {
  const { activeTenant } = useAuth();
  const { t } = useI18n();

  const [workflows, setWorkflows] = useState<any[]>([
    {
      id: 'wf-1',
      name: 'Instant Welcome & Catalog Showcase on First DM',
      trigger: 'NEW_CONVERSATION',
      triggerDesc: 'When customer sends their first message on Messenger/WhatsApp',
      actions: [
        'Send greeting in detected language',
        'Display top 3 best-selling products carousel',
        'Activate AI sales agent',
      ],
      isActive: true,
      executionCount: 412,
    },
    {
      id: 'wf-2',
      name: 'Cart Inactivity Follow-up Sequence (2-Hour Window)',
      trigger: 'INACTIVITY_TIMEOUT',
      triggerDesc: 'When customer inquires about size/price but does not finish order within 2h',
      actions: [
        'Wait 120 minutes',
        'Send gentle follow-up: "সাইজ সিলেক্ট করতে কোনো সাহায্য প্রয়োজন?"',
        'Attach free delivery incentive',
      ],
      isActive: true,
      executionCount: 184,
    },
    {
      id: 'wf-3',
      name: 'Steadfast Courier Shipped Automated Notification',
      trigger: 'ORDER_STATUS_CHANGED',
      triggerDesc: 'When order status transitions to SHIPPED',
      actions: [
        'Fetch tracking code from Steadfast API',
        'Send WhatsApp/Messenger message with tracking link to customer',
      ],
      isActive: true,
      executionCount: 68,
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [triggerType, setTriggerType] = useState('NEW_CONVERSATION');
  const [actionMessage, setActionMessage] = useState('');

  const handleToggle = (id: string) => {
    setWorkflows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isActive: !w.isActive } : w))
    );
  };

  const handleCreateWorkflow = (e: React.FormEvent) => {
    e.preventDefault();
    const newWf = {
      id: `wf-${Date.now()}`,
      name,
      trigger: triggerType,
      triggerDesc: `Triggered on ${triggerType}`,
      actions: [actionMessage || 'Execute automated response action'],
      isActive: true,
      executionCount: 0,
    };
    setWorkflows((prev) => [newWf, ...prev]);
    setIsModalOpen(false);
    setName('');
    setActionMessage('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Zap className="w-5 h-5 text-indigo-600" />
            <span>Automation Workflow Engine & Sequences</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Automate welcome sequences, re-engagement follow-ups, and parcel tracking dispatches within Meta 24h policies.
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          variant="primary"
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Create Workflow
        </Button>
      </div>

      {/* Workflows List */}
      <div className="space-y-4">
        {workflows.map((wf) => (
          <Card key={wf.id} className="p-6 border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <h3 className="font-bold text-sm text-slate-900">{wf.name}</h3>
                  <Badge variant={wf.isActive ? 'success' : 'default'} size="sm">
                    {wf.isActive ? 'ACTIVE' : 'PAUSED'}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500">{wf.triggerDesc}</p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 font-medium">
                  {wf.executionCount} Executions
                </span>
                <Button
                  size="sm"
                  variant={wf.isActive ? 'outline' : 'primary'}
                  onClick={() => handleToggle(wf.id)}
                  leftIcon={wf.isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                >
                  {wf.isActive ? 'Pause' : 'Activate'}
                </Button>
              </div>
            </div>

            {/* Steps visualizer */}
            <div className="pt-4 flex flex-wrap items-center gap-3 text-xs">
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Steps:</span>
              {wf.actions.map((act: string, idx: number) => (
                <React.Fragment key={idx}>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 font-medium flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{act}</span>
                  </div>
                  {idx < wf.actions.length - 1 && (
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {/* Create Workflow Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Automation Workflow"
        description="Configure event triggers and multi-step action sequences."
      >
        <form onSubmit={handleCreateWorkflow} className="space-y-4">
          <Input
            label="Workflow Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. VIP Customer Thank You Follow-up"
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Trigger Event</label>
            <select
              value={triggerType}
              onChange={(e) => setTriggerType(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:ring-1 focus:ring-indigo-600"
            >
              <option value="NEW_CONVERSATION">When customer initiates first chat</option>
              <option value="KEYWORD_DETECTED">When specific keyword is mentioned</option>
              <option value="ORDER_CREATED">When new order is placed</option>
              <option value="INACTIVITY_TIMEOUT">When customer stops replying for X hours</option>
            </select>
          </div>

          <Input
            label="Action Message / Instructions"
            required
            value={actionMessage}
            onChange={(e) => setActionMessage(e.target.value)}
            placeholder="e.g. Send thank you note and 10% discount code"
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Create Workflow
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
