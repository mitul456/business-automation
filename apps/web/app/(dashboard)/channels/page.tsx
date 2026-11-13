'use client';

import React, { useState } from 'react';
import {
  MessageSquare,
  Bot,
  Plus,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Trash2,
  Sliders,
  Shield,
  Layers,
} from 'lucide-react';
import { Button, Badge, Card, Modal, Input } from '@omniflow/ui';

export default function ChannelsPage() {
  const [channels, setChannels] = useState([
    {
      id: 'ch-1',
      name: 'Apex Heritage Wear - Official Page',
      platform: 'FACEBOOK',
      status: 'CONNECTED',
      accountName: 'Apex Clothing Ltd.',
      externalId: '1092847192847',
      connectedAt: '12 Oct 2026',
      totalChats: 2480,
      activeAI: true,
    },
    {
      id: 'ch-2',
      name: 'Apex Instagram Official',
      platform: 'INSTAGRAM',
      status: 'CONNECTED',
      accountName: '@apex.heritage',
      externalId: '17841400284719',
      connectedAt: '15 Oct 2026',
      totalChats: 1120,
      activeAI: true,
    },
    {
      id: 'ch-3',
      name: 'Apex VIP WhatsApp Support',
      platform: 'WHATSAPP',
      status: 'CONNECTED',
      accountName: '+880 1711-998877',
      externalId: 'waba-phone-849182',
      connectedAt: '18 Oct 2026',
      totalChats: 890,
      activeAI: true,
    },
    {
      id: 'ch-4',
      name: 'Website Live Chat Widget',
      platform: 'WEB_WIDGET',
      status: 'NOT_CONNECTED',
      accountName: 'store.apexlifestyle.com',
      externalId: 'widget-004',
      connectedAt: 'Pending',
      totalChats: 0,
      activeAI: false,
    },
  ]);

  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<'FACEBOOK' | 'INSTAGRAM' | 'WHATSAPP'>('FACEBOOK');
  const [formName, setFormName] = useState('');
  const [formExternalId, setFormExternalId] = useState('');
  const [formToken, setFormToken] = useState('');

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    const newChan = {
      id: `ch-${Date.now()}`,
      name: formName || `${selectedPlatform} Channel`,
      platform: selectedPlatform,
      status: 'CONNECTED',
      accountName: formExternalId || 'New Account',
      externalId: formExternalId || 'ext-' + Math.random().toString(36).substring(7),
      connectedAt: 'Just now',
      totalChats: 0,
      activeAI: true,
    };
    setChannels((prev) => [newChan, ...prev]);
    setConnectModalOpen(false);
    setFormName('');
    setFormExternalId('');
    setFormToken('');
  };

  const toggleAI = (id: string) => {
    setChannels((prev) =>
      prev.map((c) => (c.id === id ? { ...c, activeAI: !c.activeAI } : c))
    );
  };

  const handleDelete = (id: string) => {
    setChannels((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Omnichannel Messaging Channels
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Connect Facebook Pages, Instagram messaging, and WhatsApp Business Cloud API accounts.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setConnectModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Connect New Channel
        </Button>
      </div>

      {/* Channel Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {channels.map((chan) => (
          <Card key={chan.id} className="p-6 border-slate-200/90 hover:shadow-md transition-all space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-white shadow-sm ${
                    chan.platform === 'FACEBOOK'
                      ? 'bg-blue-600'
                      : chan.platform === 'INSTAGRAM'
                      ? 'bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600'
                      : chan.platform === 'WHATSAPP'
                      ? 'bg-emerald-600'
                      : 'bg-indigo-600'
                  }`}
                >
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">{chan.name}</h3>
                  <p className="text-xs text-slate-500">{chan.accountName}</p>
                </div>
              </div>
              <Badge
                variant={chan.status === 'CONNECTED' ? 'success' : 'secondary'}
                size="sm"
              >
                {chan.status === 'CONNECTED' ? 'Live & Connected' : 'Not Connected'}
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 text-center">
              <div>
                <p className="text-[10px] uppercase font-semibold text-slate-400">Platform</p>
                <p className="text-xs font-bold text-slate-800">{chan.platform}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-semibold text-slate-400">Total Chats</p>
                <p className="text-xs font-bold text-slate-800">{chan.totalChats.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-semibold text-slate-400">AI Status</p>
                <span
                  className={`text-xs font-bold ${
                    chan.activeAI ? 'text-indigo-600' : 'text-slate-400'
                  }`}
                >
                  {chan.activeAI ? 'Active 24/7' : 'Paused'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                onClick={() => toggleAI(chan.id)}
                className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                  chan.activeAI
                    ? 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                    : 'border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {chan.activeAI ? 'AI Agent Enabled' : 'Enable AI Agent'}
              </button>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-rose-600 hover:bg-rose-50"
                  onClick={() => handleDelete(chan.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Webhook Endpoint Reference Card */}
      <Card className="p-6 border-slate-200 bg-slate-50/60 space-y-3">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
          <Shield className="w-4 h-4 text-indigo-600" />
          <span>Official Meta & WhatsApp Webhook Listener URL</span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Use this URL in your Meta App Dashboard under Messenger / WhatsApp Webhooks with verify token <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 text-indigo-700 font-mono text-[11px]">omniflow_verify_token_secure_2026</code>.
        </p>
        <div className="flex items-center gap-3">
          <input
            readOnly
            value="https://api.omniflow.ai/api/v1/webhooks/meta"
            className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-700 select-all"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (navigator?.clipboard) {
                navigator.clipboard.writeText('https://api.omniflow.ai/api/v1/webhooks/meta');
              }
            }}
          >
            Copy URL
          </Button>
        </div>
      </Card>

      {/* Connect Modal */}
      <Modal
        isOpen={connectModalOpen}
        onClose={() => setConnectModalOpen(false)}
        title="Connect New Omnichannel Account"
        description="Select the platform and provide the official API credentials."
      >
        <form onSubmit={handleConnect} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Platform *</label>
            <div className="grid grid-cols-3 gap-2">
              {(['FACEBOOK', 'INSTAGRAM', 'WHATSAPP'] as const).map((plat) => (
                <button
                  type="button"
                  key={plat}
                  onClick={() => setSelectedPlatform(plat)}
                  className={`p-2.5 rounded-lg border text-xs font-bold transition-all text-center cursor-pointer ${
                    selectedPlatform === plat
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {plat}
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Channel Display Name *"
            required
            placeholder="e.g. Apex Lifestyle Official Facebook Page"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
          />

          <Input
            label={
              selectedPlatform === 'WHATSAPP'
                ? 'Phone Number ID / WABA ID *'
                : 'Page ID / External Account ID *'
            }
            required
            placeholder={selectedPlatform === 'WHATSAPP' ? '1092847192847' : '17841400284719'}
            value={formExternalId}
            onChange={(e) => setFormExternalId(e.target.value)}
          />

          <Input
            label="Permanent System User Access Token *"
            type="password"
            required
            placeholder="EAA..."
            value={formToken}
            onChange={(e) => setFormToken(e.target.value)}
            hint="Tokens are encrypted at rest with AES-256-GCM."
          />

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setConnectModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save & Verify Channel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
