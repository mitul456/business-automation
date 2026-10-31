'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n-context';
import { ApiClient } from '@/lib/api';
import {
  CreditCard,
  Coins,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  History,
  Zap,
  Shield,
  ArrowRight,
} from 'lucide-react';
import { Button, Card, Badge, Modal } from '@omniflow/ui';

export default function BillingPage() {
  const { activeTenant } = useAuth();
  const { t } = useI18n();

  const [creditBalance, setCreditBalance] = useState(activeTenant?.creditBalance ?? 2480);
  const [isTopupModalOpen, setIsTopupModalOpen] = useState(false);
  const [selectedPack, setSelectedPack] = useState<any | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState('');

  const [transactions, setTransactions] = useState<any[]>([
    {
      id: 'tx-1',
      description: 'AI Vision + Chat Response (Customer Panjabi Photo)',
      amount: -3,
      balanceAfter: 2480,
      createdAt: '2026-10-31 10:19 AM',
    },
    {
      id: 'tx-2',
      description: 'AI Voice Note Transcription (Whisper STT)',
      amount: -2,
      balanceAfter: 2483,
      createdAt: '2026-10-31 09:45 AM',
    },
    {
      id: 'tx-3',
      description: 'AI Chat Sales Response',
      amount: -1,
      balanceAfter: 2485,
      createdAt: '2026-10-31 09:12 AM',
    },
    {
      id: 'tx-4',
      description: 'Monthly Plan Credit Renewal Grant',
      amount: 2500,
      balanceAfter: 2486,
      createdAt: '2026-10-01 12:00 AM',
    },
  ]);

  const packages = [
    { id: 'p1', credits: 500, priceBDT: 350, priceUSD: 4, desc: 'Great for occasional queries' },
    { id: 'p2', credits: 2000, priceBDT: 1200, priceUSD: 12, popular: true, desc: 'Ideal for active social stores' },
    { id: 'p3', credits: 5000, priceBDT: 2600, priceUSD: 25, desc: 'High volume campaigns & Eid seasons' },
  ];

  const handleExecutePurchase = () => {
    if (!selectedPack) return;
    setIsPurchasing(true);

    setTimeout(() => {
      const newBal = creditBalance + selectedPack.credits;
      setCreditBalance(newBal);

      setTransactions((prev) => [
        {
          id: `tx-${Date.now()}`,
          description: `Credit Top-Up (${selectedPack.credits} credits)`,
          amount: selectedPack.credits,
          balanceAfter: newBal,
          createdAt: 'Just now',
        },
        ...prev,
      ]);

      setIsPurchasing(false);
      setPurchaseSuccess(`Successfully recharged ${selectedPack.credits} AI credits!`);

      setTimeout(() => {
        setIsTopupModalOpen(false);
        setPurchaseSuccess('');
        setSelectedPack(null);
      }, 2000);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-indigo-600" />
          <span>Billing, Subscriptions & AI Credits</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Transparent pay-as-you-grow model. Recharges are metered per chat, vision analysis, and voice note transcription.
        </p>
      </div>

      {/* Credit Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 border-indigo-200 bg-gradient-to-br from-indigo-50/50 via-white to-white flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">AI Credit Balance</span>
              <Coins className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {creditBalance.toLocaleString()}{' '}
              <span className="text-sm font-semibold text-indigo-600">Credits</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Estimated ~{creditBalance} text chats or ~{Math.floor(creditBalance / 3)} vision matches remaining.
            </p>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100">
            <Button
              className="w-full shadow-sm"
              variant="primary"
              onClick={() => setIsTopupModalOpen(true)}
            >
              Top Up Credits
            </Button>
          </div>
        </Card>

        <Card className="p-6 border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Plan</span>
              <Badge variant="purple">PRO Tier</Badge>
            </div>
            <div className="text-2xl font-bold text-slate-900">৳৪,৯৫০ / month</div>
            <p className="text-xs text-slate-500 mt-1">Renews automatically on Nov 30, 2026</p>
            <ul className="text-xs text-slate-600 space-y-1.5 mt-3">
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Unlimited Channels</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> GPT-4o Vision & Whisper</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> 5 Team Members</li>
            </ul>
          </div>
          <div className="pt-4 mt-4 border-t border-slate-100">
            <Button variant="outline" className="w-full">Manage Subscription</Button>
          </div>
        </Card>

        <Card className="p-6 border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Credit Rates</span>
              <Zap className="w-5 h-5 text-amber-500" />
            </div>
            <div className="space-y-2 text-xs text-slate-600 pt-2">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Text Chat Response:</span>
                <span className="font-bold text-slate-800">1 Credit</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Vision Photo Match (GPT-4o):</span>
                <span className="font-bold text-slate-800">3 Credits</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Voice Message STT (Whisper):</span>
                <span className="font-bold text-slate-800">2 Credits</span>
              </div>
              <div className="flex justify-between py-1">
                <span>RAG Knowledge Retrieval:</span>
                <span className="font-bold text-emerald-600">Free Included</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Credit Usage Ledger Table */}
      <Card className="border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <History className="w-4 h-4 text-slate-500" />
            <span>AI Credit Usage History</span>
          </h3>
          <Badge variant="default" size="sm">Audit Verified</Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase">
              <tr>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Transaction</th>
                <th className="px-4 py-3">Balance After</th>
                <th className="px-4 py-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-medium text-slate-800">{tx.description}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`font-bold ${
                        tx.amount > 0 ? 'text-emerald-600' : 'text-slate-700'
                      }`}
                    >
                      {tx.amount > 0 ? `+${tx.amount}` : tx.amount} Credits
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{tx.balanceAfter}</td>
                  <td className="px-4 py-3 text-slate-400">{tx.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Top-up Modal */}
      <Modal
        isOpen={isTopupModalOpen}
        onClose={() => setIsTopupModalOpen(false)}
        title="Recharge AI Credits"
        description="Choose a package to recharge instantly via bKash or Credit Card."
        maxWidth="lg"
      >
        <div className="space-y-4">
          {purchaseSuccess ? (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{purchaseSuccess}</span>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {packages.map((pack) => (
                  <div
                    key={pack.id}
                    onClick={() => setSelectedPack(pack)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedPack?.id === pack.id
                        ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-600'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <p className="font-bold text-sm text-slate-900">{pack.credits} Credits</p>
                    <p className="text-base font-extrabold text-indigo-600 mt-1">
                      ৳{pack.priceBDT} <span className="text-[10px] text-slate-400 font-normal">(${pack.priceUSD})</span>
                    </p>
                    <p className="text-[10px] text-slate-500 mt-2">{pack.desc}</p>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <Button variant="ghost" onClick={() => setIsTopupModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  disabled={!selectedPack}
                  isLoading={isPurchasing}
                  onClick={handleExecutePurchase}
                >
                  Pay with bKash / Card
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
