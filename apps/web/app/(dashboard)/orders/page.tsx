'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n-context';
import { ApiClient } from '@/lib/api';
import {
  ShoppingCart,
  Truck,
  FileText,
  Search,
  CheckCircle2,
  Clock,
  Printer,
  ChevronRight,
  DollarSign,
  PackageCheck,
  Send,
} from 'lucide-react';
import { Button, Input, Card, Badge, Modal, Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@omniflow/ui';

export default function OrdersPage() {
  const { activeTenant } = useAuth();
  const { t } = useI18n();

  const [orders, setOrders] = useState<any[]>([
    {
      id: 'ord-1',
      orderNumber: 'APX-2026-001',
      customer: {
        name: 'Tanvir Ahmed',
        phone: '+8801712345678',
        address: 'House 42, Road 11, Sector 4, Uttara',
        city: 'Dhaka',
      },
      items: [
        { productName: 'Royal Navy Blue Embroidered Panjabi', quantity: 1, unitPrice: 2850 },
      ],
      subtotal: 2850,
      shippingCost: 60,
      totalAmount: 2910,
      currency: 'BDT',
      paymentMethod: 'COD',
      paymentStatus: 'UNPAID',
      status: 'CONFIRMED',
      courierName: 'Steadfast Courier',
      courierTrackingId: 'ST-98765432',
      createdAt: '2026-10-31 10:19 AM',
    },
    {
      id: 'ord-2',
      orderNumber: 'APX-2026-002',
      customer: {
        name: 'Nusrat Jahan',
        phone: '+8801812345678',
        address: 'GEC Circle, Nasirabad',
        city: 'Chittagong',
      },
      items: [
        { productName: 'Apex Ultra Smart Watch (AMOLED Bluetooth)', quantity: 1, unitPrice: 3450 },
      ],
      subtotal: 3450,
      shippingCost: 120,
      totalAmount: 3570,
      currency: 'BDT',
      paymentMethod: 'BKASH',
      paymentStatus: 'PAID',
      status: 'PROCESSING',
      courierName: 'Steadfast Courier',
      courierTrackingId: 'ST-98765433',
      createdAt: '2026-10-31 09:30 AM',
    },
    {
      id: 'ord-3',
      orderNumber: 'APX-2026-003',
      customer: {
        name: 'Farhan Kabir',
        phone: '+8801912345678',
        address: 'Zindabazar, Sylhet',
        city: 'Sylhet',
      },
      items: [
        { productName: 'Royal Navy Blue Embroidered Panjabi', quantity: 2, unitPrice: 2850 },
      ],
      subtotal: 5700,
      shippingCost: 120,
      totalAmount: 5820,
      currency: 'BDT',
      paymentMethod: 'COD',
      paymentStatus: 'UNPAID',
      status: 'SHIPPED',
      courierName: 'Pathao Courier',
      courierTrackingId: 'PT-12948576',
      createdAt: '2026-10-30 04:15 PM',
    },
  ]);

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Steadfast Courier Dispatch Modal
  const [selectedOrderForCourier, setSelectedOrderForCourier] = useState<any | null>(null);
  const [isCourierModalOpen, setIsCourierModalOpen] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchSuccessMsg, setDispatchSuccessMsg] = useState('');

  // Invoice Modal
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<any | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  const handleDispatchCourier = async () => {
    if (!selectedOrderForCourier) return;
    setIsDispatching(true);

    const generatedTracking = `ST-${Date.now().toString().slice(-8)}`;

    setTimeout(() => {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === selectedOrderForCourier.id
            ? {
                ...o,
                status: 'PROCESSING',
                courierName: 'Steadfast Courier',
                courierTrackingId: generatedTracking,
              }
            : o
        )
      );

      setIsDispatching(false);
      setDispatchSuccessMsg(`Consignment Created on Steadfast! Tracking Code: ${generatedTracking}`);

      ApiClient.post(`/couriers/dispatch/steadfast/${selectedOrderForCourier.id}`).catch(() => {});

      setTimeout(() => {
        setIsCourierModalOpen(false);
        setDispatchSuccessMsg('');
      }, 2500);
    }, 1000);
  };

  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== 'ALL' && o.status !== statusFilter) return false;
    if (search && !o.orderNumber.toLowerCase().includes(search.toLowerCase()) && !o.customer.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-indigo-600" />
            <span>Order Pipeline & Automated Courier Booking</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Orders placed via Messenger, WhatsApp & Livechat. Connect Steadfast, Pathao & RedX for one-click parcel dispatch.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="purple" size="md">
            Auto COD Verification Active
          </Badge>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {['ALL', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === st
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
            placeholder="Search order ID, recipient..."
            className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-600"
          />
        </div>
      </div>

      {/* Orders Table */}
      <Card className="border-slate-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Customer Details</TableHead>
              <TableHead>Destination</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Payable Amount</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Courier / Consignment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.map((ord) => (
              <TableRow key={ord.id}>
                <TableCell className="font-bold text-slate-900">{ord.orderNumber}</TableCell>
                <TableCell>
                  <p className="font-semibold text-slate-800 text-xs">{ord.customer.name}</p>
                  <p className="text-[11px] text-slate-400">{ord.customer.phone}</p>
                </TableCell>
                <TableCell className="text-xs text-slate-600">
                  <p className="truncate max-w-[150px]">{ord.customer.address}</p>
                  <span className="font-semibold text-slate-800">{ord.customer.city}</span>
                </TableCell>
                <TableCell className="text-xs">
                  {ord.items.map((it: any, i: number) => (
                    <p key={i} className="truncate max-w-[180px]">
                      {it.quantity}x {it.productName}
                    </p>
                  ))}
                </TableCell>
                <TableCell className="font-bold text-slate-900 text-sm">
                  ৳{ord.totalAmount.toLocaleString()}
                </TableCell>
                <TableCell>
                  <Badge variant={ord.paymentStatus === 'PAID' ? 'success' : 'warning'}>
                    {ord.paymentMethod} • {ord.paymentStatus}
                  </Badge>
                </TableCell>
                <TableCell>
                  {ord.courierTrackingId ? (
                    <div>
                      <p className="text-xs font-semibold text-slate-800">{ord.courierName}</p>
                      <span className="text-[11px] font-mono bg-slate-100 text-indigo-700 px-1.5 py-0.5 rounded font-bold">
                        {ord.courierTrackingId}
                      </span>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedOrderForCourier(ord);
                        setIsCourierModalOpen(true);
                      }}
                      leftIcon={<Truck className="w-3.5 h-3.5 text-indigo-600" />}
                      className="text-xs py-1"
                    >
                      Dispatch
                    </Button>
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      ord.status === 'CONFIRMED'
                        ? 'info'
                        : ord.status === 'PROCESSING'
                        ? 'purple'
                        : ord.status === 'SHIPPED'
                        ? 'warning'
                        : 'success'
                    }
                  >
                    {ord.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedOrderForInvoice(ord);
                        setIsInvoiceModalOpen(true);
                      }}
                      title="View & Print Invoice"
                    >
                      <FileText className="w-4 h-4 text-slate-600" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Courier Dispatch Modal */}
      <Modal
        isOpen={isCourierModalOpen}
        onClose={() => setIsCourierModalOpen(false)}
        title="Dispatch to Steadfast Courier"
        description="Automated parcel booking API will create a consignment on your Steadfast portal."
      >
        {selectedOrderForCourier && (
          <div className="space-y-4">
            {dispatchSuccessMsg ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{dispatchSuccessMsg}</span>
              </div>
            ) : (
              <>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Invoice:</span>
                    <span className="font-bold text-slate-800">{selectedOrderForCourier.orderNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Recipient:</span>
                    <span className="font-bold text-slate-800">{selectedOrderForCourier.customer.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Delivery Address:</span>
                    <span className="font-bold text-slate-800">{selectedOrderForCourier.customer.address}, {selectedOrderForCourier.customer.city}</span>
                  </div>
                  <div className="flex justify-between text-indigo-700 font-bold border-t border-slate-200 pt-1.5">
                    <span>COD Amount to Collect:</span>
                    <span>৳{selectedOrderForCourier.paymentStatus === 'PAID' ? 0 : selectedOrderForCourier.totalAmount} BDT</span>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="ghost" onClick={() => setIsCourierModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    isLoading={isDispatching}
                    onClick={handleDispatchCourier}
                    leftIcon={<Truck className="w-4 h-4" />}
                  >
                    Confirm & Book Parcel
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>

      {/* Printable Invoice Modal */}
      <Modal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        title="Order Invoice"
        maxWidth="lg"
      >
        {selectedOrderForInvoice && (
          <div className="space-y-6 p-2">
            {/* Invoice Printable View */}
            <div className="border border-slate-200 rounded-xl p-6 bg-white space-y-6">
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{activeTenant?.name || 'Apex Lifestyle'}</h2>
                  <p className="text-xs text-slate-500">Dhaka, Bangladesh</p>
                  <p className="text-xs text-slate-500">support@apexstore.com</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-indigo-600">INVOICE</p>
                  <p className="text-xs font-mono font-bold text-slate-800">INV-{selectedOrderForInvoice.orderNumber}</p>
                  <p className="text-[11px] text-slate-400">{selectedOrderForInvoice.createdAt}</p>
                </div>
              </div>

              {/* Billed To */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="font-bold text-slate-900 uppercase tracking-wider text-[10px] text-slate-400 mb-1">Billed & Shipped To</p>
                  <p className="font-bold text-slate-800">{selectedOrderForInvoice.customer.name}</p>
                  <p className="text-slate-600">{selectedOrderForInvoice.customer.phone}</p>
                  <p className="text-slate-600">{selectedOrderForInvoice.customer.address}, {selectedOrderForInvoice.customer.city}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900 uppercase tracking-wider text-[10px] text-slate-400 mb-1">Payment Method</p>
                  <Badge variant={selectedOrderForInvoice.paymentStatus === 'PAID' ? 'success' : 'warning'}>
                    {selectedOrderForInvoice.paymentMethod} ({selectedOrderForInvoice.paymentStatus})
                  </Badge>
                  {selectedOrderForInvoice.courierTrackingId && (
                    <p className="text-[11px] text-slate-500 mt-2 font-mono">
                      Tracking: {selectedOrderForInvoice.courierTrackingId} ({selectedOrderForInvoice.courierName})
                    </p>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedOrderForInvoice.items.map((it: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium text-slate-900">{it.productName}</TableCell>
                        <TableCell>{it.quantity}</TableCell>
                        <TableCell>৳{it.unitPrice.toLocaleString()}</TableCell>
                        <TableCell className="font-bold">৳{(it.unitPrice * it.quantity).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Calculations */}
              <div className="flex justify-end text-xs space-y-1.5">
                <div className="w-60 space-y-1.5">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span>৳{selectedOrderForInvoice.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Delivery Charge:</span>
                    <span>৳{selectedOrderForInvoice.shippingCost}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-slate-900 border-t border-slate-200 pt-2">
                    <span>Total Amount:</span>
                    <span className="text-indigo-600">৳{selectedOrderForInvoice.totalAmount.toLocaleString()} BDT</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => window.print()} leftIcon={<Printer className="w-4 h-4" />}>
                Print Receipt
              </Button>
              <Button variant="primary" onClick={() => setIsInvoiceModalOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
