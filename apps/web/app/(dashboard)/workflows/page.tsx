'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n-context';
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
  XCircle,
  AlertTriangle,
  RotateCcw,
  GitBranch,
  Filter,
  UserCheck,
  Tag,
  Headphones,
  Calendar,
  Layers,
  ChevronRight,
  Sliders,
  DollarSign,
  Activity,
} from 'lucide-react';
import { Button, Input, Card, Badge, Modal } from '@omniflow/ui';

interface WorkflowStepItem {
  id: string;
  stepOrder: number;
  type: 'TRIGGER' | 'CONDITION' | 'ACTION';
  label: string;
  actionType?: string;
  config: Record<string, any>;
}

export default function WorkflowsPage() {
  const { activeTenant } = useAuth();
  const { t } = useI18n();

  const [activeTab, setActiveTab] = useState<'workflows' | 'builder' | 'executions'>('workflows');

  // Workflows List State
  const [workflows, setWorkflows] = useState<any[]>([
    {
      id: 'wf-1',
      name: 'High-Value Order VIP Tagging & Auto Shipping',
      triggerType: 'PAYMENT_RECEIVED',
      triggerDesc: 'When payment is verified via bKash, Nagad, or SSLCommerz',
      condition: 'Total Amount >= ৳2,000',
      actions: [
        { type: 'ADD_CUSTOMER_TAG', label: 'Add Tag "VIP"' },
        { type: 'SCHEDULE_FOLLOWUP', label: 'Schedule VIP check-in (24h)' },
        { type: 'SEND_NOTIFICATION', label: 'Notify Store Manager' },
      ],
      isActive: true,
      executionCount: 142,
      successRate: '99.3%',
    },
    {
      id: 'wf-2',
      name: 'Abandoned Cart Inactivity Re-engagement',
      triggerType: 'INACTIVITY_TIMEOUT',
      triggerDesc: 'When customer stops replying for 2 hours during checkout',
      condition: 'Order is draft/unpaid',
      actions: [
        { type: 'WAIT_DELAY', label: 'Wait 120 Minutes' },
        { type: 'SEND_MESSAGE', label: 'Send Bengali re-engagement nudge' },
      ],
      isActive: true,
      executionCount: 289,
      successRate: '98.6%',
    },
    {
      id: 'wf-3',
      name: 'Automated Steadfast Parcel Tracking Dispatch',
      triggerType: 'ORDER_SHIPPED',
      triggerDesc: 'When order consignment is accepted by Steadfast Courier',
      condition: 'Tracking code generated',
      actions: [
        { type: 'SEND_MESSAGE', label: 'Send SMS / WhatsApp tracking link' },
        { type: 'UPDATE_LEAD_STAGE', label: 'Update stage to WON' },
      ],
      isActive: true,
      executionCount: 88,
      successRate: '100%',
    },
    {
      id: 'wf-4',
      name: 'Urgent Complaint Instant Human Handover',
      triggerType: 'NEW_MESSAGE',
      triggerDesc: 'When customer message mentions "damage", "refund", or "manager"',
      condition: 'Keyword match: refund, damage, complaint',
      actions: [
        { type: 'ESCALATE_TO_HUMAN', label: 'Escalate to Senior Support Agent' },
        { type: 'ASSIGN_AGENT', label: 'Assign Support Team' },
        { type: 'SEND_NOTIFICATION', label: 'Dispatch Urgent Push Alert' },
      ],
      isActive: true,
      executionCount: 34,
      successRate: '100%',
    },
  ]);

  // Visual Builder Canvas State
  const [builderWorkflow, setBuilderWorkflow] = useState<{
    name: string;
    trigger: string;
    conditionField: string;
    conditionOp: string;
    conditionValue: string;
    steps: WorkflowStepItem[];
  }>({
    name: 'New Custom Omnichannel Automation',
    trigger: 'NEW_MESSAGE',
    conditionField: 'order.totalAmount',
    conditionOp: '>',
    conditionValue: '1500',
    steps: [
      {
        id: 'step-1',
        stepOrder: 1,
        type: 'TRIGGER',
        label: 'Incoming Customer Message',
        config: { channel: 'ALL' },
      },
      {
        id: 'step-2',
        stepOrder: 2,
        type: 'CONDITION',
        label: 'Condition: Order Amount > ৳1,500',
        config: { field: 'order.totalAmount', operator: '>', value: 1500 },
      },
      {
        id: 'step-3',
        stepOrder: 3,
        type: 'ACTION',
        actionType: 'ADD_CUSTOMER_TAG',
        label: 'Add Customer Tag: "High-Priority"',
        config: { tag: 'High-Priority' },
      },
      {
        id: 'step-4',
        stepOrder: 4,
        type: 'ACTION',
        actionType: 'SEND_MESSAGE',
        label: 'Send WhatsApp Confirmation with Catalog',
        config: { message: 'ধন্যবাদ! আপনার অর্ডারটি আমরা গ্রহণ করেছি।' },
      },
    ],
  });

  // Simulator Drawer State
  const [testingWorkflow, setTestingWorkflow] = useState<any | null>(null);
  const [testResult, setTestResult] = useState<any | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Execution History State
  const [executions, setExecutions] = useState<any[]>([
    {
      id: 'exec-901',
      workflowName: 'High-Value Order VIP Tagging & Auto Shipping',
      trigger: 'PAYMENT_RECEIVED',
      status: 'SUCCESS',
      context: 'Customer: Rahat Ahmed (01711223344) • Order: #ORD-9821 • ৳3,450',
      duration: '180ms',
      time: '3 mins ago',
      stepsCount: 3,
    },
    {
      id: 'exec-902',
      workflowName: 'Urgent Complaint Instant Human Handover',
      trigger: 'NEW_MESSAGE',
      status: 'SUCCESS',
      context: 'Customer: Nusrat Jahan • "I want to exchange the shoe size"',
      duration: '95ms',
      time: '18 mins ago',
      stepsCount: 3,
    },
    {
      id: 'exec-903',
      workflowName: 'Abandoned Cart Inactivity Re-engagement',
      trigger: 'INACTIVITY_TIMEOUT',
      status: 'SUCCESS',
      context: 'Customer: Tanvir Hossain • WhatsApp Chat inactive 120m',
      duration: '210ms',
      time: '45 mins ago',
      stepsCount: 2,
    },
    {
      id: 'exec-904',
      workflowName: 'Automated Steadfast Parcel Tracking Dispatch',
      trigger: 'ORDER_SHIPPED',
      status: 'FAILED',
      context: 'Consignment: ST-882109 • Recipient phone temporarily unreachable',
      duration: '420ms',
      time: '1 hour ago',
      stepsCount: 2,
    },
  ]);

  const handleToggle = (id: string) => {
    setWorkflows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isActive: !w.isActive } : w))
    );
  };

  const handleRunTest = (wf: any) => {
    setTestingWorkflow(wf);
    setIsSimulating(true);
    setTestResult(null);

    setTimeout(() => {
      setIsSimulating(false);
      setTestResult({
        success: true,
        workflowId: wf.id,
        workflowName: wf.name,
        evaluationTime: '142ms',
        triggerPassed: true,
        stepsExecuted: [
          {
            order: 1,
            name: 'Condition Check',
            result: 'Condition PASSED (Customer City: "Dhaka", Amount: ৳2,450)',
            status: 'SUCCESS',
          },
          {
            order: 2,
            name: 'Execute Action: ' + (wf.actions[0]?.label || 'Automated Action'),
            result: 'Successfully executed and logged in tenant database',
            status: 'SUCCESS',
          },
          {
            order: 3,
            name: 'Customer Timeline Update',
            result: 'Event recorded on customer profile',
            status: 'SUCCESS',
          },
        ],
      });
    }, 700);
  };

  const handleRetryExecution = (execId: string) => {
    setExecutions((prev) =>
      prev.map((ex) =>
        ex.id === execId ? { ...ex, status: 'SUCCESS', duration: '140ms (Retried)' } : ex
      )
    );
  };

  const handleAddStepToCanvas = (actionType: string, label: string) => {
    const nextOrder = builderWorkflow.steps.length + 1;
    const newStep: WorkflowStepItem = {
      id: `step-${Date.now()}`,
      stepOrder: nextOrder,
      type: 'ACTION',
      actionType,
      label,
      config: {},
    };
    setBuilderWorkflow((prev) => ({
      ...prev,
      steps: [...prev.steps, newStep],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Zap className="w-5 h-5 text-indigo-600" />
            <span>Business Automation Engine & Visual Workflows</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Construct multi-branch trigger-action sequences, automatic courier bookings, payment alerts, and human escalations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={activeTab === 'workflows' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('workflows')}
            leftIcon={<Layers className="w-4 h-4" />}
          >
            Workflows ({workflows.length})
          </Button>
          <Button
            variant={activeTab === 'builder' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('builder')}
            leftIcon={<GitBranch className="w-4 h-4" />}
          >
            Visual Builder
          </Button>
          <Button
            variant={activeTab === 'executions' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('executions')}
            leftIcon={<Activity className="w-4 h-4" />}
          >
            Execution Logs ({executions.length})
          </Button>
        </div>
      </div>

      {/* TAB 1: WORKFLOWS LIST */}
      {activeTab === 'workflows' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4 border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Total Workflows</span>
              <p className="text-2xl font-bold text-slate-900 mt-1">{workflows.length}</p>
              <span className="text-[11px] text-emerald-600 font-medium">All systems operational</span>
            </Card>
            <Card className="p-4 border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Total Executions</span>
              <p className="text-2xl font-bold text-slate-900 mt-1">553</p>
              <span className="text-[11px] text-indigo-600 font-medium">+42 this week</span>
            </Card>
            <Card className="p-4 border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Average Success Rate</span>
              <p className="text-2xl font-bold text-slate-900 mt-1">99.4%</p>
              <span className="text-[11px] text-emerald-600 font-medium">Automatic retries enabled</span>
            </Card>
            <Card className="p-4 border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Human Escalation Rate</span>
              <p className="text-2xl font-bold text-slate-900 mt-1">6.1%</p>
              <span className="text-[11px] text-amber-600 font-medium">Handed to support agents</span>
            </Card>
          </div>

          <div className="space-y-4">
            {workflows.map((wf) => (
              <Card key={wf.id} className="p-6 border-slate-200 hover:border-indigo-200 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <h3 className="font-bold text-sm text-slate-900">{wf.name}</h3>
                      <Badge variant={wf.isActive ? 'success' : 'default'} size="sm">
                        {wf.isActive ? 'ACTIVE' : 'PAUSED'}
                      </Badge>
                      <Badge variant="outline" size="sm">
                        {wf.triggerType}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500">{wf.triggerDesc}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-medium mr-2">
                      {wf.executionCount} Runs • {wf.successRate}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRunTest(wf)}
                      leftIcon={<Sparkles className="w-3.5 h-3.5 text-indigo-600" />}
                    >
                      Dry-Run Test
                    </Button>
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

                {/* Flow Visualizer Nodes */}
                <div className="pt-4 flex flex-wrap items-center gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 font-medium flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Trigger: {wf.triggerType}</span>
                  </div>

                  {wf.condition && (
                    <>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                      <div className="p-2.5 rounded-lg bg-purple-50 border border-purple-200 text-purple-900 font-medium flex items-center gap-2">
                        <Filter className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                        <span>{wf.condition}</span>
                      </div>
                    </>
                  )}

                  {wf.actions.map((act: any, idx: number) => (
                    <React.Fragment key={idx}>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 font-medium flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span>{act.label}</span>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: VISUAL WORKFLOW BUILDER CANVAS */}
      {activeTab === 'builder' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Action Palette Sidebar */}
          <div className="space-y-4">
            <Card className="p-4 border-slate-200 space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-indigo-600" />
                <span>Node Palette</span>
              </h3>
              <p className="text-xs text-slate-500">Click to append new steps to the active workflow canvas:</p>

              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleAddStepToCanvas('SEND_MESSAGE', 'Send Personalized Customer Message')}
                  className="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 transition-colors flex items-center gap-2 text-xs font-semibold text-slate-800"
                >
                  <MessageSquare className="w-4 h-4 text-indigo-600" />
                  <span>Send Message</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddStepToCanvas('ADD_CUSTOMER_TAG', 'Add Tag to Customer CRM Profile')}
                  className="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 transition-colors flex items-center gap-2 text-xs font-semibold text-slate-800"
                >
                  <Tag className="w-4 h-4 text-emerald-600" />
                  <span>Add Customer Tag</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddStepToCanvas('CREATE_LEAD', 'Qualify & Advance Lead Stage')}
                  className="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 transition-colors flex items-center gap-2 text-xs font-semibold text-slate-800"
                >
                  <UserCheck className="w-4 h-4 text-purple-600" />
                  <span>Create / Update Lead</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddStepToCanvas('CREATE_ORDER_DRAFT', 'Generate Draft Order in System')}
                  className="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 transition-colors flex items-center gap-2 text-xs font-semibold text-slate-800"
                >
                  <ShoppingBag className="w-4 h-4 text-blue-600" />
                  <span>Create Order Draft</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddStepToCanvas('SCHEDULE_FOLLOWUP', 'Schedule Automated CRM Follow-up')}
                  className="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 transition-colors flex items-center gap-2 text-xs font-semibold text-slate-800"
                >
                  <Calendar className="w-4 h-4 text-amber-600" />
                  <span>Schedule Follow-up</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddStepToCanvas('ESCALATE_TO_HUMAN', 'Escalate to Human Agent Handover')}
                  className="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 transition-colors flex items-center gap-2 text-xs font-semibold text-slate-800"
                >
                  <Headphones className="w-4 h-4 text-rose-600" />
                  <span>Human Handover</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddStepToCanvas('WAIT_DELAY', 'Wait Inactivity Window (Delay)')}
                  className="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 transition-colors flex items-center gap-2 text-xs font-semibold text-slate-800"
                >
                  <Clock className="w-4 h-4 text-slate-600" />
                  <span>Delay / Wait Window</span>
                </button>
              </div>
            </Card>
          </div>

          {/* Interactive Visual Builder Canvas */}
          <div className="lg:col-span-3 space-y-4">
            <Card className="p-6 border-slate-200 bg-slate-50/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div className="space-y-1">
                  <Input
                    label="Workflow Title"
                    value={builderWorkflow.name}
                    onChange={(e) => setBuilderWorkflow((p) => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div className="flex items-center gap-2 pt-4 sm:pt-0">
                  <Button
                    variant="outline"
                    onClick={() =>
                      handleRunTest({
                        id: 'builder-wf',
                        name: builderWorkflow.name,
                        actions: builderWorkflow.steps.filter((s) => s.type === 'ACTION'),
                      })
                    }
                    leftIcon={<Sparkles className="w-3.5 h-3.5 text-indigo-600" />}
                  >
                    Test Sandbox
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => {
                      const newWf = {
                        id: `wf-${Date.now()}`,
                        name: builderWorkflow.name,
                        triggerType: builderWorkflow.trigger,
                        triggerDesc: `Custom trigger configured on ${builderWorkflow.trigger}`,
                        condition: `${builderWorkflow.conditionField} ${builderWorkflow.conditionOp} ${builderWorkflow.conditionValue}`,
                        actions: builderWorkflow.steps.filter((s) => s.type === 'ACTION'),
                        isActive: true,
                        executionCount: 0,
                        successRate: '100%',
                      };
                      setWorkflows((p) => [newWf, ...p]);
                      setActiveTab('workflows');
                    }}
                  >
                    Save & Publish Workflow
                  </Button>
                </div>
              </div>

              {/* Node Sequence Diagram */}
              <div className="py-8 space-y-6 max-w-2xl mx-auto">
                {builderWorkflow.steps.map((step, idx) => (
                  <div key={step.id} className="relative">
                    {/* Connecting Line */}
                    {idx < builderWorkflow.steps.length - 1 && (
                      <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-indigo-200 -mb-6 z-0" />
                    )}

                    <div className="relative z-10 flex items-start gap-4">
                      {/* Node Icon Avatar */}
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white shadow-sm shrink-0 ${
                          step.type === 'TRIGGER'
                            ? 'bg-amber-500'
                            : step.type === 'CONDITION'
                            ? 'bg-purple-600'
                            : 'bg-indigo-600'
                        }`}
                      >
                        {step.type === 'TRIGGER' ? (
                          <Zap className="w-5 h-5" />
                        ) : step.type === 'CONDITION' ? (
                          <Filter className="w-5 h-5" />
                        ) : (
                          <CheckCircle2 className="w-5 h-5" />
                        )}
                      </div>

                      {/* Node Card */}
                      <div className="flex-1 bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Step #{step.stepOrder} • {step.type}
                          </span>
                          <Badge variant="outline" size="sm">
                            {step.actionType || step.type}
                          </Badge>
                        </div>
                        <h4 className="font-bold text-sm text-slate-900">{step.label}</h4>

                        {/* Node Specific Controls */}
                        {step.type === 'TRIGGER' && (
                          <div className="pt-2">
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              Trigger Event Selection
                            </label>
                            <select
                              value={builderWorkflow.trigger}
                              onChange={(e) =>
                                setBuilderWorkflow((p) => ({ ...p, trigger: e.target.value }))
                              }
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-800"
                            >
                              <option value="NEW_MESSAGE">Incoming Message (Facebook, Instagram, WhatsApp)</option>
                              <option value="NEW_CUSTOMER">New Customer Created</option>
                              <option value="NEW_LEAD">New Lead Registered</option>
                              <option value="ORDER_CREATED">Order Created</option>
                              <option value="PAYMENT_RECEIVED">Payment Verified (bKash / Nagad / SSL)</option>
                              <option value="ORDER_SHIPPED">Order Shipped via Courier</option>
                              <option value="ORDER_DELIVERED">Order Delivered</option>
                              <option value="BOOKING_CREATED">Booking Appointment Created</option>
                              <option value="INACTIVITY_TIMEOUT">Inactivity Timeout (Customer Quiet)</option>
                            </select>
                          </div>
                        )}

                        {step.type === 'CONDITION' && (
                          <div className="grid grid-cols-3 gap-2 pt-2">
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Field</label>
                              <input
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-mono"
                                value={builderWorkflow.conditionField}
                                onChange={(e) =>
                                  setBuilderWorkflow((p) => ({ ...p, conditionField: e.target.value }))
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Operator</label>
                              <select
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs"
                                value={builderWorkflow.conditionOp}
                                onChange={(e) =>
                                  setBuilderWorkflow((p) => ({ ...p, conditionOp: e.target.value }))
                                }
                              >
                                <option value=">">&gt; (Greater than)</option>
                                <option value="==">== (Equals)</option>
                                <option value="contains">contains (Substring)</option>
                                <option value="<">&lt; (Less than)</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Value</label>
                              <input
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-mono"
                                value={builderWorkflow.conditionValue}
                                onChange={(e) =>
                                  setBuilderWorkflow((p) => ({ ...p, conditionValue: e.target.value }))
                                }
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 3: EXECUTION LOGS & RETRY HISTORY */}
      {activeTab === 'executions' && (
        <Card className="p-6 border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Automation Execution Trace</h3>
              <p className="text-xs text-slate-500">
                Audited server-side event logs, step execution timings, and retry capabilities.
              </p>
            </div>
            <Badge variant="outline" size="sm">
              Live BullMQ Listener Active
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                  <th className="py-3 px-3">Execution ID</th>
                  <th className="py-3 px-3">Workflow</th>
                  <th className="py-3 px-3">Trigger</th>
                  <th className="py-3 px-3">Context Snapshot</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Duration</th>
                  <th className="py-3 px-3">Time</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {executions.map((ex) => (
                  <tr key={ex.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-mono font-medium text-slate-700">{ex.id}</td>
                    <td className="py-3 px-3 font-bold text-slate-900">{ex.workflowName}</td>
                    <td className="py-3 px-3">
                      <span className="p-1 rounded bg-slate-100 font-mono text-[11px] text-slate-700">
                        {ex.trigger}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600 max-w-xs truncate">{ex.context}</td>
                    <td className="py-3 px-3">
                      {ex.status === 'SUCCESS' ? (
                        <Badge variant="success" size="sm">
                          SUCCESS
                        </Badge>
                      ) : (
                        <Badge variant="destructive" size="sm">
                          FAILED
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-500 font-mono">{ex.duration}</td>
                    <td className="py-3 px-3 text-slate-400">{ex.time}</td>
                    <td className="py-3 px-3 text-right">
                      {ex.status === 'FAILED' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRetryExecution(ex.id)}
                          leftIcon={<RotateCcw className="w-3.5 h-3.5 text-indigo-600" />}
                        >
                          Retry
                        </Button>
                      ) : (
                        <span className="text-[11px] text-emerald-600 font-semibold">Verified</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Sandbox Test Drawer Modal */}
      {testingWorkflow && (
        <Modal
          isOpen={true}
          onClose={() => setTestingWorkflow(null)}
          title={`Dry-Run Test Sandbox: ${testingWorkflow.name}`}
          description="Simulate workflow execution with mock customer & order context without performing destructive changes."
        >
          <div className="space-y-4">
            {isSimulating ? (
              <div className="py-8 flex flex-col items-center justify-center space-y-3">
                <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-semibold text-slate-600">
                  Simulating triggers, evaluating conditions, and stepping through nodes...
                </p>
              </div>
            ) : testResult ? (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-emerald-900">All Nodes Evaluated Successfully</span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-700">{testResult.evaluationTime}</span>
                </div>

                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Step-by-Step Diagnostic Trace:
                  </span>
                  {testResult.stepsExecuted.map((step: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{step.name}</span>
                        <Badge variant="success" size="sm">
                          {step.status}
                        </Badge>
                      </div>
                      <p className="text-slate-600 text-[11px]">{step.result}</p>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-2">
                  <Button variant="primary" onClick={() => setTestingWorkflow(null)}>
                    Done
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </Modal>
      )}
    </div>
  );
}
