'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n-context';
import { ApiClient } from '@/lib/api';
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  Sparkles,
} from 'lucide-react';
import { Button, Input, Card, Badge, Modal, Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@omniflow/ui';

export default function BookingsPage() {
  const { activeTenant } = useAuth();
  const { t } = useI18n();

  const [services, setServices] = useState<any[]>([
    { id: 's1', name: 'Custom Tailoring & Measurement Consultation', durationMinutes: 45, price: 500 },
    { id: 's2', name: 'Smartwatch Tech Support & Setup', durationMinutes: 30, price: 300 },
    { id: 's3', name: 'VIP Styling Session', durationMinutes: 60, price: 1200 },
  ]);

  const [appointments, setAppointments] = useState<any[]>([
    {
      id: 'apt-1',
      customer: { name: 'Tanvir Ahmed', phone: '+8801712345678' },
      service: { name: 'Custom Tailoring & Measurement Consultation' },
      date: '2026-11-02 11:00 AM',
      status: 'CONFIRMED',
      notes: 'Customer wants custom collar fit for Eid Panjabi.',
    },
    {
      id: 'apt-2',
      customer: { name: 'Nusrat Jahan', phone: '+8801812345678' },
      service: { name: 'Smartwatch Tech Support & Setup' },
      date: '2026-11-03 03:30 PM',
      status: 'CONFIRMED',
      notes: 'iOS Bluetooth pairing guidance.',
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [serviceName, setServiceName] = useState('');
  const [duration, setDuration] = useState(45);
  const [price, setPrice] = useState(500);

  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    const newSvc = {
      id: `s-${Date.now()}`,
      name: serviceName,
      durationMinutes: duration,
      price,
    };
    setServices((prev) => [...prev, newSvc]);
    setIsModalOpen(false);
    setServiceName('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-indigo-600" />
            <span>Service Bookings & Appointments</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Allow customers to book service appointments, consultations, and fittings directly through chat or web link.
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          variant="primary"
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Service
        </Button>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {services.map((svc) => (
          <Card key={svc.id} className="p-4 border-slate-200">
            <h3 className="font-bold text-sm text-slate-900 mb-1">{svc.name}</h3>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {svc.durationMinutes} mins
              </span>
              <span className="font-bold text-indigo-600">৳{svc.price} BDT</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Scheduled Appointments Table */}
      <Card className="border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h3 className="font-bold text-sm text-slate-900">Upcoming Scheduled Appointments</h3>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appointments.map((apt) => (
              <TableRow key={apt.id}>
                <TableCell>
                  <p className="font-semibold text-slate-900 text-xs">{apt.customer.name}</p>
                  <p className="text-[11px] text-slate-400">{apt.customer.phone}</p>
                </TableCell>
                <TableCell className="text-xs font-medium text-slate-800">{apt.service.name}</TableCell>
                <TableCell className="text-xs font-mono text-slate-700">{apt.date}</TableCell>
                <TableCell className="text-xs text-slate-600 max-w-xs truncate">{apt.notes}</TableCell>
                <TableCell>
                  <Badge variant="success">{apt.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Add Service Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Service Type"
      >
        <form onSubmit={handleAddService} className="space-y-4">
          <Input
            label="Service Title"
            required
            value={serviceName}
            onChange={(e) => setServiceName(e.target.value)}
            placeholder="e.g. In-Store Fitting & Alterations"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Duration (Minutes)"
              type="number"
              required
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value, 10))}
            />
            <Input
              label="Price (BDT ৳)"
              type="number"
              required
              value={price}
              onChange={(e) => setPrice(parseFloat(e.target.value))}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Service
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
