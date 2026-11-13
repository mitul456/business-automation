'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n-context';
import { ApiClient } from '@/lib/api';
import {
  Users,
  Search,
  Filter,
  Phone,
  Mail,
  MapPin,
  ShoppingBag,
  Clock,
  Tag,
  ChevronRight,
  TrendingUp,
  Plus,
  Crown,
  FileText,
  Activity,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { Button, Input, Card, Badge, Modal, Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@omniflow/ui';

export default function CustomersPage() {
  const { activeTenant } = useAuth();
  const { t } = useI18n();

  const [customers, setCustomers] = useState<any[]>([
    {
      id: 'cust-1',
      name: 'Tanvir Ahmed',
      email: 'tanvir@example.com',
      phone: '+8801712345678',
      city: 'Dhaka',
      district: 'Dhaka',
      address: 'House 42, Road 11, Sector 4, Uttara',
      leadStage: 'QUALIFIED',
      leadScore: 85,
      tags: ['vip', 'festive-shopper'],
      notes: 'Prefers premium cotton fabrics. Fast payer via COD.',
      totalOrders: 2,
      totalSpent: 5820,
      createdAt: '2026-10-15',
      timelineEvents: [
        { title: 'Placed Order #ORD-2026-0001', eventType: 'ORDER_CREATED', createdAt: '2026-10-31 10:19 AM' },
        { title: 'Lead Stage Changed to QUALIFIED', eventType: 'STAGE_CHANGED', createdAt: '2026-10-25 02:00 PM' },
        { title: 'Initial WhatsApp Inquiry for Panjabi', eventType: 'MESSAGE_RECEIVED', createdAt: '2026-10-15 11:30 AM' },
      ],
    },
    {
      id: 'cust-2',
      name: 'Nusrat Jahan',
      email: 'nusrat@example.com',
      phone: '+8801812345678',
      city: 'Chittagong',
      district: 'Chittagong',
      address: 'GEC Circle, Nasirabad',
      leadStage: 'WON',
      leadScore: 95,
      tags: ['smartwatch-buyer', 'repeat-customer'],
      notes: 'Interested in wearable health gadgets. Uses bKash.',
      totalOrders: 1,
      totalSpent: 3570,
      createdAt: '2026-10-20',
      timelineEvents: [
        { title: 'Completed Payment via bKash for #ORD-2026-0002', eventType: 'PAYMENT_RECEIVED', createdAt: '2026-10-31 09:30 AM' },
        { title: 'Placed Order #ORD-2026-0002', eventType: 'ORDER_CREATED', createdAt: '2026-10-31 09:30 AM' },
      ],
    },
    {
      id: 'cust-3',
      name: 'Farhan Kabir',
      email: 'farhan@example.com',
      phone: '+8801912345678',
      city: 'Sylhet',
      district: 'Sylhet',
      address: 'Zindabazar, Sylhet',
      leadStage: 'CONTACTED',
      leadScore: 60,
      tags: ['new-lead'],
      notes: 'Looking for bulk panjabi gifting for family.',
      totalOrders: 0,
      totalSpent: 0,
      createdAt: '2026-10-31',
      timelineEvents: [
        { title: 'Customer Profile Created', eventType: 'CUSTOMER_CREATED', createdAt: '2026-10-31 04:00 PM' },
      ],
    },
  ]);

  const [segments, setSegments] = useState<any>({
    totalCustomers: 3,
    segments: { vip: 1, regular: 1, leads: 1 },
    stages: { QUALIFIED: 1, WON: 1, CONTACTED: 1 },
  });

  const [search, setSearch] = useState('');
  const [selectedStage, setSelectedStage] = useState('ALL');

  // Customer Detail Drawer Modal
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [newNote, setNewNote] = useState('');

  // Add Customer Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addCity, setAddCity] = useState('Dhaka');
  const [addAddress, setAddAddress] = useState('');
  const [addStage, setAddStage] = useState('NEW');
  const [addTags, setAddTags] = useState('retail, inquiry');
  const [addNotes, setAddNotes] = useState('');

  // Fetch real customers from API
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const [custRes, segRes] = await Promise.all([
          ApiClient.get('/customers'),
          ApiClient.get('/customers/segments'),
        ]);
        if (custRes?.customers && custRes.customers.length > 0) {
          setCustomers(custRes.customers);
        }
        if (segRes?.segments) {
          setSegments(segRes);
        }
      } catch {
        // Keeps demo data
      }
    };
    fetchCustomers();
  }, [activeTenant?.id]);

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    const tagsArray = addTags.split(',').map((t) => t.trim());

    const newCust = {
      id: `cust-${Date.now()}`,
      name: addName,
      email: addEmail,
      phone: addPhone,
      city: addCity,
      address: addAddress,
      leadStage: addStage,
      leadScore: 50,
      tags: tagsArray,
      notes: addNotes,
      totalOrders: 0,
      totalSpent: 0,
      createdAt: new Date().toISOString().split('T')[0],
      timelineEvents: [
        { title: 'Customer Profile Created', eventType: 'CUSTOMER_CREATED', createdAt: 'Just now' },
      ],
    };

    setCustomers((prev) => [newCust, ...prev]);
    setIsAddModalOpen(false);

    try {
      await ApiClient.post('/customers', {
        name: addName,
        email: addEmail || undefined,
        phone: addPhone || undefined,
        city: addCity,
        address: addAddress,
        leadStage: addStage,
        tags: tagsArray,
        notes: addNotes,
      });
    } catch {
      // Local state preserved
    }

    setAddName('');
    setAddEmail('');
    setAddPhone('');
    setAddAddress('');
    setAddNotes('');
  };

  const handleSaveNote = async () => {
    if (!selectedCustomer || !newNote.trim()) return;

    const updatedNotes = selectedCustomer.notes
      ? `${selectedCustomer.notes}\n• ${newNote}`
      : `• ${newNote}`;

    const newEvent = {
      title: `Note Added: "${newNote}"`,
      eventType: 'NOTE_ADDED',
      createdAt: 'Just now',
    };

    setSelectedCustomer({
      ...selectedCustomer,
      notes: updatedNotes,
      timelineEvents: [newEvent, ...(selectedCustomer.timelineEvents || [])],
    });

    setCustomers((prev) =>
      prev.map((c) =>
        c.id === selectedCustomer.id
          ? {
              ...c,
              notes: updatedNotes,
              timelineEvents: [newEvent, ...(c.timelineEvents || [])],
            }
          : c
      )
    );

    setNewNote('');

    try {
      await ApiClient.put(`/customers/${selectedCustomer.id}`, { notes: updatedNotes });
    } catch {
      // Local state preserved
    }
  };

  const handleChangeStage = async (newStage: string) => {
    if (!selectedCustomer) return;

    setSelectedCustomer({
      ...selectedCustomer,
      leadStage: newStage,
    });

    setCustomers((prev) =>
      prev.map((c) => (c.id === selectedCustomer.id ? { ...c, leadStage: newStage } : c))
    );

    try {
      await ApiClient.patch(`/customers/${selectedCustomer.id}/lead-stage`, { leadStage: newStage });
    } catch {
      // Local state preserved
    }
  };

  const filtered = customers.filter((c) => {
    if (selectedStage !== 'ALL' && c.leadStage !== selectedStage) return false;
    if (
      search &&
      !c.name?.toLowerCase().includes(search.toLowerCase()) &&
      !c.phone?.includes(search) &&
      !c.city?.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <span>Customer CRM & Social Lead Pipeline</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Omnichannel customer profiles, contact records, lifetime value, and interaction timelines synchronized from Messenger, WhatsApp & Instagram.
          </p>
        </div>

        <Button
          onClick={() => setIsAddModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
          variant="primary"
          size="sm"
        >
          Add Customer Contact
        </Button>
      </div>

      {/* CRM Segmentation Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4 border-slate-200">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 font-medium">Total Contacts</p>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-xl font-bold text-slate-900 mt-1">{customers.length} Profiles</p>
        </Card>

        <Card className="p-4 border-slate-200">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 font-medium">VIP High-Value</p>
            <Crown className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl font-bold text-amber-600 mt-1">
            {segments.segments?.vip || customers.filter((c) => c.totalSpent > 5000 || c.totalOrders >= 2).length} VIP Buyers
          </p>
        </Card>

        <Card className="p-4 border-slate-200">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 font-medium">Returning Buyers</p>
            <ShoppingBag className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-bold text-emerald-600 mt-1">
            {segments.segments?.regular || customers.filter((c) => c.totalOrders > 0).length} Buyers
          </p>
        </Card>

        <Card className="p-4 border-slate-200">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 font-medium">Active Leads</p>
            <TrendingUp className="w-4 h-4 text-violet-600" />
          </div>
          <p className="text-xl font-bold text-violet-600 mt-1">
            {segments.segments?.leads || customers.filter((c) => c.totalOrders === 0).length} Prospects
          </p>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {['ALL', 'NEW', 'CONTACTED', 'QUALIFIED', 'WON', 'LOST'].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStage(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                selectedStage === st
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, phone number, city..."
            className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-600"
          />
        </div>
      </div>

      {/* Customer CRM Table */}
      <Card className="border-slate-200 overflow-hidden shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Lead Stage</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Orders Count</TableHead>
              <TableHead>Total Spent</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                      {c.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 text-xs sm:text-sm">{c.name}</p>
                      <p className="text-[11px] text-slate-400">{c.email || 'No email'}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs text-slate-700">{c.phone || '-'}</TableCell>
                <TableCell className="text-xs text-slate-600">
                  {c.city || c.address || 'Bangladesh'}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      c.leadStage === 'WON'
                        ? 'success'
                        : c.leadStage === 'QUALIFIED'
                        ? 'purple'
                        : c.leadStage === 'CONTACTED'
                        ? 'info'
                        : 'outline'
                    }
                  >
                    {c.leadStage}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-slate-700">{c.leadScore || 50}</span>
                    <span className="text-[10px] text-slate-400">/100</span>
                  </div>
                </TableCell>
                <TableCell className="font-semibold text-slate-900 text-center">{c.totalOrders || 0}</TableCell>
                <TableCell className="font-bold text-slate-900">৳{Number(c.totalSpent || 0).toLocaleString()} BDT</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1 max-w-xs">
                    {(c.tags || []).map((t: string, idx: number) => (
                      <span key={idx} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                        #{t}
                      </span>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={() => {
                      setSelectedCustomer(c);
                      setIsDetailModalOpen(true);
                    }}
                  >
                    Profile & Timeline
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Customer Detail Drawer / Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={`Customer Profile: ${selectedCustomer?.name || ''}`}
        description="Comprehensive customer profile, notes, purchasing history, and activity timeline."
        maxWidth="lg"
      >
        {selectedCustomer && (
          <div className="space-y-5">
            {/* Quick Profile Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-xl border text-xs">
              <div>
                <span className="text-slate-400">Phone:</span>
                <p className="font-semibold text-slate-800">{selectedCustomer.phone || '-'}</p>
              </div>
              <div>
                <span className="text-slate-400">Location:</span>
                <p className="font-semibold text-slate-800">{selectedCustomer.city || selectedCustomer.address || '-'}</p>
              </div>
              <div>
                <span className="text-slate-400">Total Spent:</span>
                <p className="font-bold text-indigo-600">৳{Number(selectedCustomer.totalSpent || 0).toLocaleString()} BDT</p>
              </div>
              <div>
                <span className="text-slate-400">Orders Placed:</span>
                <p className="font-bold text-slate-800">{selectedCustomer.totalOrders || 0} Orders</p>
              </div>
            </div>

            {/* Lead Stage Changer */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-600">Update Lead Stage:</span>
              <div className="flex gap-1">
                {['NEW', 'CONTACTED', 'QUALIFIED', 'WON', 'LOST'].map((st) => (
                  <button
                    key={st}
                    onClick={() => handleChangeStage(st)}
                    className={`px-2.5 py-1 rounded text-xs font-semibold ${
                      selectedCustomer.leadStage === st
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white border text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes Section */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-700">Internal Customer Notes</label>
              <div className="p-3 bg-slate-50 border rounded-xl text-xs text-slate-700 max-h-28 overflow-y-auto whitespace-pre-wrap">
                {selectedCustomer.notes || 'No notes logged yet.'}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add a quick note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
                <Button size="sm" onClick={handleSaveNote} disabled={!newNote.trim()}>
                  Add Note
                </Button>
              </div>
            </div>

            {/* Activity Timeline */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-indigo-600" /> Customer Activity Timeline
              </h4>
              <div className="border border-slate-200 rounded-xl p-3 bg-white divide-y max-h-48 overflow-y-auto text-xs">
                {(selectedCustomer.timelineEvents || []).map((ev: any, idx: number) => (
                  <div key={idx} className="py-2 first:pt-0 last:pb-0 flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-slate-800">{ev.title}</p>
                      {ev.description && <p className="text-slate-500 text-[11px]">{ev.description}</p>}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">{ev.createdAt}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="primary" onClick={() => setIsDetailModalOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Customer Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Customer Contact"
        description="Creates a new customer profile in your workspace CRM."
        maxWidth="md"
      >
        <form onSubmit={handleAddCustomer} className="space-y-4">
          <Input
            label="Customer Name"
            required
            value={addName}
            onChange={(e) => setAddName(e.target.value)}
            placeholder="e.g. Tanvir Ahmed"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Phone Number"
              value={addPhone}
              onChange={(e) => setAddPhone(e.target.value)}
              placeholder="e.g. 01712345678"
            />
            <Input
              label="Email Address"
              type="email"
              value={addEmail}
              onChange={(e) => setAddEmail(e.target.value)}
              placeholder="customer@gmail.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="City"
              value={addCity}
              onChange={(e) => setAddCity(e.target.value)}
              placeholder="Dhaka"
            />
            <Input
              label="Full Address"
              value={addAddress}
              onChange={(e) => setAddAddress(e.target.value)}
              placeholder="House, Road, Area..."
            />
          </div>

          <Input
            label="Tags (comma separated)"
            value={addTags}
            onChange={(e) => setAddTags(e.target.value)}
            placeholder="vip, panjabi-buyer"
          />

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Notes</label>
            <textarea
              rows={2}
              value={addNotes}
              onChange={(e) => setAddNotes(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2 text-xs"
              placeholder="Customer preferences, measurements, etc."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Create Customer
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
