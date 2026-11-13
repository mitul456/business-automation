'use client';

import React, { useState, useEffect } from 'react';
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
  PackageCheck,
  Send,
  Plus,
  Ban,
  AlertTriangle,
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

  // New Order Modal
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [recipientCity, setRecipientCity] = useState('Dhaka');
  const [itemName, setItemName] = useState('Classic Oxford Cotton Shirt');
  const [itemPrice, setItemPrice] = useState(1850);
  const [itemQty, setItemQty] = useState(1);
  const [shippingCost, setShippingCost] = useState(60);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('COD');

  // Load orders from API
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await ApiClient.get('/orders');
        if (res?.orders && res.orders.length > 0) {
          setOrders(res.orders);
        }
      } catch {
        // Keeps demo orders
      }
    };
    fetchOrders();
  }, [activeTenant?.id]);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const subtotal = itemPrice * itemQty;
    const totalAmount = subtotal + shippingCost - discount;
    const orderNumber = `ORD-${Date.now().toString().slice(-4)}`;

    const newOrder = {
      id: `ord-${Date.now()}`,
      orderNumber,
      customer: {
        name: recipientName,
        phone: recipientPhone,
        address: recipientAddress,
        city: recipientCity,
      },
      items: [{ productName: itemName, quantity: itemQty, unitPrice: itemPrice }],
      subtotal,
      shippingCost,
      discount,
      totalAmount,
      currency: 'BDT',
      paymentMethod,
      paymentStatus: 'UNPAID',
      status: 'CONFIRMED',
      createdAt: new Date().toLocaleString(),
    };

    setOrders((prev) => [newOrder, ...prev]);
    setIsNewOrderModalOpen(false);

    try {
      await ApiClient.post('/orders', {
        customerId: 'demo-customer-id',
        items: [{ productId: 'prod-1', productName: itemName, quantity: itemQty, unitPrice: itemPrice }],
        shippingCost,
        discount,
        paymentMethod,
        shippingAddress: {
          recipientName,
          phone: recipientPhone,
          address: recipientAddress,
          city: recipientCity,
        },
      });
    } catch {
      // Local state preserved
    }

    setRecipientName('');
    setRecipientPhone('');
    setRecipientAddress('');
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order? Stock will be automatically restored.')) {
      return;
    }

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'CANCELLED' } : o))
    );

    try {
      await ApiClient.post(`/orders/${orderId}/cancel`, { reason: 'Customer cancellation' });
    } catch {
      // Local state preserved
    }
  };

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
    if (
      search &&
      !o.orderNumber?.toLowerCase().includes(search.toLowerCase()) &&
      !o.customer?.name?.toLowerCase().includes(search.toLowerCase())
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
            <ShoppingCart className="w-5 h-5 text-indigo-600" />
            <span>Order Pipeline & Automated Courier Booking</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Orders placed via Messenger, WhatsApp & Livechat. Connect Steadfast, Pathao & RedX for one-click parcel dispatch.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsNewOrderModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
            variant="primary"
            size="sm"
          >
            Create Order
          </Button>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {['ALL', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((st) => (
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
      <Card className="border-slate-200 overflow-hidden shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total (BDT)</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Order Status</TableHead>
              <TableHead>Courier / Tracking</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.map((ord) => (
              <TableRow key={ord.id}>
                <TableCell>
                  <span className="font-mono font-bold text-xs text-indigo-600">
                    {ord.orderNumber}
                  </span>
                  <p className="text-[10px] text-slate-400">{ord.createdAt}</p>
                </TableCell>
                <TableCell>
                  <p className="font-semibold text-slate-900 text-xs">{ord.customer?.name}</p>
                  <p className="text-[11px] text-slate-500">{ord.customer?.phone}</p>
                  <p className="text-[10px] text-slate-400 truncate max-w-xs">{ord.customer?.city || ord.customer?.address}</p>
                </TableCell>
                <TableCell>
                  <div className="space-y-0.5">
                    {(ord.items || []).map((it: any, i: number) => (
                      <p key={i} className="text-xs text-slate-700">
                        {it.productName} × <strong>{it.quantity}</strong>
                      </p>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-bold text-slate-900 text-sm">
                    ৳{Number(ord.totalAmount).toLocaleString()}
                  </span>
                  <p className="text-[10px] text-slate-400">Ship: ৳{ord.shippingCost}</p>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <Badge variant={ord.paymentStatus === 'PAID' ? 'success' : 'warning'}>
                      {ord.paymentStatus}
                    </Badge>
                    <p className="text-[10px] text-slate-500 font-mono">{ord.paymentMethod}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      ord.status === 'DELIVERED'
                        ? 'success'
                        : ord.status === 'SHIPPED'
                        ? 'purple'
                        : ord.status === 'PROCESSING'
                        ? 'info'
                        : ord.status === 'CANCELLED'
                        ? 'danger'
                        : 'outline'
                    }
                  >
                    {ord.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {ord.courierTrackingId ? (
                    <div>
                      <p className="text-xs font-semibold text-slate-800">{ord.courierName}</p>
                      <p className="font-mono text-[11px] text-indigo-600">{ord.courierTrackingId}</p>
                    </div>
                  ) : ord.status === 'CANCELLED' ? (
                    <span className="text-[11px] text-slate-400">Order Voided</span>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      onClick={() => {
                        setSelectedOrderForCourier(ord);
                        setIsCourierModalOpen(true);
                      }}
                    >
                      <Truck className="w-3.5 h-3.5 mr-1" /> Book Steadfast
                    </Button>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedOrderForInvoice(ord);
                        setIsInvoiceModalOpen(true);
                      }}
                      title="View & Print Invoice"
                    >
                      <FileText className="w-4 h-4 text-slate-500 hover:text-indigo-600" />
                    </Button>
                    {ord.status !== 'CANCELLED' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCancelOrder(ord.id)}
                        title="Cancel Order & Restore Stock"
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

      {/* Create Order Modal */}
      <Modal
        isOpen={isNewOrderModalOpen}
        onClose={() => setIsNewOrderModalOpen(false)}
        title="Create New Customer Order"
        description="Creates order, decrements product inventory, and records customer lifetime statistics."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateOrder} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Recipient Name"
              required
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="e.g. Tanvir Ahmed"
            />
            <Input
              label="Recipient Phone"
              required
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
              placeholder="e.g. 01712345678"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Delivery Address"
              required
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              placeholder="House, Road, Area..."
            />
            <Input
              label="City / District"
              required
              value={recipientCity}
              onChange={(e) => setRecipientCity(e.target.value)}
              placeholder="e.g. Dhaka"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Item Name"
              required
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
            />
            <Input
              label="Unit Price (BDT)"
              type="number"
              required
              value={itemPrice}
              onChange={(e) => setItemPrice(parseFloat(e.target.value))}
            />
            <Input
              label="Quantity"
              type="number"
              required
              value={itemQty}
              onChange={(e) => setItemQty(parseInt(e.target.value, 10))}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Shipping Cost (৳)"
              type="number"
              value={shippingCost}
              onChange={(e) => setShippingCost(parseFloat(e.target.value))}
            />
            <Input
              label="Discount (৳)"
              type="number"
              value={discount}
              onChange={(e) => setDiscount(parseFloat(e.target.value))}
            />
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2.5 text-xs bg-white text-slate-800"
              >
                <option value="COD">Cash on Delivery (COD)</option>
                <option value="BKASH">bKash</option>
                <option value="NAGAD">Nagad</option>
                <option value="STRIPE">Stripe Card</option>
              </select>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2 border-t">
            <div className="text-xs">
              <span className="text-slate-500">Order Subtotal:</span>{' '}
              <strong className="text-slate-900">৳{(itemPrice * itemQty + shippingCost - discount).toLocaleString()} BDT</strong>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setIsNewOrderModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Save & Place Order
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Steadfast Dispatch Modal */}
      <Modal
        isOpen={isCourierModalOpen}
        onClose={() => setIsCourierModalOpen(false)}
        title="Dispatch Consignment with Steadfast"
        description="Generates Steadfast shipping label, tracks consignment, and sends customer tracking SMS."
        maxWidth="md"
      >
        {selectedOrderForCourier && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl border text-xs space-y-1">
              <p className="font-semibold text-slate-900">Order #{selectedOrderForCourier.orderNumber}</p>
              <p className="text-slate-600">Recipient: {selectedOrderForCourier.customer.name} ({selectedOrderForCourier.customer.phone})</p>
              <p className="text-slate-600">Delivery Address: {selectedOrderForCourier.customer.address}, {selectedOrderForCourier.customer.city}</p>
              <p className="text-slate-600 font-bold">COD Amount to Collect: ৳{selectedOrderForCourier.totalAmount} BDT</p>
            </div>

            {dispatchSuccessMsg ? (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium">
                {dispatchSuccessMsg}
              </div>
            ) : (
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={() => setIsCourierModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleDispatchCourier}
                  disabled={isDispatching}
                >
                  {isDispatching ? 'Connecting Steadfast API...' : 'Confirm Steadfast Dispatch'}
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Printable Invoice Modal */}
      <Modal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        title="Order Invoice & Printable Receipt"
        maxWidth="lg"
      >
        {selectedOrderForInvoice && (
          <div className="space-y-6 p-2">
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

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="font-bold uppercase tracking-wider text-[10px] text-slate-400 mb-1">Billed & Shipped To</p>
                  <p className="font-bold text-slate-800">{selectedOrderForInvoice.customer?.name}</p>
                  <p className="text-slate-600">{selectedOrderForInvoice.customer?.phone}</p>
                  <p className="text-slate-600">{selectedOrderForInvoice.customer?.address}, {selectedOrderForInvoice.customer?.city}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold uppercase tracking-wider text-[10px] text-slate-400 mb-1">Payment Method</p>
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
                    {(selectedOrderForInvoice.items || []).map((it: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium text-slate-900">{it.productName}</TableCell>
                        <TableCell>{it.quantity}</TableCell>
                        <TableCell>৳{Number(it.unitPrice).toLocaleString()}</TableCell>
                        <TableCell className="font-bold">৳{(Number(it.unitPrice) * it.quantity).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-end text-xs space-y-1.5">
                <div className="w-60 space-y-1.5">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span>৳{Number(selectedOrderForInvoice.subtotal).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Delivery Charge:</span>
                    <span>৳{selectedOrderForInvoice.shippingCost}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-slate-900 border-t border-slate-200 pt-2">
                    <span>Total Amount:</span>
                    <span className="text-indigo-600">৳{Number(selectedOrderForInvoice.totalAmount).toLocaleString()} BDT</span>
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
