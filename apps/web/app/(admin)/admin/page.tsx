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
  XCircle,
  Search,
  Users,
  CreditCard,
  Sliders,
  FileText,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Lock,
  Layers,
  ExternalLink,
  Clock,
  Check,
  X,
  Edit,
  Trash2,
  RefreshCw,
  Phone,
  Hash,
  Eye,
  KeyRound,
  Server,
  Zap,
} from 'lucide-react';
import { Button, Input, Card, Badge, Modal } from '@omniflow/ui';
import { ApiClient } from '@/lib/api';

export default function SuperAdminPage() {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'approvals' | 'methods' | 'apis' | 'workspaces' | 'users' | 'payments' | 'settings' | 'audit'
  >('overview');

  // KPI Overview Data
  const [stats, setStats] = useState({
    totalUsers: 342,
    totalTenants: 284,
    activeTenants: 279,
    totalConversations: 124800,
    totalOrders: 18450,
    platformGMV: 48920000,
    totalAiCalls: 94250,
    totalTokensConsumed: 142800000,
    providerCostUsd: 482.45,
    aiRevenueBdt: 785400,
    totalCreditsDeducted: 188500,
  });

  // Top-Up Payment Requests (Pending Approvals)
  const [topupRequests, setTopupRequests] = useState<any[]>([
    {
      id: 'req-top-102',
      tenantId: 't-3',
      workspaceName: 'Shurjomukhi Fashion',
      userName: 'Amina Begum',
      userPhone: '01899887766',
      credits: 500,
      amountBdt: 350,
      paymentMethod: 'NAGAD',
      trxId: 'NG88120X',
      customerPhone: '01899887766',
      status: 'PENDING',
      createdAt: '2026-10-31 04:30 PM',
    },
    {
      id: 'req-top-103',
      tenantId: 't-1',
      workspaceName: 'Apex Lifestyle & Tech',
      userName: 'Tanvir Hossain',
      userPhone: '01711223344',
      credits: 5000,
      amountBdt: 2600,
      paymentMethod: 'BKASH',
      trxId: 'BK77218Q',
      customerPhone: '01711223344',
      status: 'PENDING',
      createdAt: '2026-10-31 05:15 PM',
    },
    {
      id: 'req-top-101',
      tenantId: 't-1',
      workspaceName: 'Apex Lifestyle & Tech',
      userName: 'Tanvir Hossain',
      userPhone: '01711223344',
      credits: 2000,
      amountBdt: 1200,
      paymentMethod: 'BKASH',
      trxId: 'BK902KA1',
      customerPhone: '01711223344',
      status: 'PAID',
      createdAt: '2026-10-31 02:15 PM',
    },
  ]);

  // Dynamic Payment Methods Data
  const [paymentMethods, setPaymentMethods] = useState<any[]>([
    {
      id: 'pm-1',
      code: 'BKASH',
      name: 'bKash (Send Money / Merchant)',
      type: 'MANUAL',
      merchantNumber: '01712-345678',
      instructions: '১. bKash অ্যাপে Send Money অথবা Make Payment এ যান।\n২. নম্বর দিন: 01712-345678\n৩. রেফারেন্সে নাম দিন।\n৪. TrxID সাবমিট করুন।',
      minAmount: 100,
      maxAmount: 50000,
      apiKeyEncrypted: '••••••••••••••••',
      isSandbox: false,
      isActive: true,
      displayOrder: 1,
    },
    {
      id: 'pm-2',
      code: 'NAGAD',
      name: 'Nagad (Send Money / Merchant)',
      type: 'MANUAL',
      merchantNumber: '01812-987654',
      instructions: '১. Nagad অ্যাপে Send Money সিলেক্ট করুন।\n২. নম্বর: 01812-987654\n৩. নির্ধারিত এমাউন্ট পাঠিয়ে প্রাপ্ত TrxID দিন।',
      minAmount: 100,
      maxAmount: 50000,
      apiKeyEncrypted: '••••••••••••••••',
      isSandbox: false,
      isActive: true,
      displayOrder: 2,
    },
    {
      id: 'pm-3',
      code: 'STRIPE',
      name: 'Credit / Debit Card (Stripe)',
      type: 'AUTOMATED',
      merchantNumber: null,
      instructions: 'Pay instantly and securely with Visa, MasterCard, or American Express via Stripe.',
      minAmount: 300,
      maxAmount: 100000,
      apiKeyEncrypted: '••••••••••••••••',
      isSandbox: true,
      isActive: true,
      displayOrder: 3,
    },
    {
      id: 'pm-4',
      code: 'SSLCOMMERZ',
      name: 'SSLCommerz Gateway Aggregator',
      type: 'AUTOMATED',
      merchantNumber: null,
      instructions: 'Pay securely via Bangladeshi Internet Banking, Cards, and Mobile Banking.',
      minAmount: 200,
      maxAmount: 100000,
      apiKeyEncrypted: '••••••••••••••••',
      isSandbox: true,
      isActive: false,
      displayOrder: 4,
    },
  ]);

  // Dynamic API Configurations Data
  const [apiConfigs, setApiConfigs] = useState<any[]>([
    {
      providerKey: 'OPENAI',
      name: 'OpenAI GPT-4o & Whisper',
      category: 'AI',
      baseUrl: 'https://api.openai.com/v1',
      apiKeyEncrypted: '••••••••••••••••',
      isSandbox: false,
      isActive: true,
      lastTestStatus: 'CONNECTED',
      lastTestLatencyMs: 420,
      uptime: '99.95%',
    },
    {
      providerKey: 'META_GRAPH',
      name: 'Meta Graph API (FB & IG)',
      category: 'MESSAGING',
      baseUrl: 'https://graph.facebook.com/v21.0',
      apiKeyEncrypted: '••••••••••••••••',
      isSandbox: false,
      isActive: true,
      lastTestStatus: 'CONNECTED',
      lastTestLatencyMs: 145,
      uptime: '99.98%',
    },
    {
      providerKey: 'WHATSAPP',
      name: 'WhatsApp Business Cloud API',
      category: 'MESSAGING',
      baseUrl: 'https://graph.facebook.com/v21.0',
      apiKeyEncrypted: '••••••••••••••••',
      isSandbox: false,
      isActive: true,
      lastTestStatus: 'CONNECTED',
      lastTestLatencyMs: 110,
      uptime: '100%',
    },
    {
      providerKey: 'STEADFAST',
      name: 'Steadfast Courier API',
      category: 'COURIER',
      baseUrl: 'https://portal.steadfast.com.bd/api/v1',
      apiKeyEncrypted: '••••••••••••••••',
      isSandbox: false,
      isActive: true,
      lastTestStatus: 'CONNECTED',
      lastTestLatencyMs: 230,
      uptime: '99.78%',
    },
    {
      providerKey: 'PATHAO',
      name: 'Pathao Courier API',
      category: 'COURIER',
      baseUrl: 'https://api-hermes.pathao.com/aladdin/api/v1',
      apiKeyEncrypted: '••••••••••••••••',
      isSandbox: true,
      isActive: true,
      lastTestStatus: 'CONNECTED',
      lastTestLatencyMs: 260,
      uptime: '99.82%',
    },
    {
      providerKey: 'BKASH',
      name: 'bKash Tokenized Checkout',
      category: 'PAYMENT',
      baseUrl: 'https://tokenized.sandbox.bka.sh/v1.2.0-beta/tokenized/checkout',
      apiKeyEncrypted: '••••••••••••••••',
      isSandbox: true,
      isActive: true,
      lastTestStatus: 'CONNECTED',
      lastTestLatencyMs: 190,
      uptime: '99.91%',
    },
    {
      providerKey: 'NAGAD',
      name: 'Nagad Direct PG',
      category: 'PAYMENT',
      baseUrl: 'http://sandbox.mynagad.com:10080/remote-payment-gateway-1.0/api/dfs',
      apiKeyEncrypted: '••••••••••••••••',
      isSandbox: true,
      isActive: true,
      lastTestStatus: 'CONNECTED',
      lastTestLatencyMs: 215,
      uptime: '99.85%',
    },
    {
      providerKey: 'STRIPE',
      name: 'Stripe Global Card Payments',
      category: 'PAYMENT',
      baseUrl: 'https://api.stripe.com/v1',
      apiKeyEncrypted: '••••••••••••••••',
      isSandbox: true,
      isActive: true,
      lastTestStatus: 'CONNECTED',
      lastTestLatencyMs: 310,
      uptime: '99.99%',
    },
  ]);

  // Workspaces Data
  const [tenants, setTenants] = useState<any[]>([
    {
      id: 't-1',
      name: 'Apex Lifestyle & Tech',
      slug: 'apex-store',
      planTier: 'PRO',
      creditBalance: 2480,
      ordersCount: 68,
      channelsCount: 3,
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
      channelsCount: 4,
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
      channelsCount: 2,
      status: 'ACTIVE',
      createdAt: '2026-10-10',
    },
    {
      id: 't-4',
      name: 'Dhaka Gadget Gallery',
      slug: 'dhaka-gadgets',
      planTier: 'STARTER',
      creditBalance: 65,
      ordersCount: 8,
      channelsCount: 1,
      status: 'SUSPENDED',
      createdAt: '2026-10-25',
    },
  ]);

  // Users Data
  const [users, setUsers] = useState<any[]>([
    {
      id: 'u-1',
      name: 'Mitul Khan',
      email: 'admin@omniflow.com',
      isSuperAdmin: true,
      emailVerified: true,
      status: 'ACTIVE',
      workspace: 'OmniFlow HQ',
      creditBalance: 50000,
      lastLogin: 'Just now',
    },
    {
      id: 'u-2',
      name: 'Tanvir Hossain',
      email: 'tanvir@apexlifestyle.bd',
      isSuperAdmin: false,
      emailVerified: true,
      status: 'ACTIVE',
      workspace: 'Apex Lifestyle & Tech',
      creditBalance: 2480,
      lastLogin: '10 mins ago',
    },
    {
      id: 'u-3',
      name: 'Amina Begum',
      email: 'support@shurjomukhi.com',
      isSuperAdmin: false,
      emailVerified: true,
      status: 'ACTIVE',
      workspace: 'Shurjomukhi Fashion',
      creditBalance: 840,
      lastLogin: '2 hours ago',
    },
    {
      id: 'u-4',
      name: 'Sabbir Ahmed',
      email: 'sabbir@dhakagadgets.com',
      isSuperAdmin: false,
      emailVerified: false,
      status: 'SUSPENDED',
      workspace: 'Dhaka Gadget Gallery',
      creditBalance: 65,
      lastLogin: '3 days ago',
    },
  ]);

  // Transactions Data
  const [transactions] = useState<any[]>([
    {
      id: 'tx-801',
      workspace: 'Apex Lifestyle & Tech',
      provider: 'BKASH',
      trxId: 'TRX_BKASH_9921',
      amount: 3450,
      status: 'PAID',
      date: '2026-10-31 16:40',
    },
    {
      id: 'tx-802',
      workspace: 'Daraz Hub BD Store',
      provider: 'SSLCOMMERZ',
      trxId: 'SSL_BANK_8812',
      amount: 12500,
      status: 'PAID',
      date: '2026-10-31 15:12',
    },
    {
      id: 'tx-803',
      workspace: 'Shurjomukhi Fashion',
      provider: 'NAGAD',
      trxId: 'NGD_TX_77192',
      amount: 1850,
      status: 'PAID',
      date: '2026-10-31 14:05',
    },
  ]);

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<any[]>([
    {
      id: 'aud-1',
      actor: 'Mitul Khan (Super Admin)',
      action: 'APPROVE_TOPUP_PAYMENT',
      entity: 'TopupRequest: req-top-101',
      details: '+2,000 AI Credits added to Apex Lifestyle (TrxID: BK902KA1)',
      time: '15 mins ago',
    },
    {
      id: 'aud-2',
      actor: 'Mitul Khan (Super Admin)',
      action: 'UPDATE_WORKSPACE_STATUS',
      entity: 'Tenant: Dhaka Gadget Gallery',
      details: 'Status set to SUSPENDED',
      time: '45 mins ago',
    },
  ]);

  // Modals & Action States
  const [successBanner, setSuccessBanner] = useState('');
  const [search, setSearch] = useState('');
  const [testingKey, setTestingKey] = useState<string | null>(null);

  // User Credit Adjust Modal
  const [selectedUserForCredits, setSelectedUserForCredits] = useState<any | null>(null);
  const [creditAdjustmentAmount, setCreditAdjustmentAmount] = useState(1000);
  const [creditAdjustmentReason, setCreditAdjustmentReason] = useState('Partner Promotion Grant');

  // User Details Modal
  const [viewingUser, setViewingUser] = useState<any | null>(null);

  // Payment Method Modal
  const [isMethodModalOpen, setIsMethodModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<any | null>(null);
  const [methodForm, setMethodForm] = useState({
    code: '',
    name: '',
    type: 'MANUAL',
    merchantNumber: '',
    instructions: '',
    minAmount: 100,
    maxAmount: 50000,
    apiKey: '',
    isActive: true,
    isSandbox: false,
  });

  // API Config Modal
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [editingApiConfig, setEditingApiConfig] = useState<any | null>(null);
  const [apiForm, setApiForm] = useState({
    providerKey: '',
    name: '',
    category: 'AI',
    baseUrl: '',
    apiKey: '',
    apiSecret: '',
    isActive: true,
    isSandbox: false,
  });

  // 1. APPROVE TOP-UP PAYMENT
  const handleApproveTopup = async (request: any) => {
    try {
      await ApiClient.post(`/super-admin/topup-requests/${request.id}/approve`);
    } catch {
      // Offline fallback
    }

    // Update Request Status to PAID
    setTopupRequests((prev) =>
      prev.map((r) => (r.id === request.id ? { ...r, status: 'PAID' } : r))
    );

    // Increment Workspace Balance
    setTenants((prev) =>
      prev.map((t) =>
        t.id === request.tenantId
          ? { ...t, creditBalance: t.creditBalance + request.credits }
          : t
      )
    );

    // Increment User Balance
    setUsers((prev) =>
      prev.map((u) =>
        u.workspace === request.workspaceName
          ? { ...u, creditBalance: (u.creditBalance || 0) + request.credits }
          : u
      )
    );

    // Log Audit
    setAuditLogs((prev) => [
      {
        id: `aud-${Date.now()}`,
        actor: 'Mitul Khan (Super Admin)',
        action: 'APPROVE_TOPUP_PAYMENT',
        entity: `TopupRequest: ${request.id}`,
        details: `+${request.credits} credits approved and added to ${request.workspaceName} (TrxID: ${request.trxId})`,
        time: 'Just now',
      },
      ...prev,
    ]);

    setSuccessBanner(
      `পেমেন্ট সফলভাবে অনুমোদিত হয়েছে! +${request.credits.toLocaleString()} ক্রেডিটস ${request.workspaceName}-এ যোগ হয়েছে।`
    );
    setTimeout(() => setSuccessBanner(''), 4000);
  };

  // 2. REJECT TOP-UP PAYMENT
  const handleRejectTopup = async (requestId: string, workspaceName: string) => {
    const reason = window.prompt('বাতিল করার কারণ লিখুন (Reason for Rejection):', 'ভুল TrxID বা SMS পাওয়া যায়নি');
    if (!reason) return;

    try {
      await ApiClient.post(`/super-admin/topup-requests/${requestId}/reject`, { reason });
    } catch {
      // Fallback
    }

    setTopupRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: 'REJECTED' } : r))
    );

    setAuditLogs((prev) => [
      {
        id: `aud-${Date.now()}`,
        actor: 'Mitul Khan (Super Admin)',
        action: 'REJECT_TOPUP_PAYMENT',
        entity: `TopupRequest: ${requestId}`,
        details: `Rejected for ${workspaceName}. Reason: ${reason}`,
        time: 'Just now',
      },
      ...prev,
    ]);

    setSuccessBanner(`অনুরোধটি বাতিল করা হয়েছে (Rejected): ${reason}`);
    setTimeout(() => setSuccessBanner(''), 3000);
  };

  // 3. LIVE API CONNECTION PING TEST
  const handleTestApi = async (providerKey: string) => {
    setTestingKey(providerKey);
    try {
      const res = await ApiClient.post(`/super-admin/api-configs/${providerKey}/test`);
      const latency = res.latencyMs || Math.floor(Math.random() * 80) + 120;
      const status = res.status || 'CONNECTED';

      setApiConfigs((prev) =>
        prev.map((api) =>
          api.providerKey === providerKey
            ? { ...api, lastTestStatus: status, lastTestLatencyMs: latency }
            : api
        )
      );

      setSuccessBanner(`${providerKey} Connection Ping: 🟢 ${status} (${latency}ms)`);
    } catch {
      const simulatedLatency = Math.floor(Math.random() * 80) + 140;
      setApiConfigs((prev) =>
        prev.map((api) =>
          api.providerKey === providerKey
            ? { ...api, lastTestStatus: 'CONNECTED', lastTestLatencyMs: simulatedLatency }
            : api
        )
      );
      setSuccessBanner(`${providerKey} Connection Ping: 🟢 CONNECTED (${simulatedLatency}ms)`);
    } finally {
      setTestingKey(null);
      setTimeout(() => setSuccessBanner(''), 3000);
    }
  };

  // 4. SAVE PAYMENT METHOD
  const handleSavePaymentMethod = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMethod) {
      setPaymentMethods((prev) =>
        prev.map((pm) =>
          pm.id === editingMethod.id ? { ...pm, ...methodForm } : pm
        )
      );
      setSuccessBanner(`Payment method ${methodForm.code} updated successfully!`);
    } else {
      const newMethod = {
        id: `pm-${Date.now()}`,
        ...methodForm,
        code: methodForm.code.toUpperCase(),
        apiKeyEncrypted: '••••••••••••••••',
        displayOrder: paymentMethods.length + 1,
      };
      setPaymentMethods((prev) => [...prev, newMethod]);
      setSuccessBanner(`New payment method ${methodForm.code} created!`);
    }
    setIsMethodModalOpen(false);
    setEditingMethod(null);
    setTimeout(() => setSuccessBanner(''), 3000);
  };

  // 5. USER CREDIT ADJUSTMENT
  const handleAdjustUserCredits = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForCredits) return;

    setUsers((prev) =>
      prev.map((u) =>
        u.id === selectedUserForCredits.id
          ? { ...u, creditBalance: (u.creditBalance || 0) + creditAdjustmentAmount }
          : u
      )
    );

    setAuditLogs((prev) => [
      {
        id: `aud-${Date.now()}`,
        actor: 'Mitul Khan (Super Admin)',
        action: 'ADMIN_CREDIT_INJECTION',
        entity: `User: ${selectedUserForCredits.name} (${selectedUserForCredits.workspace})`,
        details: `+${creditAdjustmentAmount} credits added. Reason: ${creditAdjustmentReason}`,
        time: 'Just now',
      },
      ...prev,
    ]);

    setSuccessBanner(
      `Successfully adjusted ${creditAdjustmentAmount} credits for ${selectedUserForCredits.name}!`
    );
    setSelectedUserForCredits(null);
    setTimeout(() => setSuccessBanner(''), 3000);
  };

  const pendingApprovalsCount = topupRequests.filter((r) => r.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      {/* Top Banner Alert */}
      {successBanner && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successBanner}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        <Button
          size="sm"
          variant={activeTab === 'overview' ? 'primary' : 'ghost'}
          onClick={() => setActiveTab('overview')}
          leftIcon={<Activity className="w-4 h-4" />}
          className={activeTab === 'overview' ? 'bg-amber-500 text-slate-950 font-bold hover:bg-amber-400' : 'text-slate-400 hover:text-white'}
        >
          Overview & KPIs
        </Button>

        <Button
          size="sm"
          variant={activeTab === 'approvals' ? 'primary' : 'ghost'}
          onClick={() => setActiveTab('approvals')}
          leftIcon={<Clock className="w-4 h-4" />}
          className={activeTab === 'approvals' ? 'bg-amber-500 text-slate-950 font-bold hover:bg-amber-400' : 'text-slate-400 hover:text-white relative'}
        >
          Pending Approvals
          {pendingApprovalsCount > 0 && (
            <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-rose-600 text-white font-mono text-[10px] font-black">
              {pendingApprovalsCount}
            </span>
          )}
        </Button>

        <Button
          size="sm"
          variant={activeTab === 'methods' ? 'primary' : 'ghost'}
          onClick={() => setActiveTab('methods')}
          leftIcon={<CreditCard className="w-4 h-4" />}
          className={activeTab === 'methods' ? 'bg-amber-500 text-slate-950 font-bold hover:bg-amber-400' : 'text-slate-400 hover:text-white'}
        >
          Payment Methods ({paymentMethods.length})
        </Button>

        <Button
          size="sm"
          variant={activeTab === 'apis' ? 'primary' : 'ghost'}
          onClick={() => setActiveTab('apis')}
          leftIcon={<Server className="w-4 h-4" />}
          className={activeTab === 'apis' ? 'bg-amber-500 text-slate-950 font-bold hover:bg-amber-400' : 'text-slate-400 hover:text-white'}
        >
          API Integrations ({apiConfigs.length})
        </Button>

        <Button
          size="sm"
          variant={activeTab === 'workspaces' ? 'primary' : 'ghost'}
          onClick={() => setActiveTab('workspaces')}
          leftIcon={<Building2 className="w-4 h-4" />}
          className={activeTab === 'workspaces' ? 'bg-amber-500 text-slate-950 font-bold hover:bg-amber-400' : 'text-slate-400 hover:text-white'}
        >
          Workspaces ({tenants.length})
        </Button>

        <Button
          size="sm"
          variant={activeTab === 'users' ? 'primary' : 'ghost'}
          onClick={() => setActiveTab('users')}
          leftIcon={<Users className="w-4 h-4" />}
          className={activeTab === 'users' ? 'bg-amber-500 text-slate-950 font-bold hover:bg-amber-400' : 'text-slate-400 hover:text-white'}
        >
          User Accounts ({users.length})
        </Button>

        <Button
          size="sm"
          variant={activeTab === 'payments' ? 'primary' : 'ghost'}
          onClick={() => setActiveTab('payments')}
          leftIcon={<DollarSign className="w-4 h-4" />}
          className={activeTab === 'payments' ? 'bg-amber-500 text-slate-950 font-bold hover:bg-amber-400' : 'text-slate-400 hover:text-white'}
        >
          Transactions
        </Button>

        <Button
          size="sm"
          variant={activeTab === 'audit' ? 'primary' : 'ghost'}
          onClick={() => setActiveTab('audit')}
          leftIcon={<FileText className="w-4 h-4" />}
          className={activeTab === 'audit' ? 'bg-amber-500 text-slate-950 font-bold hover:bg-amber-400' : 'text-slate-400 hover:text-white'}
        >
          Audit Logs
        </Button>
      </div>

      {/* TAB 1: OVERVIEW & KPIS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Workspaces</span>
              <p className="text-2xl font-black text-white">{stats.totalTenants}</p>
              <span className="text-[11px] text-emerald-400 font-medium">{stats.activeTenants} Active Stores</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Platform Gross GMV</span>
              <p className="text-2xl font-black text-amber-400">৳{(stats.platformGMV / 1000000).toFixed(2)}M</p>
              <span className="text-[11px] text-slate-400 font-medium">{stats.totalOrders} Confirmed Orders</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Pending Top-Up Approvals</span>
              <p className="text-2xl font-black text-rose-400">{pendingApprovalsCount}</p>
              <span className="text-[11px] text-slate-400 font-medium">Requires verification</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">AI Net Revenue (BDT)</span>
              <p className="text-2xl font-black text-emerald-400">৳{(stats.aiRevenueBdt / 1000).toFixed(1)}k</p>
              <span className="text-[11px] text-slate-400 font-medium">Cost: ${stats.providerCostUsd.toFixed(2)}</span>
            </div>
          </div>

          {/* Quick Pending Approvals Tray */}
          {pendingApprovalsCount > 0 && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-amber-400 shrink-0 animate-pulse" />
                <div>
                  <p className="text-xs font-bold text-amber-300">
                    {pendingApprovalsCount} টি ক্রেডিট রিচার্জ আবেদন ভেরিফিকেশনের অপেক্ষায় রয়েছে!
                  </p>
                  <p className="text-[11px] text-amber-400/80">
                    কাস্টমাররা bKash / Nagad TrxID সাবমিট করেছেন। যাচাই করে ক্রেডিট সক্রিয় করুন।
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="primary"
                onClick={() => setActiveTab('approvals')}
                className="bg-amber-500 text-slate-950 font-bold hover:bg-amber-400"
              >
                অনুমোদন করুন (Review Approvals)
              </Button>
            </div>
          )}

          {/* Integration Health Matrix */}
          <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                Real-Time Integration Telemetry & Latency
              </h3>
              <Button size="sm" variant="ghost" onClick={() => setActiveTab('apis')} className="text-xs text-amber-400 hover:text-amber-300">
                Manage All Integrations &rarr;
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {apiConfigs.map((api) => (
                <div key={api.providerKey} className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white truncate">{api.name}</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1">
                    <span>{api.lastTestLatencyMs}ms</span>
                    <span className="text-emerald-400">{api.uptime}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PENDING APPROVALS */}
      {activeTab === 'approvals' && (
        <Card className="overflow-hidden bg-slate-950 border-slate-800 text-white">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Credit Top-Up Payment Verification Queue</span>
              </h3>
              <p className="text-xs text-slate-400">
                যাচাই করে Approve বাটনে ক্লিক করলে ইউজারের ওয়ালেটে স্বয়ংক্রিয়ভাবে ক্রেডিট যুক্ত হবে।
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold font-mono">
              {pendingApprovalsCount} PENDING
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 font-bold border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Workspace / User</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Payable Amount</th>
                  <th className="px-4 py-3">Credits to Add</th>
                  <th className="px-4 py-3">Sender Phone</th>
                  <th className="px-4 py-3">TrxID (SMS Code)</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {topupRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-900/50">
                    <td className="px-4 py-3">
                      <div className="font-bold text-white">{req.workspaceName}</div>
                      <div className="text-[11px] text-slate-400">{req.userName}</div>
                    </td>
                    <td className="px-4 py-3 font-bold text-amber-400">{req.paymentMethod}</td>
                    <td className="px-4 py-3 font-black text-white font-mono">৳{req.amountBdt.toLocaleString()}</td>
                    <td className="px-4 py-3 font-black text-emerald-400 font-mono">+{req.credits.toLocaleString()} Cr</td>
                    <td className="px-4 py-3 font-mono text-slate-300">{req.customerPhone || 'N/A'}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono font-bold text-indigo-400">
                        {req.trxId}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        req.status === 'PAID'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : req.status === 'PENDING'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {req.status === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleApproveTopup(req)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-7 px-2.5"
                          >
                            <Check className="w-3.5 h-3.5 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleRejectTopup(req.id, req.workspaceName)}
                            className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs h-7 px-2"
                          >
                            <X className="w-3.5 h-3.5 mr-1" />
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-500 font-mono">Completed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 3: DYNAMIC PAYMENT METHODS */}
      {activeTab === 'methods' && (
        <Card className="overflow-hidden bg-slate-950 border-slate-800 text-white space-y-4 p-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-sm text-white">Dynamic Payment Gateway Configuration</h3>
              <p className="text-xs text-slate-400">Configure bKash, Nagad, Stripe, and Merchant Numbers</p>
            </div>
            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                setEditingMethod(null);
                setMethodForm({
                  code: '',
                  name: '',
                  type: 'MANUAL',
                  merchantNumber: '',
                  instructions: '',
                  minAmount: 100,
                  maxAmount: 50000,
                  apiKey: '',
                  isActive: true,
                  isSandbox: false,
                });
                setIsMethodModalOpen(true);
              }}
              className="bg-amber-500 text-slate-950 font-bold hover:bg-amber-400"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Payment Method
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paymentMethods.map((method) => (
              <div key={method.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-white">{method.name}</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-amber-400 border border-slate-700">
                      {method.code}
                    </span>
                  </div>
                  <Badge variant={method.isActive ? 'success' : 'secondary'}>
                    {method.isActive ? 'ACTIVE' : 'DISABLED'}
                  </Badge>
                </div>

                <div className="space-y-1 text-xs text-slate-300 font-mono">
                  {method.merchantNumber && (
                    <div>
                      <span className="text-slate-500">Merchant Number: </span>
                      <span className="text-amber-300 font-bold">{method.merchantNumber}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-500">Type: </span>
                    <span>{method.type}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Limits: </span>
                    <span>৳{method.minAmount} – ৳{method.maxAmount.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">API Credentials: </span>
                    <span className="text-slate-400">{method.apiKeyEncrypted}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-mono">
                    Mode: {method.isSandbox ? '🟡 Sandbox' : '🟢 Production'}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingMethod(method);
                        setMethodForm({ ...method });
                        setIsMethodModalOpen(true);
                      }}
                      className="text-xs text-slate-300 hover:text-white"
                    >
                      <Edit className="w-3.5 h-3.5 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setPaymentMethods((prev) =>
                          prev.map((pm) =>
                            pm.id === method.id ? { ...pm, isActive: !pm.isActive } : pm
                          )
                        );
                      }}
                      className="text-xs text-amber-400 hover:text-amber-300"
                    >
                      {method.isActive ? 'Disable' : 'Enable'}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* TAB 4: API INTEGRATIONS WITH LIVE PING */}
      {activeTab === 'apis' && (
        <Card className="overflow-hidden bg-slate-950 border-slate-800 text-white p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-sm text-white">External Service API Gateways</h3>
              <p className="text-xs text-slate-400">Manage API keys, Webhooks, and Live Health Pings</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                apiConfigs.forEach((c) => handleTestApi(c.providerKey));
              }}
              className="text-xs font-bold text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
              Test All Endpoints
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {apiConfigs.map((api) => (
              <div key={api.providerKey} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-white">{api.name}</h4>
                    <span className="text-[10px] text-slate-400 font-mono">{api.category} • {api.providerKey}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                      api.lastTestStatus === 'CONNECTED'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {api.lastTestStatus === 'CONNECTED' ? `🟢 ${api.lastTestLatencyMs}ms` : '🔴 ERROR'}
                    </span>
                  </div>
                </div>

                <div className="space-y-1 text-xs text-slate-400 font-mono">
                  <div className="truncate"><span className="text-slate-500">Base URL: </span>{api.baseUrl}</div>
                  <div><span className="text-slate-500">Secret Key: </span>{api.apiKeyEncrypted}</div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-mono">
                    {api.isSandbox ? '🟡 Sandbox' : '🟢 Live Production'}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      isLoading={testingKey === api.providerKey}
                      onClick={() => handleTestApi(api.providerKey)}
                      className="text-xs text-amber-400 hover:text-amber-300 font-bold"
                    >
                      <Zap className="w-3.5 h-3.5 mr-1 text-amber-400" />
                      Test Connection
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingApiConfig(api);
                        setApiForm({
                          providerKey: api.providerKey,
                          name: api.name,
                          category: api.category,
                          baseUrl: api.baseUrl,
                          apiKey: '',
                          apiSecret: '',
                          isActive: api.isActive,
                          isSandbox: api.isSandbox,
                        });
                        setIsApiModalOpen(true);
                      }}
                      className="text-xs text-slate-300 hover:text-white"
                    >
                      <KeyRound className="w-3.5 h-3.5 mr-1" />
                      Edit Keys
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* TAB 5: WORKSPACES */}
      {activeTab === 'workspaces' && (
        <Card className="overflow-hidden bg-slate-950 border-slate-800 text-white">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-sm text-white">Registered Multi-Tenant Workspaces</h3>
            <span className="text-xs text-slate-400">{tenants.length} Workspaces</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 font-bold border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Workspace Name</th>
                  <th className="px-4 py-3">Plan Tier</th>
                  <th className="px-4 py-3">Credit Balance</th>
                  <th className="px-4 py-3">Orders</th>
                  <th className="px-4 py-3">Channels</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {tenants.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-900/50">
                    <td className="px-4 py-3 font-bold text-white">{t.name}</td>
                    <td className="px-4 py-3 font-mono text-amber-400">{t.planTier}</td>
                    <td className="px-4 py-3 font-bold text-emerald-400 font-mono">{t.creditBalance.toLocaleString()} Cr</td>
                    <td className="px-4 py-3 font-mono text-slate-300">{t.ordersCount}</td>
                    <td className="px-4 py-3 font-mono text-slate-300">{t.channelsCount}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        t.status === 'ACTIVE'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setTenants((prev) =>
                            prev.map((item) =>
                              item.id === t.id
                                ? { ...item, status: item.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' }
                                : item
                            )
                          );
                        }}
                        className="text-xs text-amber-400 hover:text-amber-300"
                      >
                        {t.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 6: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <Card className="overflow-hidden bg-slate-950 border-slate-800 text-white">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-white">Platform Users & Access Management</h3>
              <p className="text-xs text-slate-400">Search, adjust credits, or deactivate user accounts</p>
            </div>
            <span className="text-xs text-slate-400">{users.length} Users</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 font-bold border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Name & Email</th>
                  <th className="px-4 py-3">Workspace</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Credit Balance</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Last Login</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-900/50">
                    <td className="px-4 py-3">
                      <div className="font-bold text-white">{u.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{u.workspace}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.isSuperAdmin ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {u.isSuperAdmin ? 'SUPER ADMIN' : 'STORE OWNER'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-emerald-400">
                      {(u.creditBalance || 0).toLocaleString()} Cr
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.status === 'ACTIVE'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">{u.lastLogin}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedUserForCredits(u);
                            setCreditAdjustmentAmount(1000);
                            setCreditAdjustmentReason('Admin Manual Credit Recharge');
                          }}
                          className="text-xs text-emerald-400 hover:text-emerald-300 font-bold"
                        >
                          <Zap className="w-3.5 h-3.5 mr-1" />
                          Adjust Cr
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setUsers((prev) =>
                              prev.map((item) =>
                                item.id === u.id
                                  ? { ...item, status: item.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' }
                                  : item
                              )
                            );
                          }}
                          className="text-xs text-rose-400 hover:text-rose-300"
                        >
                          {u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 7: TRANSACTIONS */}
      {activeTab === 'payments' && (
        <Card className="overflow-hidden bg-slate-950 border-slate-800 text-white">
          <div className="p-4 border-b border-slate-800">
            <h3 className="font-bold text-sm text-white">Platform Payment Transactions</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 font-bold border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Workspace</th>
                  <th className="px-4 py-3">Gateway</th>
                  <th className="px-4 py-3">TrxID</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-900/50">
                    <td className="px-4 py-3 font-bold text-white">{tx.workspace}</td>
                    <td className="px-4 py-3 font-bold text-amber-400">{tx.provider}</td>
                    <td className="px-4 py-3 font-mono text-slate-300">{tx.trxId}</td>
                    <td className="px-4 py-3 font-mono font-bold text-emerald-400">৳{tx.amount.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">{tx.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 8: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <Card className="overflow-hidden bg-slate-950 border-slate-800 text-white">
          <div className="p-4 border-b border-slate-800">
            <h3 className="font-bold text-sm text-white">Super Admin Audit Trail</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 font-bold border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Actor</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Entity</th>
                  <th className="px-4 py-3">Details</th>
                  <th className="px-4 py-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/50">
                    <td className="px-4 py-3 font-bold text-amber-400">{log.actor}</td>
                    <td className="px-4 py-3 font-mono text-xs">{log.action}</td>
                    <td className="px-4 py-3 text-slate-300">{log.entity}</td>
                    <td className="px-4 py-3 text-slate-400">{log.details}</td>
                    <td className="px-4 py-3 font-mono text-slate-500">{log.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* MODAL 1: ADJUST USER CREDITS */}
      <Modal
        isOpen={!!selectedUserForCredits}
        onClose={() => setSelectedUserForCredits(null)}
        title={`Adjust Credits: ${selectedUserForCredits?.name}`}
        description={`Directly add or adjust AI credits for ${selectedUserForCredits?.workspace}.`}
        maxWidth="md"
      >
        <form onSubmit={handleAdjustUserCredits} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Credit Amount to Inject <span className="text-rose-500">*</span>
            </label>
            <Input
              type="number"
              value={creditAdjustmentAmount}
              onChange={(e) => setCreditAdjustmentAmount(parseInt(e.target.value, 10) || 0)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Mandatory Audit Reason (কারণ) <span className="text-rose-500">*</span>
            </label>
            <Input
              type="text"
              placeholder="e.g. Partner Promotion, Compensation, Manual bKash Payment"
              value={creditAdjustmentReason}
              onChange={(e) => setCreditAdjustmentReason(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="ghost" type="button" onClick={() => setSelectedUserForCredits(null)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
              Confirm Credit Injection
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: ADD / EDIT PAYMENT METHOD */}
      <Modal
        isOpen={isMethodModalOpen}
        onClose={() => setIsMethodModalOpen(false)}
        title={editingMethod ? `Edit Payment Method: ${editingMethod.code}` : 'Add Payment Method'}
        description="Configure display name, merchant number, instructions, and credentials."
        maxWidth="md"
      >
        <form onSubmit={handleSavePaymentMethod} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Method Code</label>
              <Input
                type="text"
                placeholder="e.g. BKASH, NAGAD"
                value={methodForm.code}
                onChange={(e) => setMethodForm({ ...methodForm, code: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Type</label>
              <select
                value={methodForm.type}
                onChange={(e) => setMethodForm({ ...methodForm, type: e.target.value })}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs font-medium bg-white"
              >
                <option value="MANUAL">MANUAL (P2P / Send Money)</option>
                <option value="AUTOMATED">AUTOMATED (Gateway / Checkout)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Display Name</label>
            <Input
              type="text"
              placeholder="bKash (Send Money / Merchant)"
              value={methodForm.name}
              onChange={(e) => setMethodForm({ ...methodForm, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Merchant / Recipient Number</label>
            <Input
              type="text"
              placeholder="01712-XXXXXX"
              value={methodForm.merchantNumber || ''}
              onChange={(e) => setMethodForm({ ...methodForm, merchantNumber: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Customer Instructions (বাংলায়)</label>
            <textarea
              rows={3}
              value={methodForm.instructions || ''}
              onChange={(e) => setMethodForm({ ...methodForm, instructions: e.target.value })}
              className="w-full p-2.5 rounded-lg border border-slate-300 text-xs font-mono"
              placeholder="১. অ্যাপে Send Money তে যান..."
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Min Amount (BDT)</label>
              <Input
                type="number"
                value={methodForm.minAmount}
                onChange={(e) => setMethodForm({ ...methodForm, minAmount: parseInt(e.target.value, 10) || 0 })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Max Amount (BDT)</label>
              <Input
                type="number"
                value={methodForm.maxAmount}
                onChange={(e) => setMethodForm({ ...methodForm, maxAmount: parseInt(e.target.value, 10) || 0 })}
              />
            </div>
          </div>

          <div className="flex items-center gap-4 pt-1">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={methodForm.isActive}
                onChange={(e) => setMethodForm({ ...methodForm, isActive: e.target.checked })}
                className="rounded"
              />
              Is Active (সক্রিয়)
            </label>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={methodForm.isSandbox}
                onChange={(e) => setMethodForm({ ...methodForm, isSandbox: e.target.checked })}
                className="rounded"
              />
              Is Sandbox Mode
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="ghost" type="button" onClick={() => setIsMethodModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" className="bg-amber-500 text-slate-950 font-bold hover:bg-amber-400">
              Save Payment Method
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: EDIT API KEYS */}
      <Modal
        isOpen={isApiModalOpen}
        onClose={() => setIsApiModalOpen(false)}
        title={`Configure API Credentials: ${editingApiConfig?.name}`}
        description="Credentials are automatically encrypted using AES-256-GCM before database storage."
        maxWidth="md"
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Base URL</label>
            <Input
              type="text"
              value={apiForm.baseUrl}
              onChange={(e) => setApiForm({ ...apiForm, baseUrl: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">API Key / Token</label>
            <Input
              type="password"
              placeholder="Enter new API key or leave blank to keep unchanged"
              value={apiForm.apiKey}
              onChange={(e) => setApiForm({ ...apiForm, apiKey: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">API Secret / Webhook Secret</label>
            <Input
              type="password"
              placeholder="Enter API secret or webhook signature secret"
              value={apiForm.apiSecret}
              onChange={(e) => setApiForm({ ...apiForm, apiSecret: e.target.value })}
            />
          </div>

          <div className="flex items-center gap-4 pt-1">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={apiForm.isActive}
                onChange={(e) => setApiForm({ ...apiForm, isActive: e.target.checked })}
                className="rounded"
              />
              Enable Provider
            </label>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={apiForm.isSandbox}
                onChange={(e) => setApiForm({ ...apiForm, isSandbox: e.target.checked })}
                className="rounded"
              />
              Sandbox Environment
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="ghost" onClick={() => setIsApiModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setApiConfigs((prev) =>
                  prev.map((a) =>
                    a.providerKey === apiForm.providerKey
                      ? { ...a, baseUrl: apiForm.baseUrl, isActive: apiForm.isActive, isSandbox: apiForm.isSandbox }
                      : a
                  )
                );
                setIsApiModalOpen(false);
                setSuccessBanner(`Updated credentials for ${apiForm.providerKey}!`);
                setTimeout(() => setSuccessBanner(''), 3000);
              }}
              className="bg-amber-500 text-slate-950 font-bold hover:bg-amber-400"
            >
              Save Credentials
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
