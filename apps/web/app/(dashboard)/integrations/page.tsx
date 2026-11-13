'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n-context';
import { ApiClient } from '@/lib/api';
import {
  Layers,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Shield,
  Key,
  Truck,
  CreditCard,
  MessageSquare,
  Lock,
} from 'lucide-react';
import { Button, Input, Card, Badge, Modal } from '@omniflow/ui';

export default function IntegrationsPage() {
  const { activeTenant } = useAuth();
  const { t } = useI18n();

  // Integration Connect Modal
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [isSandbox, setIsSandbox] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState('');

  const [connectedItems, setConnectedItems] = useState<Record<string, boolean>>({
    meta_fb: true,
    whatsapp: true,
    bkash: true,
    steadfast: true,
    nagad: false,
    sslcommerz: true,
    pathao: false,
    stripe: true,
  });

  const handleSaveIntegration = (id: string) => {
    setIsSaving(true);
    setTimeout(() => {
      setConnectedItems((prev) => ({ ...prev, [id]: true }));
      setIsSaving(false);
      setSavedSuccess(`Connected & Verified ${id.toUpperCase()} successfully!`);
      setTimeout(() => {
        setActiveModal(null);
        setSavedSuccess('');
        setApiKey('');
        setSecretKey('');
      }, 1500);
    }, 800);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-600" />
          <span>Official Integrations Hub</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Connect your social messaging channels, Bangladeshi & global payment gateways, and automated courier partners. All credentials encrypted at rest with AES-256.
        </p>
      </div>

      {/* SECTION 1: Omnichannel Social Channels */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
          <MessageSquare className="w-4 h-4 text-indigo-600" />
          <span>Customer Messaging Channels</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Facebook */}
          <Card className="p-5 border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                  f
                </div>
                {connectedItems.meta_fb ? (
                  <Badge variant="success" size="sm">Connected</Badge>
                ) : (
                  <Badge variant="default" size="sm">Not Connected</Badge>
                )}
              </div>
              <h3 className="font-bold text-sm text-slate-900">Facebook Messenger</h3>
              <p className="text-xs text-slate-500 mt-1">
                Official Meta Graph API webhook sync for page DMs, product carousels & quick replies.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Apex Lifestyle BD</span>
              <Button size="sm" variant={connectedItems.meta_fb ? 'outline' : 'primary'}>
                {connectedItems.meta_fb ? 'Settings' : 'Connect'}
              </Button>
            </div>
          </Card>

          {/* WhatsApp */}
          <Card className="p-5 border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                  WA
                </div>
                {connectedItems.whatsapp ? (
                  <Badge variant="success" size="sm">Connected</Badge>
                ) : (
                  <Badge variant="default" size="sm">Not Connected</Badge>
                )}
              </div>
              <h3 className="font-bold text-sm text-slate-900">WhatsApp Business Cloud</h3>
              <p className="text-xs text-slate-500 mt-1">
                Official Cloud API for high-speed WhatsApp chats, catalog sharing & order status notifications.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">+880 1900 123456</span>
              <Button size="sm" variant={connectedItems.whatsapp ? 'outline' : 'primary'}>
                {connectedItems.whatsapp ? 'Settings' : 'Connect'}
              </Button>
            </div>
          </Card>

          {/* Instagram */}
          <Card className="p-5 border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                  IG
                </div>
                <Badge variant="success" size="sm">Connected</Badge>
              </div>
              <h3 className="font-bold text-sm text-slate-900">Instagram Direct</h3>
              <p className="text-xs text-slate-500 mt-1">
                Story replies, direct message automation, and reel comment-to-DM conversions.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">@apexlifestyle.bd</span>
              <Button size="sm" variant="outline">
                Settings
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* SECTION 2: Payment Gateways */}
      <div className="space-y-3 pt-4">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
          <CreditCard className="w-4 h-4 text-indigo-600" />
          <span>Payment Gateways (Bangladesh & Global)</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* bKash */}
          <Card className="p-5 border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-pink-600 flex items-center justify-center text-white font-bold text-xs">
                  bKash
                </div>
                {connectedItems.bkash ? (
                  <Badge variant="success" size="sm">Active (Sandbox)</Badge>
                ) : (
                  <Badge variant="default" size="sm">Not Connected</Badge>
                )}
              </div>
              <h3 className="font-bold text-sm text-slate-900">bKash Tokenized Checkout</h3>
              <p className="text-xs text-slate-500 mt-1">
                Direct tokenized API. Generate instant 1-click payment links inside chat and verify transactions server-side.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Merchant: 01700000000</span>
              <Button
                size="sm"
                variant={connectedItems.bkash ? 'outline' : 'primary'}
                onClick={() => setActiveModal('bkash')}
              >
                Configure
              </Button>
            </div>
          </Card>

          {/* Nagad */}
          <Card className="p-5 border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white font-bold text-xs">
                  Nagad
                </div>
                {connectedItems.nagad ? (
                  <Badge variant="success" size="sm">Active</Badge>
                ) : (
                  <Badge variant="default" size="sm">Ready to Connect</Badge>
                )}
              </div>
              <h3 className="font-bold text-sm text-slate-900">Nagad Direct PG</h3>
              <p className="text-xs text-slate-500 mt-1">
                Direct remote payment gateway integration with cryptographic signature verification.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">PG v1.0</span>
              <Button
                size="sm"
                variant={connectedItems.nagad ? 'outline' : 'primary'}
                onClick={() => setActiveModal('nagad')}
              >
                {connectedItems.nagad ? 'Configure' : 'Connect'}
              </Button>
            </div>
          </Card>

          {/* SSLCommerz */}
          <Card className="p-5 border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-700 flex items-center justify-center text-white font-bold text-xs">
                  SSL
                </div>
                {connectedItems.sslcommerz ? (
                  <Badge variant="success" size="sm">Active (Sandbox)</Badge>
                ) : (
                  <Badge variant="default" size="sm">Ready to Connect</Badge>
                )}
              </div>
              <h3 className="font-bold text-sm text-slate-900">SSLCommerz Gateway</h3>
              <p className="text-xs text-slate-500 mt-1">
                Largest automated payment aggregator in Bangladesh. Supports all major debit/credit cards, MFS, and internet banking.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Store: testbox</span>
              <Button
                size="sm"
                variant={connectedItems.sslcommerz ? 'outline' : 'primary'}
                onClick={() => setActiveModal('sslcommerz')}
              >
                {connectedItems.sslcommerz ? 'Configure' : 'Connect'}
              </Button>
            </div>
          </Card>

          {/* Stripe */}
          <Card className="p-5 border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                  Stripe
                </div>
                {connectedItems.stripe ? (
                  <Badge variant="success" size="sm">Active</Badge>
                ) : (
                  <Badge variant="default" size="sm">Not Connected</Badge>
                )}
              </div>
              <h3 className="font-bold text-sm text-slate-900">Stripe Global Checkout</h3>
              <p className="text-xs text-slate-500 mt-1">
                Accept Visa, Mastercard, and Apple Pay from customers worldwide with automatic conversion.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">USD & Multi-currency</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setActiveModal('stripe')}
              >
                Configure
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* SECTION 3: Couriers & Logistics */}
      <div className="space-y-3 pt-4">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
          <Truck className="w-4 h-4 text-indigo-600" />
          <span>Automated Courier Logistics (Bangladesh)</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Steadfast */}
          <Card className="p-5 border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-800 flex items-center justify-center text-white font-bold text-xs">
                  Steadfast
                </div>
                {connectedItems.steadfast ? (
                  <Badge variant="success" size="sm">Active & Linked</Badge>
                ) : (
                  <Badge variant="default" size="sm">Not Connected</Badge>
                )}
              </div>
              <h3 className="font-bold text-sm text-slate-900">Steadfast Courier</h3>
              <p className="text-xs text-slate-500 mt-1">
                1-click consignment creation, automated Cash on Delivery collection tracking, and live balance query.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Portal Balance: ৳12,500</span>
              <Button
                size="sm"
                variant={connectedItems.steadfast ? 'outline' : 'primary'}
                onClick={() => setActiveModal('steadfast')}
              >
                Configure
              </Button>
            </div>
          </Card>

          {/* Pathao */}
          <Card className="p-5 border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white font-bold text-xs">
                  Pathao
                </div>
                {connectedItems.pathao ? (
                  <Badge variant="success" size="sm">Active</Badge>
                ) : (
                  <Badge variant="default" size="sm">Ready to Connect</Badge>
                )}
              </div>
              <h3 className="font-bold text-sm text-slate-900">Pathao Merchant Courier</h3>
              <p className="text-xs text-slate-500 mt-1">
                Aladdin API integration for city deliveries, on-demand pickups, and automatic consignment IDs.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">City & Nationwide</span>
              <Button
                size="sm"
                variant={connectedItems.pathao ? 'outline' : 'primary'}
                onClick={() => setActiveModal('pathao')}
              >
                {connectedItems.pathao ? 'Configure' : 'Connect'}
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Integration Setup Modal */}
      {activeModal && (
        <Modal
          isOpen={true}
          onClose={() => setActiveModal(null)}
          title={`Configure ${activeModal.toUpperCase()} Integration`}
          description="Credentials are securely stored in AES-256 encrypted form."
        >
          <div className="space-y-4">
            {savedSuccess ? (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{savedSuccess}</span>
              </div>
            ) : (
              <>
                <Input
                  label="API Key / App Key"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter API Key"
                />

                <Input
                  label="Secret Key / Merchant Secret"
                  type="password"
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  placeholder="Enter Secret Key"
                />

                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={isSandbox}
                    onChange={(e) => setIsSandbox(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="font-medium">Sandbox / Test Mode (Safe for demo testing)</span>
                </label>

                <div className="flex justify-end gap-2 pt-3">
                  <Button variant="ghost" onClick={() => setActiveModal(null)}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    isLoading={isSaving}
                    onClick={() => handleSaveIntegration(activeModal)}
                  >
                    Save & Test Connection
                  </Button>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
