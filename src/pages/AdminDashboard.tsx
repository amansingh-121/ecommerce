import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  IndianRupee,
  Package,
  Users,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Trash2,
  Edit2,
  Tag,
  ShieldCheck,
  ChevronRight,
  ArrowUpRight,
  RefreshCw,
  X,
} from 'lucide-react';
import { useStore } from '../context/StoreContext.tsx';
import { AdminStats, Order, OrderStatus, Product, Coupon, User } from '../types/ecommerce.ts';
import { ProductImage } from '../components/ProductImage.tsx';
import { formatPrice } from '../utils/currency.ts';
import { useOverlay } from '../hooks/useOverlay.ts';

export const AdminDashboard: React.FC = () => {
  const { products, refreshProducts, showToast } = useStore();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'orders' | 'products' | 'inventory' | 'coupons' | 'customers'
  >('overview');

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [customers, setCustomers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Order filters
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');

  // Product Add/Edit Modal
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    brand: '',
    category: 'Electronics',
    subcategory: 'Headphones',
    sku: '',
    basePrice: 1999,
    originalPrice: 2499,
    discountPercentage: 20,
    totalStock: 25,
    shortDescription: '',
    description: '',
    thumbnail: '',
  });

  // Coupon Creation Modal
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [couponForm, setCouponForm] = useState<Coupon>({
    code: '',
    discountType: 'percentage',
    discountValue: 15,
    minimumOrder: 999,
    maximumDiscount: 500,
    expiryDate: '2030-12-31T23:59:59Z',
    usageLimit: 500,
    usedCount: 0,
    isActive: true,
    description: 'Promotional VIP discount',
  });

  useOverlay(isProductModalOpen, () => setIsProductModalOpen(false));
  useOverlay(isCouponModalOpen, () => setIsCouponModalOpen(false));

  const fetchAdminData = async () => {
    try {
      setIsLoading(true);
      const [statsRes, ordersRes, couponsRes, customersRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/orders'),
        fetch('/api/admin/coupons'),
        fetch('/api/admin/customers'),
      ]);

      if (statsRes.ok) {
        const s = await statsRes.json();
        setStats(s.stats);
      }
      if (ordersRes.ok) {
        const o = await ordersRes.json();
        setOrders(o.orders || []);
      }
      if (couponsRes.ok) {
        const c = await couponsRes.json();
        setCoupons(c.coupons || []);
      }
      if (customersRes.ok) {
        const cust = await customersRes.json();
        setCustomers(cust.customers || []);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  // Change order status
  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          note: `Status updated to ${newStatus} by store administrator.`,
        }),
      });

      if (res.ok) {
        showToast(`Order status updated to "${newStatus}"`);
        fetchAdminData();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to update order', 'error');
      }
    } catch (err) {
      showToast('Error updating status', 'error');
    }
  };

  // Quick Restock
  const handleRestock = async (productId: string, addQty: number) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ totalStock: prod.totalStock + addQty }),
      });
      if (res.ok) {
        showToast(`Restocked ${prod.name} (+${addQty} units)`);
        await refreshProducts();
        fetchAdminData();
      }
    } catch (err) {
      showToast('Failed to restock', 'error');
    }
  };

  // Create or Update Product
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingProductId
        ? `/api/admin/products/${editingProductId}`
        : '/api/admin/products';
      const method = editingProductId ? 'PUT' : 'POST';

      const payload = {
        ...productForm,
        rating: 5.0,
        reviewCount: 1,
        inStock: productForm.totalStock > 0,
        images: [
          productForm.thumbnail ||
            'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop',
        ],
        variants: [
          {
            id: `var-${Date.now()}-1`,
            name: 'Standard Edition',
            sku: `${productForm.sku}-STD`,
            priceModifier: 0,
            stock: productForm.totalStock,
          },
        ],
        specifications: [
          {
            group: 'Specifications',
            items: [{ key: 'Material', value: 'Aerospace Grade 6063 Alloy' }],
          },
        ],
        tags: [productForm.category.toLowerCase(), productForm.brand.toLowerCase()],
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showToast(editingProductId ? 'Product updated' : 'New product created');
        setIsProductModalOpen(false);
        setEditingProductId(null);
        await refreshProducts();
        fetchAdminData();
      }
    } catch (err) {
      showToast('Error saving product', 'error');
    }
  };

  // Delete Product
  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('Are you sure you want to remove this product from catalog?')) return;
    try {
      const res = await fetch(`/api/admin/products/${productId}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Product removed from catalog');
        await refreshProducts();
        fetchAdminData();
      }
    } catch (err) {
      showToast('Error deleting product', 'error');
    }
  };

  // Create Coupon
  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponForm.code.trim()) return;

    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(couponForm),
      });
      if (res.ok) {
        showToast(`Coupon "${couponForm.code}" created successfully`);
        setIsCouponModalOpen(false);
        fetchAdminData();
      }
    } catch (err) {
      showToast('Failed to create coupon', 'error');
    }
  };

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    const matchSearch =
      o.orderNumber.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.customerName.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.customerEmail.toLowerCase().includes(orderSearch.toLowerCase());

    const matchStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Store Command Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-950 font-display">
            Aureva Executive Suite
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setEditingProductId(null);
              setProductForm({
                name: '',
                brand: '',
                category: 'Electronics',
                subcategory: 'Headphones',
                sku: `AUR-${Date.now().toString().slice(-4)}`,
                basePrice: 1999,
                originalPrice: 2499,
                discountPercentage: 20,
                totalStock: 25,
                shortDescription: '',
                description: '',
                thumbnail:
                  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop',
              });
              setIsProductModalOpen(true);
            }}
            className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-neutral-500 block">Total Gross Revenue</span>
            <div className="text-2xl font-bold text-neutral-950 font-display mt-1 tabular-nums">
              {formatPrice(stats?.totalRevenue ?? 0)}
            </div>
            <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">
              All-time verified payments
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <IndianRupee className="w-6 h-6 stroke-[1.75]" />
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-neutral-500 block">Today's Sales</span>
            <div className="text-2xl font-bold text-neutral-950 font-display mt-1 tabular-nums">
              {formatPrice(stats?.todaySales ?? 0)}
            </div>
            <span className="text-[11px] text-neutral-500 mt-0.5 block">Authorized today</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 stroke-[1.75]" />
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-neutral-500 block">Orders in Queue</span>
            <div className="text-2xl font-bold text-neutral-950 font-display mt-1 tabular-nums">
              {stats?.pendingOrders ?? 0}
            </div>
            <span className="text-[11px] text-amber-600 font-semibold mt-0.5 block">
              Awaiting dispatch
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Package className="w-6 h-6 stroke-[1.75]" />
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-neutral-500 block">Low Stock Alert</span>
            <div className="text-2xl font-bold text-neutral-950 font-display mt-1 tabular-nums">
              {products.filter((p) => p.totalStock <= 15).length} Models
            </div>
            <span className="text-[11px] text-rose-600 font-semibold mt-0.5 block">
              Restock required
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 stroke-[1.75]" />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-200 overflow-x-auto text-xs pb-1">
        {[
          { id: 'overview', label: 'Analytics & Revenue' },
          { id: 'orders', label: `Orders Management (${orders.length})` },
          { id: 'products', label: `Product Catalog (${products.length})` },
          { id: 'inventory', label: 'Inventory & Stock' },
          { id: 'coupons', label: `Coupons (${coupons.length})` },
          { id: 'customers', label: `Customers (${customers.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: ANALYTICS & OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Monthly Revenue Bar Chart */}
            <div className="lg:col-span-8 bg-white border border-neutral-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-base font-bold text-neutral-900 font-display">
                    Revenue Trajectory
                  </h3>
                  <span className="text-xs text-neutral-500">
                    Monthly commercial performance (INR)
                  </span>
                </div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  +34% YoY Growth
                </span>
              </div>

              {/* Bar visualization */}
              <div className="pt-6 h-60 flex items-end justify-between gap-4">
                {stats?.monthlyRevenue.map((item, idx) => {
                  const maxRev = 4000000;
                  const heightPercent = Math.min(100, (item.revenue / maxRev) * 100);
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                      <span className="text-[10px] font-bold text-neutral-700 opacity-0 group-hover:opacity-100 transition-opacity tabular-nums">
                        ₹{(item.revenue / 100000).toFixed(1)}L
                      </span>
                      <div
                        className="w-full bg-neutral-900 group-hover:bg-neutral-700 rounded-t-lg transition-all"
                        style={{ height: `${heightPercent}%` }}
                      />
                      <span className="text-[11px] text-neutral-500 font-medium whitespace-nowrap">
                        {item.month.split(' ')[0]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sales by Category Share */}
            <div className="lg:col-span-4 bg-white border border-neutral-200 rounded-2xl p-6 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-neutral-900 font-display">
                Sales by Category
              </h3>
              <div className="space-y-3 pt-2">
                {stats?.salesByCategory.map((cat, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-neutral-800">
                      <span>{cat.category}</span>
                      <span className="tabular-nums">{cat.percentage}%</span>
                    </div>
                    <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-neutral-900 h-2 rounded-full"
                        style={{ width: `${cat.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ORDERS MANAGEMENT */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {/* Filter / Search Controls */}
          <div className="bg-white border border-neutral-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search order ID, customer name, email..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-neutral-500">Status:</span>
              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                className="px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none bg-white font-medium"
              >
                <option value="all">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Processing">Processing</option>
                <option value="Shipped">Shipped</option>
                <option value="Out for Delivery">Out for Delivery</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Returned">Returned</option>
              </select>
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 text-neutral-500 uppercase tracking-wider font-semibold border-b border-neutral-200">
                  <tr>
                    <th className="px-5 py-3.5">Order ID</th>
                    <th className="px-5 py-3.5">Customer</th>
                    <th className="px-5 py-3.5">Items</th>
                    <th className="px-5 py-3.5">Total</th>
                    <th className="px-5 py-3.5">Current Status</th>
                    <th className="px-5 py-3.5 text-right">Advance Workflow</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-neutral-900">
                        {order.orderNumber}
                        <span className="text-[10px] text-neutral-400 block font-normal">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-bold text-neutral-900">{order.customerName}</div>
                        <div className="text-[11px] text-neutral-500">{order.customerEmail}</div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-semibold text-neutral-800">
                          {order.items.length} item{order.items.length > 1 ? 's' : ''}
                        </span>
                        <div className="text-[11px] text-neutral-500 line-clamp-1">
                          {order.items[0]?.productName}
                        </div>
                      </td>
                      <td className="px-5 py-4 font-bold text-neutral-900 tabular-nums">
                        {formatPrice(order.total)}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`px-2.5 py-1 rounded text-[11px] font-semibold border ${
                            order.status === 'Delivered'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : order.status === 'Shipped' || order.status === 'Out for Delivery'
                              ? 'bg-sky-50 text-sky-700 border-sky-200'
                              : order.status === 'Cancelled' || order.status === 'Returned'
                              ? 'bg-neutral-100 text-neutral-600 border-neutral-300'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex gap-1.5">
                          {order.status === 'Pending' && (
                            <button
                              onClick={() => handleUpdateOrderStatus(order.id, 'Confirmed')}
                              className="px-2.5 py-1 bg-neutral-900 text-white rounded text-[11px] font-semibold hover:bg-neutral-800"
                            >
                              Confirm
                            </button>
                          )}
                          {order.status === 'Confirmed' && (
                            <button
                              onClick={() => handleUpdateOrderStatus(order.id, 'Processing')}
                              className="px-2.5 py-1 bg-amber-600 text-white rounded text-[11px] font-semibold hover:bg-amber-700"
                            >
                              Process
                            </button>
                          )}
                          {order.status === 'Processing' && (
                            <button
                              onClick={() => handleUpdateOrderStatus(order.id, 'Shipped')}
                              className="px-2.5 py-1 bg-sky-600 text-white rounded text-[11px] font-semibold hover:bg-sky-700"
                            >
                              Ship
                            </button>
                          )}
                          {order.status === 'Shipped' && (
                            <button
                              onClick={() => handleUpdateOrderStatus(order.id, 'Out for Delivery')}
                              className="px-2.5 py-1 bg-sky-700 text-white rounded text-[11px] font-semibold"
                            >
                              Out for Delivery
                            </button>
                          )}
                          {order.status === 'Out for Delivery' && (
                            <button
                              onClick={() => handleUpdateOrderStatus(order.id, 'Delivered')}
                              className="px-2.5 py-1 bg-emerald-600 text-white rounded text-[11px] font-semibold hover:bg-emerald-700"
                            >
                              Deliver
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PRODUCT CATALOG */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 text-neutral-500 uppercase tracking-wider font-semibold border-b border-neutral-200">
                  <tr>
                    <th className="px-5 py-3.5">Product</th>
                    <th className="px-5 py-3.5">Category</th>
                    <th className="px-5 py-3.5">SKU</th>
                    <th className="px-5 py-3.5">Base Price</th>
                    <th className="px-5 py-3.5">Stock</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-neutral-50/50">
                      <td className="px-5 py-3 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-neutral-100 overflow-hidden shrink-0 border border-neutral-200">
                          <ProductImage
                            src={p.thumbnail || p.images[0]}
                            alt={p.name}
                            aspectRatio="square"
                          />
                        </div>
                        <div>
                          <span className="font-bold text-neutral-900 block">{p.name}</span>
                          <span className="text-[11px] text-neutral-400 font-mono">{p.brand}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-neutral-600">{p.category}</td>
                      <td className="px-5 py-3 font-mono text-neutral-500">{p.sku}</td>
                      <td className="px-5 py-3 font-bold text-neutral-900 tabular-nums">
                        {formatPrice(p.basePrice)}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`font-semibold tabular-nums ${
                            p.totalStock <= 15 ? 'text-rose-600 font-bold' : 'text-neutral-800'
                          }`}
                        >
                          {p.totalStock} units
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="inline-flex gap-2">
                          <button
                            onClick={() => {
                              setEditingProductId(p.id);
                              setProductForm({
                                name: p.name,
                                brand: p.brand,
                                category: p.category,
                                subcategory: p.subcategory,
                                sku: p.sku,
                                basePrice: p.basePrice,
                                originalPrice: p.originalPrice,
                                discountPercentage: p.discountPercentage,
                                totalStock: p.totalStock,
                                shortDescription: p.shortDescription,
                                description: p.description,
                                thumbnail: p.thumbnail,
                              });
                              setIsProductModalOpen(true);
                            }}
                            className="p-1.5 text-neutral-500 hover:text-neutral-900"
                            title="Edit Product"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="p-1.5 text-neutral-400 hover:text-rose-600"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: INVENTORY & STOCK */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 text-neutral-500 uppercase tracking-wider font-semibold border-b border-neutral-200">
                  <tr>
                    <th className="px-5 py-3.5">Product & SKU</th>
                    <th className="px-5 py-3.5">Current Stock</th>
                    <th className="px-5 py-3.5">Alert Level</th>
                    <th className="px-5 py-3.5 text-right">Instant Restock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-neutral-50/50">
                      <td className="px-5 py-3">
                        <span className="font-bold text-neutral-900 block">{p.name}</span>
                        <span className="font-mono text-[11px] text-neutral-400">{p.sku}</span>
                      </td>
                      <td className="px-5 py-3 font-bold text-neutral-900 tabular-nums">
                        {p.totalStock} units
                      </td>
                      <td className="px-5 py-3">
                        {p.totalStock <= 15 ? (
                          <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-bold border border-rose-200 text-[10px]">
                            CRITICAL LOW STOCK
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-semibold text-[11px]">
                            Healthy Level
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="inline-flex gap-2">
                          <button
                            onClick={() => handleRestock(p.id, 10)}
                            className="px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded font-semibold text-[11px]"
                          >
                            +10
                          </button>
                          <button
                            onClick={() => handleRestock(p.id, 25)}
                            className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 text-white rounded font-semibold text-[11px]"
                          >
                            +25
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: COUPONS */}
      {activeTab === 'coupons' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-neutral-900 font-display">
              Promotional Codes & VIP Invitations
            </h3>
            <button
              onClick={() => setIsCouponModalOpen(true)}
              className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Coupon</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {coupons.map((c) => (
              <div
                key={c.code}
                className="bg-white border border-neutral-200 rounded-xl p-5 space-y-2 text-xs shadow-2xs"
              >
                <div className="flex justify-between items-center">
                  <span className="font-mono font-bold text-sm text-neutral-950 bg-neutral-100 px-2.5 py-1 rounded">
                    {c.code}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      c.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-neutral-500'
                    }`}
                  >
                    {c.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-neutral-600 font-medium">{c.description}</p>
                <div className="pt-2 border-t border-neutral-100 space-y-1 text-neutral-500 text-[11px]">
                  <div>Min. Order: {formatPrice(c.minimumOrder)}</div>
                  <div>Used: {c.usedCount} times</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: CUSTOMERS */}
      {activeTab === 'customers' && (
        <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-neutral-500 uppercase tracking-wider font-semibold border-b border-neutral-200">
                <tr>
                  <th className="px-5 py-3.5">Customer Name</th>
                  <th className="px-5 py-3.5">Email</th>
                  <th className="px-5 py-3.5">Phone</th>
                  <th className="px-5 py-3.5">Assigned Role</th>
                  <th className="px-5 py-3.5">Member Since</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {customers.map((u) => (
                  <tr key={u.id} className="hover:bg-neutral-50/50">
                    <td className="px-5 py-3 font-bold text-neutral-900">{u.name}</td>
                    <td className="px-5 py-3 text-neutral-600">{u.email}</td>
                    <td className="px-5 py-3 text-neutral-500 font-mono">{u.phone || 'N/A'}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          u.role === 'admin'
                            ? 'bg-neutral-900 text-white'
                            : 'bg-neutral-100 text-neutral-700'
                        }`}
                      >
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-neutral-400">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE / EDIT PRODUCT MODAL */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-neutral-900/50 backdrop-blur-xs"
            onClick={() => setIsProductModalOpen(false)}
          />
          <div className="relative w-full max-w-xl bg-white rounded-2xl p-6 shadow-2xl border border-neutral-200 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-neutral-100">
              <h4 className="text-base font-bold text-neutral-900 font-display">
                {editingProductId ? 'Edit Product Model' : 'Create New Product'}
              </h4>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-neutral-700 block mb-1">Product Name</label>
                <input
                  type="text"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-neutral-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Brand Name</label>
                  <input
                    type="text"
                    value={productForm.brand}
                    onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-neutral-700 block mb-1">SKU</label>
                  <input
                    type="text"
                    value={productForm.sku}
                    onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Department</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-white"
                  >
                    <option value="Electronics">Electronics</option>
                    <option value="Fashion">Fashion</option>
                    <option value="Home">Home</option>
                    <option value="Beauty">Beauty</option>
                    <option value="Sports">Sports</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Subcategory</label>
                  <input
                    type="text"
                    value={productForm.subcategory}
                    onChange={(e) => setProductForm({ ...productForm, subcategory: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Base Price (₹)</label>
                  <input
                    type="number"
                    value={productForm.basePrice}
                    onChange={(e) =>
                      setProductForm({ ...productForm, basePrice: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Original Price (₹)</label>
                  <input
                    type="number"
                    value={productForm.originalPrice}
                    onChange={(e) =>
                      setProductForm({ ...productForm, originalPrice: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Stock Units</label>
                  <input
                    type="number"
                    value={productForm.totalStock}
                    onChange={(e) =>
                      setProductForm({ ...productForm, totalStock: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-neutral-700 block mb-1">Image URL</label>
                <input
                  type="text"
                  value={productForm.thumbnail}
                  onChange={(e) => setProductForm({ ...productForm, thumbnail: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 border rounded-lg font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="font-bold text-neutral-700 block mb-1">Short Description</label>
                <input
                  type="text"
                  value={productForm.shortDescription}
                  onChange={(e) =>
                    setProductForm({ ...productForm, shortDescription: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-neutral-700 block mb-1">Full Description</label>
                <textarea
                  rows={3}
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 text-neutral-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-neutral-900 text-white font-bold rounded-lg hover:bg-neutral-800 transition-colors"
                >
                  Save Product Model
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE COUPON MODAL */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-neutral-900/50 backdrop-blur-xs"
            onClick={() => setIsCouponModalOpen(false)}
          />
          <div className="relative w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-neutral-200 space-y-4">
            <h4 className="text-base font-bold text-neutral-900 font-display">Create Promo Code</h4>

            <form onSubmit={handleCreateCoupon} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-neutral-700 block mb-1">Coupon Code</label>
                <input
                  type="text"
                  placeholder="e.g. SUMMER25"
                  value={couponForm.code}
                  onChange={(e) =>
                    setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })
                  }
                  className="w-full px-3 py-2 border rounded-lg uppercase font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Discount Type</label>
                  <select
                    value={couponForm.discountType}
                    onChange={(e) =>
                      setCouponForm({
                        ...couponForm,
                        discountType: e.target.value as 'percentage' | 'fixed',
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg bg-white"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Discount Value</label>
                  <input
                    type="number"
                    value={couponForm.discountValue}
                    onChange={(e) =>
                      setCouponForm({ ...couponForm, discountValue: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Minimum Order (₹)</label>
                  <input
                    type="number"
                    value={couponForm.minimumOrder}
                    onChange={(e) =>
                      setCouponForm({ ...couponForm, minimumOrder: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Max Discount Cap (₹)</label>
                  <input
                    type="number"
                    value={couponForm.maximumDiscount || ''}
                    onChange={(e) =>
                      setCouponForm({ ...couponForm, maximumDiscount: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCouponModalOpen(false)}
                  className="px-4 py-2 text-neutral-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-neutral-900 text-white font-bold rounded-lg"
                >
                  Publish Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
