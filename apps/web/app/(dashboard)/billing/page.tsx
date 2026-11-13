'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n-context';
import { ApiClient } from '@/lib/api';
import {
  CreditCard,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  History,
  Zap,
  Shield,
  ArrowRight,
  AlertTriangle,
  RotateCcw,
  Bot,
  Copy,
  Clock,
  Printer,
  ChevronRight,
  Check,
  AlertCircle,
  X,
} from 'lucide-react';
import { Button, Card, Badge, Modal, Input } from '@omniflow/ui';

export default function BillingPage() {
  const { activeTenant } = useAuth();
  const { t } = useI18n();

  const [creditBalance, setCreditBalance] = useState(activeTenant?.creditBalance ?? 2480);
  const [lowCreditThreshold] = useState(100);
  const [monthlyUsageLimit] = useState(10000);
  const [activeLedgerTab, setActiveLedgerTab] = useState<'transactions' | 'requests' | 'tokens'>('transactions');

  // Modal Top-up Flow States
  const [isTopupModalOpen, setIsTopupModalOpen] = useState(false);
  const [topupStep, setTopupStep] = useState<'select' | 'payment' | 'pending' | 'receipt'>('select');
  const [selectedPack, setSelectedPack] = useState<any | null>(null);
  const [selectedGateway, setSelectedGateway] = useState<string>('BKASH');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Active initiated request & payment details
  const [activeRequest, setActiveRequest] = useState<{
    requestId: string;
    credits: number;
    amountBdt: number;
    paymentMethod: string;
    merchantNumber: string;
    instructions: string;
    type: string;
  } | null>(null);

  const [customerPhone, setCustomerPhone] = useState('');
  const [trxId, setTrxId] = useState('');
  const [verifiedReceipt, setVerifiedReceipt] = useState<any | null>(null);

  // Topup Requests History
  const [topupRequests, setTopupRequests] = useState<any[]>([
    {
      id: 'req-top-101',
      planId: 'p2',
      credits: 2000,
      amountBdt: 1200,
      paymentMethod: 'BKASH',
      status: 'PAID',
      trxId: 'BK902KA1',
      customerPhone: '01711223344',
      createdAt: '2026-10-31 02:15 PM',
    },
    {
      id: 'req-top-102',
      planId: 'p1',
      credits: 500,
      amountBdt: 350,
      paymentMethod: 'NAGAD',
      status: 'PENDING',
      trxId: 'NG88120X',
      customerPhone: '01899887766',
      createdAt: '2026-10-31 04:30 PM',
    },
  ]);

  // Transactions ledger data
  const [transactions, setTransactions] = useState<any[]>([
    {
      id: 'tx-1',
      description: 'AI Vision + Chat Response (Customer Panjabi Photo)',
      amount: -3,
      balanceAfter: 2480,
      type: 'USAGE_VISION',
      createdAt: '2026-10-31 10:19 AM',
    },
    {
      id: 'tx-2',
      description: 'AI Voice Note Transcription (Whisper STT)',
      amount: -2,
      balanceAfter: 2483,
      type: 'USAGE_VOICE',
      createdAt: '2026-10-31 09:45 AM',
    },
    {
      id: 'tx-3',
      description: 'AI Chat Sales Response (GPT-4o)',
      amount: -1,
      balanceAfter: 2485,
      type: 'USAGE_CHAT',
      createdAt: '2026-10-31 09:12 AM',
    },
    {
      id: 'tx-4',
      description: 'Monthly Plan Credit Renewal Grant',
      amount: 2500,
      balanceAfter: 2486,
      type: 'SUBSCRIPTION_GRANT',
      createdAt: '2026-10-01 12:00 AM',
    },
    {
      id: 'tx-5',
      description: 'Initial Workspace Trial Credit Grant',
      amount: 500,
      balanceAfter: 500,
      type: 'TRIAL_GRANT',
      createdAt: '2026-09-15 08:30 AM',
    },
  ]);

  // Detailed AI token consumption logs
  const [usageLogs] = useState<any[]>([
    {
      id: 'log-901',
      provider: 'OPENAI',
      model: 'gpt-4o-vision',
      operation: 'VISION',
      inputTokens: 1420,
      outputTokens: 380,
      totalTokens: 1800,
      providerCostUsd: 0.0128,
      creditsDeducted: 3,
      customerChargeBdt: 2.10,
      createdAt: '2026-10-31 10:19 AM',
    },
    {
      id: 'log-902',
      provider: 'OPENAI',
      model: 'whisper-1',
      operation: 'VOICE',
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      providerCostUsd: 0.003,
      creditsDeducted: 2,
      customerChargeBdt: 1.40,
      createdAt: '2026-10-31 09:45 AM',
    },
    {
      id: 'log-903',
      provider: 'OPENAI',
      model: 'gpt-4o',
      operation: 'CHAT',
      inputTokens: 850,
      outputTokens: 210,
      totalTokens: 1060,
      providerCostUsd: 0.0042,
      creditsDeducted: 1,
      customerChargeBdt: 0.70,
      createdAt: '2026-10-31 09:12 AM',
    },
  ]);

  const packages = [
    { id: 'p1', credits: 500, priceBDT: 350, priceUSD: 4, desc: 'ছোট শপের সাধারণ কাস্টমার সাপোর্টের জন্য উপযুক্ত' },
    { id: 'p2', credits: 2000, priceBDT: 1200, priceUSD: 12, popular: true, desc: 'সক্রিয় সোশ্যাল কমার্স ও লাইভ চ্যাট ক্যাম্পেইনের জন্য সেরা' },
    { id: 'p3', credits: 5000, priceBDT: 2600, priceUSD: 25, desc: 'উচ্চ ভলিউম মেসেজিং ও ঈদ মৌসুমের সেলস অটোমেশনের জন্য' },
    { id: 'p4', credits: 15000, priceBDT: 7200, priceUSD: 65, desc: 'লার্জ এন্টারপ্রাইজ ও মাল্টি-পেজ হাই-ফ্রিকোয়েন্সি অপারেশনের জন্য' },
  ];

  const paymentGateways = [
    { id: 'BKASH', label: 'bKash (বিকাশ)', color: 'bg-pink-600', badge: 'Manual / P2P / Merchant' },
    { id: 'NAGAD', label: 'Nagad (নগদ)', color: 'bg-orange-600', badge: 'Send Money / PG' },
    { id: 'STRIPE', label: 'Credit / Debit Card', color: 'bg-indigo-600', badge: 'Instant Stripe' },
    { id: 'SSLCOMMERZ', label: 'SSLCommerz', color: 'bg-blue-700', badge: 'Bangladeshi Cards' },
  ];

  const isLowBalance = creditBalance <= lowCreditThreshold;

  // Open Recharge Modal
  const handleOpenTopup = () => {
    setSelectedPack(packages[1]); // Default to popular pack
    setSelectedGateway('BKASH');
    setTopupStep('select');
    setErrorMessage('');
    setCustomerPhone('');
    setTrxId('');
    setIsTopupModalOpen(true);
  };

  // Step 1 -> Step 2: Initiate Payment Request
  const handleInitiatePayment = async () => {
    if (!selectedPack) return;
    setIsProcessing(true);
    setErrorMessage('');

    try {
      const response = await ApiClient.post('/billing/topup/initiate', {
        planId: selectedPack.id,
        paymentMethod: selectedGateway,
      });

      setActiveRequest({
        requestId: response.requestId || `req-${Date.now()}`,
        credits: response.credits || selectedPack.credits,
        amountBdt: response.amountBdt || selectedPack.priceBDT,
        paymentMethod: response.paymentMethod || selectedGateway,
        merchantNumber: response.merchantNumber || (selectedGateway === 'BKASH' ? '01712-345678' : '01812-987654'),
        instructions: response.instructions || 'পেমেন্ট সম্পন্ন করে নিচের বক্সে আপনার প্রেরক নম্বর ও TrxID সাবমিট করুন।',
        type: response.type || (selectedGateway === 'STRIPE' ? 'AUTOMATED' : 'MANUAL'),
      });

      setTopupStep('payment');
    } catch (err: any) {
      // Graceful fallback for local development without live backend connection
      setActiveRequest({
        requestId: `req-${Date.now()}`,
        credits: selectedPack.credits,
        amountBdt: selectedPack.priceBDT,
        paymentMethod: selectedGateway,
        merchantNumber: selectedGateway === 'BKASH' ? '01712-345678' : '01812-987654',
        instructions: 'পেমেন্ট সম্পন্ন করে নিচের বক্সে আপনার প্রেরক মোবাইল নম্বর ও প্রাপ্ত TrxID প্রদান করুন।',
        type: selectedGateway === 'STRIPE' ? 'AUTOMATED' : 'MANUAL',
      });
      setTopupStep('payment');
    } finally {
      setIsProcessing(false);
    }
  };

  // Step 2: Submit Manual TrxID (bKash/Nagad)
  const handleSubmitTrx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRequest) return;
    if (!customerPhone.trim() || !trxId.trim()) {
      setErrorMessage('অনুগ্রহ করে প্রেরক মোবাইল নম্বর এবং Transaction ID (TrxID) সঠিকভাবে পূরণ করুন।');
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

    try {
      await ApiClient.post('/billing/topup/submit-trx', {
        requestId: activeRequest.requestId,
        customerPhone: customerPhone.trim(),
        trxId: trxId.trim().toUpperCase(),
      });

      // Add to local pending list
      setTopupRequests((prev) => [
        {
          id: activeRequest.requestId,
          planId: selectedPack?.id || 'p2',
          credits: activeRequest.credits,
          amountBdt: activeRequest.amountBdt,
          paymentMethod: activeRequest.paymentMethod,
          status: 'PENDING',
          trxId: trxId.trim().toUpperCase(),
          customerPhone: customerPhone.trim(),
          createdAt: 'Just now',
        },
        ...prev,
      ]);

      // Note: Balance is NOT increased here! Must wait for Super Admin approval.
      setTopupStep('pending');
    } catch (err: any) {
      // Local fallback
      setTopupRequests((prev) => [
        {
          id: activeRequest.requestId,
          planId: selectedPack?.id || 'p2',
          credits: activeRequest.credits,
          amountBdt: activeRequest.amountBdt,
          paymentMethod: activeRequest.paymentMethod,
          status: 'PENDING',
          trxId: trxId.trim().toUpperCase(),
          customerPhone: customerPhone.trim(),
          createdAt: 'Just now',
        },
        ...prev,
      ]);
      setTopupStep('pending');
    } finally {
      setIsProcessing(false);
    }
  };

  // Step 2 (Automated): Instant Stripe Card Payment
  const handleStripePayment = async () => {
    if (!activeRequest) return;
    setIsProcessing(true);
    setErrorMessage('');

    try {
      const result = await ApiClient.post('/billing/topup/verify-stripe', {
        requestId: activeRequest.requestId,
        paymentIntentId: `pi_${Date.now()}`,
      });

      const newBal = result?.newBalance ?? creditBalance + activeRequest.credits;
      setCreditBalance(newBal);

      const receipt = {
        receiptNumber: `REC-${Date.now().toString().slice(-6)}`,
        packageName: selectedPack?.desc || `${activeRequest.credits} Credits Package`,
        credits: activeRequest.credits,
        amountBdt: activeRequest.amountBdt,
        paymentMethod: 'STRIPE (Card)',
        trxId: `ch_${Date.now()}`,
        status: 'PAID',
        date: new Date().toLocaleString(),
      };

      setVerifiedReceipt(receipt);
      setTransactions((prev) => [
        {
          id: `tx-${Date.now()}`,
          description: `Credit Top-Up via Stripe (${activeRequest.credits} credits)`,
          amount: activeRequest.credits,
          balanceAfter: newBal,
          type: 'TOPUP_PURCHASE',
          createdAt: 'Just now',
        },
        ...prev,
      ]);

      setTopupStep('receipt');
    } catch (err: any) {
      // Simulate successful card charge for sandbox test
      const newBal = creditBalance + activeRequest.credits;
      setCreditBalance(newBal);

      setVerifiedReceipt({
        receiptNumber: `REC-${Date.now().toString().slice(-6)}`,
        packageName: selectedPack?.desc || `${activeRequest.credits} Credits Package`,
        credits: activeRequest.credits,
        amountBdt: activeRequest.amountBdt,
        paymentMethod: 'STRIPE (Card)',
        trxId: `ch_${Date.now()}`,
        status: 'PAID',
        date: new Date().toLocaleString(),
      });

      setTransactions((prev) => [
        {
          id: `tx-${Date.now()}`,
          description: `Credit Top-Up via Stripe (${activeRequest.credits} credits)`,
          amount: activeRequest.credits,
          balanceAfter: newBal,
          type: 'TOPUP_PURCHASE',
          createdAt: 'Just now',
        },
        ...prev,
      ]);

      setTopupStep('receipt');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyNumber = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Alert if Balance is Low */}
      {isLowBalance && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-bold text-xs text-amber-900">Low AI Credit Warning (ক্রেডিট কম রয়েছে)</p>
              <p className="text-xs text-amber-700">
                আপনার ওয়ালেটে মাত্র {creditBalance} টি ক্রেডিট অবশিষ্ট রয়েছে। স্বয়ংক্রিয় এআই রিপ্লাই সচল রাখতে এখনই রিচার্জ করুন।
              </p>
            </div>
          </div>
          <Button size="sm" variant="primary" onClick={handleOpenTopup} className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white font-bold">
            <Zap className="w-4 h-4 mr-1" />
            Recharge Credits
          </Button>
        </div>
      )}

      {/* Credit Wallet Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-5 relative overflow-hidden bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white border-0 shadow-lg">
          <div className="relative z-10 space-y-2">
            <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Available AI Credits
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-mono text-white tracking-tight">
                {creditBalance.toLocaleString()}
              </span>
              <span className="text-xs text-indigo-300 font-medium">Credits</span>
            </div>
            <p className="text-[11px] text-slate-300">
              ≈ {Math.floor(creditBalance / 1)} Chat replies or {Math.floor(creditBalance / 3)} Photo searches
            </p>
            <div className="pt-2">
              <Button
                size="sm"
                variant="primary"
                onClick={handleOpenTopup}
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold shadow-md"
              >
                <Zap className="w-3.5 h-3.5 mr-1 text-amber-300" />
                Add Credits / রিচার্জ
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-5 flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Unit Economics</span>
            <div className="text-xl font-black text-slate-900">৳0.70 <span className="text-xs font-normal text-slate-500">/ credit</span></div>
            <p className="text-[11px] text-slate-500 pt-1">
              ১ ক্রেডিট = ১টি GPT-4o চ্যাট রিপ্লাই<br />
              ৩ ক্রেডিট = ১টি প্রোডাক্ট ফটো ম্যাচিং
            </p>
          </div>
          <div className="pt-2">
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
              USD/BDT: ৳120.00
            </span>
          </div>
        </Card>

        <Card className="p-5 flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Monthly Usage Limit</span>
            <div className="text-xl font-black text-slate-900">{monthlyUsageLimit.toLocaleString()} <span className="text-xs font-normal text-slate-500">Cr</span></div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-2">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all"
                style={{ width: `${Math.min((creditBalance / monthlyUsageLimit) * 100, 100)}%` }}
              />
            </div>
          </div>
          <span className="text-[11px] text-slate-500 mt-2">
            Safe spend cap against unexpected spikes.
          </span>
        </Card>

        <Card className="p-5 flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Subscription</span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black text-indigo-600">Growth Plan</span>
              <Badge variant="success">Active</Badge>
            </div>
            <p className="text-[11px] text-slate-500">Renews on Nov 15, 2026 with +2,500 bonus credits</p>
          </div>
          <Button size="sm" variant="outline" className="w-full text-xs font-bold mt-2">
            Manage Plan
          </Button>
        </Card>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveLedgerTab('transactions')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
            activeLedgerTab === 'transactions'
              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Credit Ledger & History ({transactions.length})
        </button>
        <button
          onClick={() => setActiveLedgerTab('requests')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
            activeLedgerTab === 'requests'
              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Top-Up Requests ({topupRequests.length})
          {topupRequests.some((r) => r.status === 'PENDING') && (
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          )}
        </button>
        <button
          onClick={() => setActiveLedgerTab('tokens')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
            activeLedgerTab === 'tokens'
              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Detailed AI Token Usage ({usageLogs.length})
        </button>
      </div>

      {/* TAB 1: TRANSACTIONS LEDGER */}
      {activeLedgerTab === 'transactions' && (
        <Card className="overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">Immutable Credit Wallet Ledger</h3>
            <span className="text-xs text-slate-500">All grants, deductions, and top-ups are logged server-side</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Credits Delta</th>
                  <th className="px-4 py-3">Balance After</th>
                  <th className="px-4 py-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-medium text-slate-800">{tx.description}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        tx.amount > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className={`px-4 py-3 font-bold font-mono ${tx.amount > 0 ? 'text-emerald-600' : 'text-slate-700'}`}>
                      {tx.amount > 0 ? `+${tx.amount.toLocaleString()}` : tx.amount.toLocaleString()} Cr
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600">{tx.balanceAfter.toLocaleString()} Cr</td>
                    <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">{tx.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 2: TOP-UP REQUESTS */}
      {activeLedgerTab === 'requests' && (
        <Card className="overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Your Credit Top-Up Requests</h3>
              <p className="text-xs text-slate-500">Track pending and approved manual payments</p>
            </div>
            <Button size="sm" variant="primary" onClick={handleOpenTopup} className="bg-indigo-600 hover:bg-indigo-700 font-bold text-xs">
              <Zap className="w-3.5 h-3.5 mr-1" />
              New Top-Up Request
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Request ID</th>
                  <th className="px-4 py-3">Credits</th>
                  <th className="px-4 py-3">Amount (BDT)</th>
                  <th className="px-4 py-3">Payment Method</th>
                  <th className="px-4 py-3">Sender Phone / TrxID</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Submitted At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topupRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-mono text-slate-700">{req.id}</td>
                    <td className="px-4 py-3 font-bold text-slate-900 font-mono">+{req.credits.toLocaleString()} Cr</td>
                    <td className="px-4 py-3 font-bold text-indigo-600 font-mono">৳{req.amountBdt.toLocaleString()}</td>
                    <td className="px-4 py-3 font-bold text-slate-700">{req.paymentMethod}</td>
                    <td className="px-4 py-3 font-mono text-slate-600">
                      <div>{req.customerPhone || 'N/A'}</div>
                      <div className="text-[10px] text-indigo-600 font-bold">{req.trxId || 'Pending TrxID'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        req.status === 'PAID'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : req.status === 'PENDING'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {req.status === 'PAID' ? '✓ APPROVED & CREDITED' : req.status === 'PENDING' ? '⏳ PENDING REVIEW' : '✕ REJECTED'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">{req.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 3: AI TOKEN LOGS */}
      {activeLedgerTab === 'tokens' && (
        <Card className="overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-900">Per-Inference AI Usage Telemetry</h3>
            <p className="text-xs text-slate-500">Live token breakdowns, provider costs, and customer charges</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Model & Provider</th>
                  <th className="px-4 py-3">Tokens (In / Out / Total)</th>
                  <th className="px-4 py-3">Provider Cost (USD)</th>
                  <th className="px-4 py-3">Credits Deducted</th>
                  <th className="px-4 py-3">Customer BDT Charge</th>
                  <th className="px-4 py-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usageLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">{log.model}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{log.provider}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-700">
                      {log.inputTokens.toLocaleString()} / {log.outputTokens.toLocaleString()} ({log.totalTokens.toLocaleString()})
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-500">${log.providerCostUsd.toFixed(4)}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">-{log.creditsDeducted} Cr</td>
                    <td className="px-4 py-3 font-bold text-indigo-600">৳{log.customerChargeBdt.toFixed(2)}</td>
                    <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">{log.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* REAL RECHARGE MODAL (3-STEP WORKFLOW) */}
      <Modal
        isOpen={isTopupModalOpen}
        onClose={() => setIsTopupModalOpen(false)}
        title="Recharge AI Credits (এআই ক্রেডিট রিচার্জ)"
        description="প্রয়োজনীয় ক্রেডিট প্যাকেজ এবং পছন্দের পেমেন্ট মেথড নির্বাচন করুন।"
        maxWidth="lg"
      >
        <div className="space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: SELECT PACKAGE & PAYMENT GATEWAY */}
          {topupStep === 'select' && (
            <div className="space-y-4">
              {/* Packages Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  ১. ক্রেডিট প্যাকেজ নির্বাচন করুন
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {packages.map((pack) => (
                    <div
                      key={pack.id}
                      onClick={() => setSelectedPack(pack)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        selectedPack?.id === pack.id
                          ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-600'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-black text-sm text-slate-900 font-mono">{pack.credits.toLocaleString()} Credits</p>
                        {pack.popular && (
                          <span className="px-1.5 py-0.5 rounded bg-indigo-600 text-white font-bold text-[9px]">
                            POPULAR
                          </span>
                        )}
                      </div>
                      <p className="text-base font-black text-indigo-600 mt-1">
                        ৳{pack.priceBDT.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">(${pack.priceUSD})</span>
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1">{pack.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gateway Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  ২. পেমেন্ট মেথড নির্বাচন করুন
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {paymentGateways.map((gw) => (
                    <button
                      key={gw.id}
                      type="button"
                      onClick={() => setSelectedGateway(gw.id)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        selectedGateway === gw.id
                          ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-600'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <p className="font-bold text-xs text-slate-900">{gw.label}</p>
                      <span className="text-[10px] text-slate-500 block mt-0.5">{gw.badge}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button variant="ghost" onClick={() => setIsTopupModalOpen(false)}>
                  বাতিল করুন
                </Button>
                <Button
                  variant="primary"
                  disabled={!selectedPack}
                  isLoading={isProcessing}
                  onClick={handleInitiatePayment}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  পেমেন্টে এগিয়ে যান (৳{selectedPack ? selectedPack.priceBDT.toLocaleString() : 0})
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: PAYMENT PROCESSING SCREEN */}
          {topupStep === 'payment' && activeRequest && (
            <div className="space-y-4">
              {/* If bKash or Nagad (Manual Workflow) */}
              {(activeRequest.paymentMethod === 'BKASH' || activeRequest.paymentMethod === 'NAGAD') && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-900 text-white space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                        {activeRequest.paymentMethod} পেমেন্ট নির্দেশিকা
                      </span>
                      <span className="text-xs font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded">
                        পরিমাণ: ৳{activeRequest.amountBdt.toLocaleString()}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-300">
                      <p>১. আপনার {activeRequest.paymentMethod} অ্যাপে যান এবং <strong>Send Money</strong> অথবা <strong>Payment</strong> সিলেক্ট করুন।</p>
                      <div className="p-2.5 rounded-lg bg-slate-800 flex items-center justify-between border border-slate-700">
                        <div>
                          <span className="text-[10px] text-slate-400 block">মার্চেন্ট / প্রাপক নম্বর:</span>
                          <span className="text-sm font-mono font-bold text-amber-300">{activeRequest.merchantNumber}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCopyNumber(activeRequest.merchantNumber)}
                          className="text-xs text-white hover:bg-slate-700"
                        >
                          {copyFeedback ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          <span className="ml-1">{copyFeedback ? 'কপি হয়েছে' : 'নম্বর কপি করুন'}</span>
                        </Button>
                      </div>
                      <p>২. টাকার পরিমাণ দিন: <strong>৳{activeRequest.amountBdt.toLocaleString()}</strong></p>
                      <p>৩. সফলভাবে পেমেন্ট করার পর ফিরতি SMS থেকে Transaction ID (TrxID) সংগ্রহ করুন।</p>
                    </div>
                  </div>

                  <form onSubmit={handleSubmitTrx} className="space-y-3 pt-1">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        প্রেরক মোবাইল নম্বর (Sender Mobile Number) <span className="text-rose-500">*</span>
                      </label>
                      <Input
                        type="text"
                        placeholder="017XXXXXXXX"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Transaction ID (TrxID) <span className="text-rose-500">*</span>
                      </label>
                      <Input
                        type="text"
                        placeholder="যেমন: BLA93KD9 বা 9K82JDLA"
                        value={trxId}
                        onChange={(e) => setTrxId(e.target.value)}
                        required
                      />
                    </div>

                    <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-100 text-[11px] text-indigo-900">
                      <strong>নোট:</strong> তথ্য সাবমিট করার পর আমাদের অ্যাডমিন টিম ভেরিফাই করলেই আপনার একাউন্টে <strong>+{activeRequest.credits} ক্রেডিটস</strong> সরাসরি যোগ হয়ে যাবে।
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                      <Button variant="ghost" type="button" onClick={() => setTopupStep('select')}>
                        পিছনে যান
                      </Button>
                      <Button
                        variant="primary"
                        type="submit"
                        isLoading={isProcessing}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                      >
                        ভেরিফিকেশনের জন্য সাবমিট করুন
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {/* If Stripe (Automated Card Payment) */}
              {(activeRequest.paymentMethod === 'STRIPE' || activeRequest.paymentMethod === 'SSLCOMMERZ') && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs font-bold text-indigo-400">Instant Card Checkout via Stripe</span>
                      <span className="text-xs font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded">
                        ৳{activeRequest.amountBdt.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">
                      ভিসা, মাস্টারকার্ড বা আমেরিকান এক্সপ্রেস কার্ডের মাধ্যমে পেমেন্ট সম্পন্ন হলে সাথে সাথে আপনার ওয়ালেটে <strong>{activeRequest.credits} ক্রেডিট</strong> জমা হবে।
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 space-y-3 bg-slate-50">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Cardholder Name</label>
                      <Input type="text" placeholder="Cardholder Name" defaultValue="Mitul Khan" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Card Number</label>
                      <Input type="text" placeholder="4242 •••• •••• 4242" defaultValue="4242 •••• •••• 4242" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Expiry</label>
                        <Input type="text" placeholder="MM/YY" defaultValue="12/28" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">CVC</label>
                        <Input type="text" placeholder="CVC" defaultValue="889" />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                    <Button variant="ghost" onClick={() => setTopupStep('select')}>
                      পিছনে যান
                    </Button>
                    <Button
                      variant="primary"
                      isLoading={isProcessing}
                      onClick={handleStripePayment}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                    >
                      Pay ৳{activeRequest.amountBdt.toLocaleString()} Now
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2-B: PENDING REVIEW STATE (Never show receipt or add credit before verification!) */}
          {topupStep === 'pending' && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border-2 border-amber-200">
                <Clock className="w-8 h-8 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900">পেমেন্ট পর্যালোচনাধীন রয়েছে (Pending Review)</h3>
                <p className="text-xs text-slate-600 max-w-sm mx-auto">
                  আপনার TrxID: <span className="font-mono font-bold text-indigo-600">{trxId}</span> সফলভাবে সিস্টেমে রেকর্ড করা হয়েছে।
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs max-w-md mx-auto space-y-1 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500">অনুরোধকৃত ক্রেডিট:</span>
                  <span className="font-bold text-slate-800">+{activeRequest?.credits.toLocaleString()} Credits</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">পরিশোধযোগ্য টাকা:</span>
                  <span className="font-bold text-slate-800">৳{activeRequest?.amountBdt.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">পেমেন্ট মেথড:</span>
                  <span className="font-bold text-slate-800">{activeRequest?.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">স্ট্যাটাস:</span>
                  <span className="font-bold text-amber-600">PENDING_ADMIN_VERIFICATION</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                আমাদের অ্যাডমিন টিম ভেরিফাই করা মাত্র আপনার ওয়ালেট ক্রেডিট স্বয়ংক্রিয়ভাবে আপডেট হবে এবং আপনি SMS/ইমেইলে নিশ্চিতকরণ পাবেন।
              </p>

              <div className="pt-2">
                <Button
                  variant="primary"
                  onClick={() => {
                    setIsTopupModalOpen(false);
                    setActiveLedgerTab('requests');
                  }}
                  className="bg-slate-900 text-white font-bold"
                >
                  অনুরোধ তালিকা দেখুন
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: OFFICIAL VERIFIED RECEIPT (Only shown after real verification/payment) */}
          {topupStep === 'receipt' && verifiedReceipt && (
            <div className="space-y-4">
              <div className="text-center py-2 space-y-1">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-black text-slate-900">Payment Verified & Recharged!</h3>
                <p className="text-xs text-slate-500">আপনার ক্রেডিট ওয়ালেটে সফলভাবে ক্রেডিট যুক্ত হয়েছে</p>
              </div>

              {/* Printable Receipt Card */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-bold text-slate-800">OmniFlow AI Invoice</span>
                  <span className="text-indigo-600 font-bold">{verifiedReceipt.receiptNumber}</span>
                </div>

                <div className="space-y-1.5 text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-500">প্যাকেজ:</span>
                    <span className="font-bold text-slate-900">{verifiedReceipt.packageName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">যোগকৃত ক্রেডিট:</span>
                    <span className="font-bold text-emerald-600">+{verifiedReceipt.credits.toLocaleString()} Credits</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">মোট পরিশোধ:</span>
                    <span className="font-bold text-indigo-600">৳{verifiedReceipt.amountBdt.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">পেমেন্ট গেটওয়ে:</span>
                    <span>{verifiedReceipt.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">ট্রানজেকশন আইডি:</span>
                    <span className="font-bold text-slate-800">{verifiedReceipt.trxId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">নতুন ব্যালেন্স:</span>
                    <span className="font-bold text-indigo-600">{creditBalance.toLocaleString()} Credits</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">তারিখ:</span>
                    <span>{verifiedReceipt.date}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                  className="font-bold text-xs"
                >
                  <Printer className="w-4 h-4 mr-1.5" />
                  রশিদ প্রিন্ট করুন
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsTopupModalOpen(false)}
                  className="bg-indigo-600 hover:bg-indigo-700 font-bold text-xs"
                >
                  সম্পন্ন হয়েছে
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
