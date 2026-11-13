'use client';

import React, { useState, useEffect } from 'react';
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
  CalendarDays,
  ListFilter,
  AlertCircle,
  Check,
  Ban,
  CalendarCheck,
} from 'lucide-react';
import { Button, Input, Card, Badge, Modal, Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@omniflow/ui';

export default function BookingsPage() {
  const { activeTenant } = useAuth();
  const { t } = useI18n();

  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');

  const [services, setServices] = useState<any[]>([
    { id: 's1', name: 'Custom Tailoring & Measurement Consultation', durationMinutes: 45, price: 500 },
    { id: 's2', name: 'Smartwatch Tech Support & Setup', durationMinutes: 30, price: 300 },
    { id: 's3', name: 'VIP Styling Session', durationMinutes: 60, price: 1200 },
  ]);

  const [appointments, setAppointments] = useState<any[]>([
    {
      id: 'apt-1',
      customer: { name: 'Tanvir Ahmed', phone: '+8801712345678' },
      service: { id: 's1', name: 'Custom Tailoring & Measurement Consultation' },
      scheduledStartTime: '2026-11-02T11:00:00Z',
      date: '2026-11-02 11:00 AM',
      status: 'CONFIRMED',
      notes: 'Customer wants custom collar fit for Eid Panjabi.',
    },
    {
      id: 'apt-2',
      customer: { name: 'Nusrat Jahan', phone: '+8801812345678' },
      service: { id: 's2', name: 'Smartwatch Tech Support & Setup' },
      scheduledStartTime: '2026-11-03T15:30:00Z',
      date: '2026-11-03 03:30 PM',
      status: 'CONFIRMED',
      notes: 'iOS Bluetooth pairing guidance.',
    },
    {
      id: 'apt-3',
      customer: { name: 'Farhan Kabir', phone: '+8801912345678' },
      service: { id: 's3', name: 'VIP Styling Session' },
      scheduledStartTime: '2026-11-04T14:00:00Z',
      date: '2026-11-04 02:00 PM',
      status: 'PENDING',
      notes: 'Bridal groom styling appointment.',
    },
  ]);

  // Modals
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [serviceName, setServiceName] = useState('');
  const [duration, setDuration] = useState(45);
  const [price, setPrice] = useState(500);

  // Book appointment form state
  const [bookCustomerName, setBookCustomerName] = useState('');
  const [bookCustomerPhone, setBookCustomerPhone] = useState('');
  const [bookServiceId, setBookServiceId] = useState('s1');
  const [bookDate, setBookDate] = useState('2026-11-05');
  const [bookTime, setBookTime] = useState('11:00');
  const [bookNotes, setBookNotes] = useState('');

  // Load from API
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const [srvRes, apptRes] = await Promise.all([
          ApiClient.get('/bookings/services'),
          ApiClient.get('/bookings/appointments'),
        ]);
        if (srvRes && srvRes.length > 0) setServices(srvRes);
        if (apptRes && apptRes.length > 0) setAppointments(apptRes);
      } catch {
        // Keeps demo data
      }
    };
    fetchBookings();
  }, [activeTenant?.id]);

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    const newSvc = {
      id: `s-${Date.now()}`,
      name: serviceName,
      durationMinutes: duration,
      price,
    };
    setServices((prev) => [...prev, newSvc]);
    setIsServiceModalOpen(false);

    try {
      await ApiClient.post('/bookings/services', {
        name: serviceName,
        durationMinutes: duration,
        price,
      });
    } catch {
      // Local state preserved
    }

    setServiceName('');
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedSvc = services.find((s) => s.id === bookServiceId) || services[0];
    const startTime = `${bookDate}T${bookTime}:00Z`;

    const newAppt = {
      id: `apt-${Date.now()}`,
      customer: { name: bookCustomerName, phone: bookCustomerPhone },
      service: selectedSvc,
      scheduledStartTime: startTime,
      date: `${bookDate} ${bookTime}`,
      status: 'CONFIRMED',
      notes: bookNotes,
    };

    setAppointments((prev) => [newAppt, ...prev]);
    setIsBookModalOpen(false);

    try {
      await ApiClient.post('/bookings/appointments', {
        serviceId: bookServiceId,
        customerId: 'demo-customer-id',
        scheduledStartTime: startTime,
        scheduledEndTime: `${bookDate}T12:00:00Z`,
        customerNotes: bookNotes,
      });
    } catch {
      // Local state preserved
    }

    setBookCustomerName('');
    setBookCustomerPhone('');
    setBookNotes('');
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
    );

    try {
      if (newStatus === 'CONFIRMED') {
        await ApiClient.patch(`/bookings/appointments/${id}/confirm`, {});
      } else if (newStatus === 'CANCELLED') {
        await ApiClient.patch(`/bookings/appointments/${id}/cancel`, { reason: 'Cancelled by operator' });
      }
    } catch {
      // Local state preserved
    }
  };

  const calendarDays = [
    { day: 1, appts: [] },
    { day: 2, appts: appointments.filter((a) => a.date?.includes('2026-11-02')) },
    { day: 3, appts: appointments.filter((a) => a.date?.includes('2026-11-03')) },
    { day: 4, appts: appointments.filter((a) => a.date?.includes('2026-11-04')) },
    { day: 5, appts: appointments.filter((a) => a.date?.includes('2026-11-05')) },
    { day: 6, appts: [] },
    { day: 7, appts: [] },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-indigo-600" />
            <span>Service Bookings & Appointments</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Allow customers to book service appointments, fittings, and consultations directly through AI chat or shared booking links.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-slate-300 p-0.5 bg-white text-xs">
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 rounded flex items-center gap-1 font-medium transition-colors ${
                viewMode === 'table' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" /> List
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-2.5 py-1 rounded flex items-center gap-1 font-medium transition-colors ${
                viewMode === 'calendar' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" /> Calendar
            </button>
          </div>

          <Button
            onClick={() => setIsBookModalOpen(true)}
            variant="outline"
            size="sm"
          >
            <CalendarCheck className="w-3.5 h-3.5 mr-1" /> Book Appointment
          </Button>

          <Button
            onClick={() => setIsServiceModalOpen(true)}
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            size="sm"
          >
            Add Service
          </Button>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {services.map((svc) => (
          <Card key={svc.id} className="p-4 border-slate-200 shadow-xs">
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

      {/* View Mode: Calendar View */}
      {viewMode === 'calendar' ? (
        <Card className="p-5 border-slate-200">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
            <h3 className="font-bold text-sm text-slate-900">November 2026 - Appointment Schedule</h3>
            <span className="text-xs text-slate-500">Timezone: Asia/Dhaka (GMT+6)</span>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="text-center font-bold text-xs text-slate-400 py-1">
                {d}
              </div>
            ))}
            {calendarDays.map((cd, i) => (
              <div
                key={i}
                className="border border-slate-200 rounded-xl p-2 min-h-28 bg-slate-50/50 flex flex-col justify-between"
              >
                <span className="text-xs font-bold text-slate-700">{cd.day}</span>
                <div className="space-y-1">
                  {cd.appts.map((a: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-1.5 rounded-lg bg-indigo-50 border border-indigo-100 text-[11px] text-indigo-900 font-medium"
                    >
                      <p className="truncate font-semibold">{a.customer?.name}</p>
                      <p className="text-[10px] text-indigo-600 truncate">{a.service?.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        /* View Mode: Table List View */
        <Card className="border-slate-200 overflow-hidden shadow-xs">
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
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.map((apt) => (
                <TableRow key={apt.id}>
                  <TableCell>
                    <p className="font-semibold text-slate-900 text-xs">{apt.customer?.name}</p>
                    <p className="text-[11px] text-slate-400">{apt.customer?.phone}</p>
                  </TableCell>
                  <TableCell className="text-xs font-medium text-slate-800">{apt.service?.name}</TableCell>
                  <TableCell className="text-xs font-mono text-slate-700">{apt.date}</TableCell>
                  <TableCell className="text-xs text-slate-600 max-w-xs truncate">{apt.notes || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={apt.status === 'CONFIRMED' ? 'success' : apt.status === 'CANCELLED' ? 'danger' : 'warning'}>
                      {apt.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {apt.status === 'PENDING' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleUpdateStatus(apt.id, 'CONFIRMED')}
                          title="Confirm Appointment"
                        >
                          <Check className="w-4 h-4 text-emerald-600 hover:text-emerald-800" />
                        </Button>
                      )}
                      {apt.status !== 'CANCELLED' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleUpdateStatus(apt.id, 'CANCELLED')}
                          title="Cancel Appointment"
                        >
                          <Ban className="w-4 h-4 text-rose-500 hover:text-rose-700" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Book Appointment Modal */}
      <Modal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        title="Book Appointment"
        description="Schedules a fitting, consultation, or service session."
        maxWidth="md"
      >
        <form onSubmit={handleBookAppointment} className="space-y-4">
          <Input
            label="Customer Name"
            required
            value={bookCustomerName}
            onChange={(e) => setBookCustomerName(e.target.value)}
            placeholder="e.g. Tanvir Ahmed"
          />

          <Input
            label="Customer Phone"
            required
            value={bookCustomerPhone}
            onChange={(e) => setBookCustomerPhone(e.target.value)}
            placeholder="e.g. 01712345678"
          />

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Service</label>
            <select
              value={bookServiceId}
              onChange={(e) => setBookServiceId(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2.5 text-xs bg-white text-slate-800"
            >
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.durationMinutes} mins - ৳{s.price} BDT)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Date"
              type="date"
              required
              value={bookDate}
              onChange={(e) => setBookDate(e.target.value)}
            />
            <Input
              label="Time"
              type="time"
              required
              value={bookTime}
              onChange={(e) => setBookTime(e.target.value)}
            />
          </div>

          <Input
            label="Notes"
            value={bookNotes}
            onChange={(e) => setBookNotes(e.target.value)}
            placeholder="Specific requests, measurements..."
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setIsBookModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Confirm Booking
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Service Modal */}
      <Modal
        isOpen={isServiceModalOpen}
        onClose={() => setIsServiceModalOpen(false)}
        title="Create Service Type"
        description="Configures bookable services for your store."
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
            <Button variant="ghost" onClick={() => setIsServiceModalOpen(false)}>
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
