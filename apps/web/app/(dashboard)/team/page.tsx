'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n-context';
import { ApiClient } from '@/lib/api';
import {
  UserCheck,
  Plus,
  Mail,
  Shield,
  Trash2,
  CheckCircle2,
  User,
} from 'lucide-react';
import { Button, Input, Card, Badge, Modal, Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@omniflow/ui';

export default function TeamPage() {
  const { activeTenant } = useAuth();
  const { t } = useI18n();

  const [members, setMembers] = useState<any[]>([
    {
      id: 'mem-1',
      name: 'Mitul Chowdhury',
      email: 'mitul@apexstore.com',
      role: 'OWNER',
      status: 'ACTIVE',
      joinedAt: '2026-10-01',
    },
    {
      id: 'mem-2',
      name: 'Rahim Khan',
      email: 'rahim@apexstore.com',
      role: 'AGENT',
      status: 'ACTIVE',
      joinedAt: '2026-10-15',
    },
    {
      id: 'mem-3',
      name: 'Sadia Islam',
      email: 'sadia@apexstore.com',
      role: 'MANAGER',
      status: 'ACTIVE',
      joinedAt: '2026-10-22',
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState('AGENT');

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    const newMem = {
      id: `mem-${Date.now()}`,
      name: inviteName || inviteEmail.split('@')[0],
      email: inviteEmail,
      role: inviteRole,
      status: 'INVITED',
      joinedAt: 'Just now',
    };

    setMembers((prev) => [...prev, newMem]);
    setIsModalOpen(false);
    setInviteEmail('');
    setInviteName('');

    ApiClient.post('/workspaces/current/members', {
      email: inviteEmail,
      role: inviteRole,
    }).catch(() => {});
  };

  const handleRemoveMember = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-indigo-600" />
            <span>Team Members & Role-Based Access Control</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage who has access to customer chats, orders, catalog editing, and financial settings.
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          variant="primary"
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Invite Member
        </Button>
      </div>

      {/* Role Hierarchy Reference */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
        <Card className="p-4 border-slate-200">
          <Badge variant="purple" className="mb-2">OWNER</Badge>
          <p className="font-semibold text-slate-800">Store Founder</p>
          <p className="text-[11px] text-slate-500 mt-1">Full control over billing, team, API credentials, and payouts.</p>
        </Card>
        <Card className="p-4 border-slate-200">
          <Badge variant="info" className="mb-2">ADMIN</Badge>
          <p className="font-semibold text-slate-800">Store Admin</p>
          <p className="text-[11px] text-slate-500 mt-1">Can configure AI agent, connect channels, and invite agents.</p>
        </Card>
        <Card className="p-4 border-slate-200">
          <Badge variant="warning" className="mb-2">MANAGER</Badge>
          <p className="font-semibold text-slate-800">Operations Lead</p>
          <p className="text-[11px] text-slate-500 mt-1">Manages orders, dispatches couriers, and audits customer CRM.</p>
        </Card>
        <Card className="p-4 border-slate-200">
          <Badge variant="default" className="mb-2">AGENT</Badge>
          <p className="font-semibold text-slate-800">Support Specialist</p>
          <p className="text-[11px] text-slate-500 mt-1">Answers customer chats and creates quick orders.</p>
        </Card>
      </div>

      {/* Team Table */}
      <Card className="border-slate-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Email Address</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((m) => (
              <TableRow key={m.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                      {m.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="font-semibold text-slate-900 text-xs sm:text-sm">{m.name}</span>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs text-slate-600">{m.email}</TableCell>
                <TableCell>
                  <Badge variant={m.role === 'OWNER' ? 'purple' : m.role === 'ADMIN' ? 'info' : 'default'}>
                    {m.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={m.status === 'ACTIVE' ? 'success' : 'warning'}>
                    {m.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-slate-400">{m.joinedAt}</TableCell>
                <TableCell>
                  {m.role !== 'OWNER' && (
                    <button
                      onClick={() => handleRemoveMember(m.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                      title="Remove Member"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Invite Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Invite New Team Member"
        description="Invited members will receive an email invitation to access your workspace."
      >
        <form onSubmit={handleInvite} className="space-y-4">
          <Input
            label="Full Name"
            value={inviteName}
            onChange={(e) => setInviteName(e.target.value)}
            placeholder="e.g. Asif Mahmud"
          />

          <Input
            label="Email Address"
            type="email"
            required
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="asif@company.com"
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Workspace Role</label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:ring-1 focus:ring-indigo-600"
            >
              <option value="AGENT">AGENT (Chat support & quick orders)</option>
              <option value="MANAGER">MANAGER (Order dispatch & CRM)</option>
              <option value="ADMIN">ADMIN (AI config & integrations)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Send Invitation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
