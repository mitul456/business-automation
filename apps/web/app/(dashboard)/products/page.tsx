'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n-context';
import { ApiClient } from '@/lib/api';
import {
  Package,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Tag,
  DollarSign,
  Boxes,
  Trash2,
  Edit,
} from 'lucide-react';
import { Button, Input, Card, Badge, Modal, Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@omniflow/ui';

export default function ProductsPage() {
  const { activeTenant } = useAuth();
  const { t } = useI18n();

  const [products, setProducts] = useState<any[]>([
    {
      id: 'prod-1',
      name: 'Royal Navy Blue Embroidered Panjabi',
      sku: 'PJ-ROYAL-NAVY-M',
      price: 2850,
      compareAtPrice: 3500,
      stockQuantity: 45,
      category: { name: 'Premium Panjabi' },
      images: ['https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?w=200&auto=format&fit=crop'],
      visualTags: ['panjabi', 'navy blue', 'embroidery', 'eid'],
      status: 'ACTIVE',
    },
    {
      id: 'prod-2',
      name: 'Apex Ultra Smart Watch (AMOLED Bluetooth)',
      sku: 'WT-AMOLED-ULTRA',
      price: 3450,
      compareAtPrice: 4200,
      stockQuantity: 80,
      category: { name: 'Smart Gadgets' },
      images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&auto=format&fit=crop'],
      visualTags: ['smartwatch', 'amoled', 'black', 'bluetooth'],
      status: 'ACTIVE',
    },
    {
      id: 'prod-3',
      name: 'Pure Full Grain Leather Bi-fold Wallet',
      sku: 'WL-LEATHER-BROWN',
      price: 1450,
      compareAtPrice: 1800,
      stockQuantity: 12,
      category: { name: 'Leather Accessories' },
      images: ['https://images.unsplash.com/photo-1627123424574-724758594e93?w=200&auto=format&fit=crop'],
      visualTags: ['wallet', 'leather', 'brown'],
      status: 'ACTIVE',
    },
  ]);

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Product Form State
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState(2500);
  const [stockQuantity, setStockQuantity] = useState(20);
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?w=200&auto=format&fit=crop');
  const [visualTags, setVisualTags] = useState('lifestyle, premium');

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const newProd = {
      id: `prod-${Date.now()}`,
      name,
      sku,
      price,
      stockQuantity,
      images: [imageUrl],
      visualTags: visualTags.split(',').map((t) => t.trim()),
      category: { name: 'General Catalog' },
      status: 'ACTIVE',
    };

    setProducts((prev) => [newProd, ...prev]);
    setIsModalOpen(false);
    setName('');
    setSku('');

    ApiClient.post('/products', {
      name,
      sku,
      price,
      stockQuantity,
      images: [imageUrl],
      visualTags: visualTags.split(',').map((t) => t.trim()),
    }).catch(() => {});
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-600" />
            <span>Product Catalog & Real-Time Inventory</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage store merchandise. AI automatically checks these stock counts and BDT prices during customer chats.
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
          variant="primary"
        >
          Add Product
        </Button>
      </div>

      {/* Product Stats Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-3 border-slate-200">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Products</p>
            <p className="text-lg font-bold text-slate-900">{products.length} Items</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3 border-slate-200">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">In-Stock Rate</p>
            <p className="text-lg font-bold text-slate-900">100% In Stock</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3 border-slate-200">
          <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center text-pink-600">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Vision Indexed</p>
            <p className="text-lg font-bold text-slate-900">{products.length} Matchable</p>
          </div>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, SKU..."
            className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-600"
          />
        </div>
      </div>

      {/* Products Table */}
      <Card className="border-slate-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price (BDT)</TableHead>
              <TableHead>Stock Level</TableHead>
              <TableHead>Vision Tags</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map((prod) => (
              <TableRow key={prod.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <img
                      src={prod.images?.[0] || 'https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?w=200'}
                      alt={prod.name}
                      className="w-11 h-11 rounded-lg object-cover border border-slate-200 shrink-0"
                    />
                    <div>
                      <p className="font-semibold text-slate-900 text-xs sm:text-sm">{prod.name}</p>
                      <p className="text-[11px] text-slate-400">Regular: ৳{prod.compareAtPrice || prod.price}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs text-slate-700">{prod.sku}</TableCell>
                <TableCell>{prod.category?.name || 'General'}</TableCell>
                <TableCell className="font-bold text-slate-900 text-sm">৳{prod.price.toLocaleString()}</TableCell>
                <TableCell>
                  <span className="font-semibold text-slate-800">{prod.stockQuantity} in stock</span>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1 max-w-xs">
                    {(prod.visualTags || []).map((vt: string, idx: number) => (
                      <span key={idx} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                        #{vt}
                      </span>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={prod.stockQuantity > 0 ? 'success' : 'danger'}>
                    {prod.stockQuantity > 0 ? 'ACTIVE' : 'OUT_OF_STOCK'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Add Product Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Catalog Product"
        description="Product will immediately be searchable and recommendable by the AI sales agent."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateProduct} className="space-y-4">
          <Input
            label="Product Title"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Premium Cotton Panjabi"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="SKU Code"
              required
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="e.g. PJ-COTTON-01"
            />
            <Input
              label="Selling Price (BDT ৳)"
              type="number"
              required
              value={price}
              onChange={(e) => setPrice(parseFloat(e.target.value))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Stock Quantity"
              type="number"
              required
              value={stockQuantity}
              onChange={(e) => setStockQuantity(parseInt(e.target.value, 10))}
            />
            <Input
              label="Visual Tags (for Photo Match)"
              value={visualTags}
              onChange={(e) => setVisualTags(e.target.value)}
              placeholder="e.g. blue, cotton, festive"
            />
          </div>

          <Input
            label="Image URL"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Product
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
