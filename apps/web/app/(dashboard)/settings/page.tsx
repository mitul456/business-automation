'use client';

import React, { useState } from 'react';
import {
  Building2,
  Lock,
  Globe,
  Save,
  CheckCircle2,
  Key,
  Shield,
  CreditCard,
  Truck,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Button, Input, Card, Badge } from '@omniflow/ui';

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [showTokens, setShowTokens] = useState(false);

  // Settings State
  const [workspaceName, setWorkspaceName] = useState('Apex Lifestyle & Tech');
  const [currency, setCurrency] = useState('BDT');
  const [timezone, setTimezone] = useState('Asia/Dhaka');
  const [metaAppId, setMetaAppId] = useState('849201948291048');
  const [metaAppSecret, setMetaAppSecret] = useState('d3b07384d113edec49eaa6238ad5ff00');
  const [bkashAppKey, setBkashAppKey] = useState('key_sandbox_bkash_889102');
  const [bkashAppSecret, setBkashAppSecret] = useState('sec_sandbox_bkash_392817');
  const [steadfastApiKey, setSteadfastApiKey] = useState('stdf_api_sandbox_948172');
  const [steadfastSecret, setSteadfastSecret] = useState('stdf_sec_9918274');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Workspace & Platform Settings
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage business profile, multi-tenant isolation configuration, and third-party API credentials.
          </p>
        </div>
        {saved && (
          <Badge variant="success" size="md" className="self-start sm:self-center">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Settings Saved Successfully
          </Badge>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Workspace Identity */}
        <Card className="p-6 border-slate-200 space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 font-bold text-sm text-slate-900">
            <Building2 className="w-4 h-4 text-indigo-600" />
            <span>Workspace Profile & Regional Localization</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Workspace Business Name *"
              required
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
            />
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">Primary Currency *</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-600"
              >
                <option value="BDT">BDT (৳) - Bangladeshi Taka</option>
                <option value="USD">USD ($) - United States Dollar</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">Business Timezone *</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-600"
              >
                <option value="Asia/Dhaka">Asia/Dhaka (GMT+6)</option>
                <option value="UTC">UTC (Universal Coordinated Time)</option>
                <option value="America/New_York">America/New_York (EST)</option>
              </select>
            </div>
            <Input
              label="Tenant Workspace Slug"
              readOnly
              value="apex-lifestyle-tech"
              hint="Unique multi-tenant identifier used in database row scoping."
            />
          </div>
        </Card>

        {/* API Credentials */}
        <Card className="p-6 border-slate-200 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2.5 font-bold text-sm text-slate-900">
              <Key className="w-4 h-4 text-indigo-600" />
              <span>Third-Party Encrypted Credentials (AES-256-GCM)</span>
            </div>
            <button
              type="button"
              onClick={() => setShowTokens(!showTokens)}
              className="text-xs font-semibold text-slate-500 hover:text-indigo-600 flex items-center gap-1 cursor-pointer"
            >
              {showTokens ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {showTokens ? 'Hide Keys' : 'Reveal Keys'}
            </button>
          </div>

          {/* Meta & WhatsApp */}
          <div className="space-y-3 pt-1">
            <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Meta Graph & WhatsApp Cloud API
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Meta App ID"
                type={showTokens ? 'text' : 'password'}
                value={metaAppId}
                onChange={(e) => setMetaAppId(e.target.value)}
              />
              <Input
                label="Meta App Secret"
                type={showTokens ? 'text' : 'password'}
                value={metaAppSecret}
                onChange={(e) => setMetaAppSecret(e.target.value)}
              />
            </div>
          </div>

          {/* bKash Payment */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              bKash Tokenized Checkout API
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="bKash App Key"
                type={showTokens ? 'text' : 'password'}
                value={bkashAppKey}
                onChange={(e) => setBkashAppKey(e.target.value)}
              />
              <Input
                label="bKash App Secret"
                type={showTokens ? 'text' : 'password'}
                value={bkashAppSecret}
                onChange={(e) => setBkashAppSecret(e.target.value)}
              />
            </div>
          </div>

          {/* Steadfast Courier */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Steadfast Courier API
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Steadfast Api-Key"
                type={showTokens ? 'text' : 'password'}
                value={steadfastApiKey}
                onChange={(e) => setSteadfastApiKey(e.target.value)}
              />
              <Input
                label="Steadfast Secret-Key"
                type={showTokens ? 'text' : 'password'}
                value={steadfastSecret}
                onChange={(e) => setSteadfastSecret(e.target.value)}
              />
            </div>
          </div>
        </Card>

        {/* Security & Audit Policy */}
        <Card className="p-6 border-slate-200 bg-slate-50/50 space-y-3">
          <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>Multi-Tenant Logical Isolation Guarantee</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            All database queries on your conversations, customer profiles, product catalog, and invoices are partitioned with your composite <code className="bg-white px-1.5 py-0.5 rounded text-indigo-700 font-mono text-[11px]">tenantId</code>. Third-party tokens are automatically encrypted prior to database writes.
          </p>
        </Card>

        {/* Submit Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="submit"
            variant="primary"
            size="md"
            className="font-bold shadow-md shadow-indigo-200"
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save All Settings
          </Button>
        </div>
      </form>
    </div>
  );
}
