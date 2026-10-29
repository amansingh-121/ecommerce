import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  IndianRupee,
  Package,
  AlertTriangle,
  Plus,
  Search,
  Trash2,
  Edit2,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useStore } from '../context/StoreContext.tsx';
import {
  AdminStats,
  Order,
  OrderStatus,
  Coupon,
  Category,
  AdminReview,
  AdminCustomer,
} from '../types/ecommerce.ts';
import { ProductImage } from '../components/ProductImage.tsx';
import { formatPrice } from '../utils/currency.ts';
import { useOverlay } from '../hooks/useOverlay.ts';

export const AdminDashboard: React.FC = () => {
  const { products, refreshProducts, showToast } = useStore();

  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'orders'
    | 'products'
    | 'inventory'
    | 'coupons'
    | 'customers'
    | 'categories'
    | 'reviews'
  >('overview');

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'approved' | 'pending'>('all');

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
    subcategory: '',
    sku: '',
    basePrice: 1999,
    originalPrice: 2499,
    discountPercentage: 20,
    totalStock: 25,
    shortDescription: '',
    description: '',
    thumbnail: '',
  });

  // Coupon Creation / Editing Modal
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [editingCouponCode, setEditingCouponCode] = useState<string | null>(null);
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

  // Category Creation / Editing Modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    imageUrl: '',
    subcategories: '',
  });

  useOverlay(isProductModalOpen, () => setIsProductModalOpen(false));
  useOverlay(isCouponModalOpen, () => setIsCouponModalOpen(false));
  useOverlay(isCategoryModalOpen, () => setIsCategoryModalOpen(false));

  const fetchAdminData = async () => {
    try {
      const [statsRes, ordersRes, couponsRes, customersRes, categoriesRes, reviewsRes] =
        await Promise.all([
          fetch('/api/admin/stats'),
          fetch('/api/orders'),
          fetch('/api/admin/coupons'),
          fetch('/api/admin/customers'),
          fetch('/api/categories'),
          fetch('/api/admin/reviews'),
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
      if (categoriesRes.ok) {
        const cat = await categoriesRes.json();
        setCategories(cat.categories || []);
      }
      if (reviewsRes.ok) {
        const rev = await reviewsRes.json();
        setReviews(rev.reviews || []);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
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
            '/images/1505740420928-5e560c06d30e.jpg',
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

  // Create or Update Coupon
  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponForm.code.trim()) return;

    try {
      const url = editingCouponCode
        ? `/api/admin/coupons/${editingCouponCode}`
        : '/api/admin/coupons';
      const res = await fetch(url, {
        method: editingCouponCode ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(couponForm),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        showToast(
          editingCouponCode
            ? `Coupon "${couponForm.code}" updated`
            : `Coupon "${couponForm.code}" created successfully`
        );
        setIsCouponModalOpen(false);
        setEditingCouponCode(null);
        fetchAdminData();
      } else {
        showToast(data.error || 'Failed to save coupon', 'error');
      }
    } catch (err) {
      showToast('Failed to save coupon', 'error');
    }
  };

  const openCreateCoupon = () => {
    setEditingCouponCode(null);
    setCouponForm({
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
    setIsCouponModalOpen(true);
  };

  const openEditCoupon = (coupon: Coupon) => {
    setEditingCouponCode(coupon.code);
    setCouponForm({ ...coupon });
    setIsCouponModalOpen(true);
  };

  const handleDeleteCoupon = async (code: string) => {
    if (!window.confirm(`Delete coupon "${code}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/coupons/${code}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        showToast(`Coupon "${code}" deleted`);
        fetchAdminData();
      } else {
        showToast(data.error || 'Failed to delete coupon', 'error');
      }
    } catch (err) {
      showToast('Failed to delete coupon', 'error');
    }
  };

  // Category Management
  const openCreateCategory = () => {
    setEditingCategoryId(null);
    setCategoryForm({ name: '', description: '', imageUrl: '', subcategories: '' });
    setIsCategoryModalOpen(true);
  };

  const openEditCategory = (category: Category) => {
    setEditingCategoryId(category.id);
    setCategoryForm({
      name: category.name,
      description: category.description,
      imageUrl: category.imageUrl || '',
      subcategories: category.subcategories.join(', '),
    });
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: categoryForm.name.trim(),
      description: categoryForm.description.trim(),
      imageUrl: categoryForm.imageUrl.trim() || undefined,
      subcategories: categoryForm.subcategories
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean),
    };

    try {
      const url = editingCategoryId
        ? `/api/admin/categories/${editingCategoryId}`
        : '/api/admin/categories';
      const res = await fetch(url, {
        method: editingCategoryId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        showToast(editingCategoryId ? 'Category updated' : 'Category created');
        setIsCategoryModalOpen(false);
        setEditingCategoryId(null);
        fetchAdminData();
      } else {
        showToast(data.error || 'Failed to save category', 'error');
      }
    } catch (err) {
      showToast('Failed to save category', 'error');
    }
  };

  const handleDeleteCategory = async (category: Category) => {
    if (!window.confirm(`Remove the "${category.name}" category from the storefront?`)) return;
    try {
      const res = await fetch(`/api/admin/categories/${category.id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        showToast(`Category "${category.name}" removed`);
        fetchAdminData();
      } else {
        showToast(data.error || 'Failed to delete category', 'error');
      }
    } catch (err) {
      showToast('Failed to delete category', 'error');
    }
  };

  // Customer activation
  const handleToggleCustomer = async (customer: AdminCustomer) => {
    const nextActive = customer.isActive === false;
    try {
      const res = await fetch(`/api/admin/customers/${customer.id}/toggle`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: nextActive }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        showToast(`${customer.name} ${nextActive ? 'reactivated' : 'suspended'}`);
        fetchAdminData();
      } else {
        showToast(data.error || 'Failed to update customer', 'error');
      }
    } catch (err) {
      showToast('Failed to update customer', 'error');
    }
  };

  // Review moderation
  const handleModerateReview = async (
    review: AdminReview,
    action: 'approve' | 'reject' | 'delete'
  ) => {
    if (action === 'delete' && !window.confirm('Permanently delete this review?')) return;
    try {
      const res = await fetch(`/api/admin/reviews/${review.id}/moderate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        showToast(
          action === 'approve'
            ? 'Review approved and published'
            : action === 'reject'
            ? 'Review rejected and hidden'
            : 'Review deleted'
        );
        fetchAdminData();
      } else {
        showToast(data.error || 'Moderation action failed', 'error');
      }
    } catch (err) {
      showToast('Moderation action failed', 'error');
    }
  };

  const filteredReviews = reviews.filter((review) => {
    if (reviewFilter === 'approved') return review.isApproved !== false;
    if (reviewFilter === 'pending') return review.isApproved === false;
    return true;
  });

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
                category: categories[0]?.name || 'Electronics',
                subcategory: categories[0]?.subcategories[0] || '',
                sku: `AUR-${Date.now().toString().slice(-4)}`,
                basePrice: 1999,
                originalPrice: 2499,
                discountPercentage: 20,
                totalStock: 25,
                shortDescription: '',
                description: '',
                thumbnail:
                  '/images/1505740420928-5e560c06d30e.jpg',
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
          { id: 'categories', label: `Categories (${categories.length})` },
          { id: 'reviews', label: `Reviews (${reviews.length})` },
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
              <div className="pt-6 h-60 flex items-stretch justify-between gap-4">
                {stats?.monthlyRevenue.map((item, idx) => {
                  const maxRev = Math.max(...(stats?.monthlyRevenue.map((entry) => entry.revenue) || [1]));
                  const heightPercent = Math.max(4, Math.min(100, (item.revenue / maxRev) * 100));
                  return (
                    <div
                      key={idx}
                      className="flex-1 h-full flex flex-col items-center justify-end gap-2 group"
                    >
                      <div className="relative w-full flex-1 flex items-end">
                        <span className="absolute -top-5 inset-x-0 text-center text-[10px] font-bold text-neutral-700 opacity-0 group-hover:opacity-100 transition-opacity tabular-nums">
                          ₹{(item.revenue / 100000).toFixed(1)}L
                        </span>
                        <div
                          className="w-full bg-neutral-900 group-hover:bg-neutral-700 rounded-t-lg transition-all"
                          style={{ height: `${heightPercent}%` }}
                          title={`₹${item.revenue.toLocaleString('en-IN')} · ${item.orders} orders`}
                        />
                      </div>
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

      {/* TAB 5: CATEGORY MANAGEMENT */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-neutral-900 font-display">
                Storefront Categories
              </h3>
              <p className="text-xs text-neutral-500">
                Categories power the home page collections and catalog navigation.
              </p>
            </div>
            <button
              onClick={openCreateCategory}
              className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 self-start"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Category</span>
            </button>
          </div>

          <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 text-neutral-500 uppercase tracking-wider font-semibold border-b border-neutral-200">
                  <tr>
                    <th className="px-5 py-3.5">Category</th>
                    <th className="px-5 py-3.5">Slug</th>
                    <th className="px-5 py-3.5">Products</th>
                    <th className="px-5 py-3.5">Subcategories</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {categories.map((category) => (
                    <tr key={category.id} className="hover:bg-neutral-50/50">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-neutral-100 border border-neutral-200 shrink-0">
                            <ProductImage
                              src={category.imageUrl}
                              alt={category.name}
                              aspectRatio="square"
                            />
                          </div>
                          <div>
                            <span className="font-bold text-neutral-900 block">
                              {category.name}
                            </span>
                            <span className="text-[11px] text-neutral-500 line-clamp-1 max-w-[220px]">
                              {category.description || 'No description'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 font-mono text-neutral-500">{category.slug}</td>
                      <td className="px-5 py-3 font-bold text-neutral-900 tabular-nums">
                        {category.productCount}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex flex-wrap gap-1 max-w-[240px]">
                          {category.subcategories.length ? (
                            category.subcategories.map((sub) => (
                              <span
                                key={sub}
                                className="px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600 text-[10px] font-medium"
                              >
                                {sub}
                              </span>
                            ))
                          ) : (
                            <span className="text-neutral-400">None</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="inline-flex gap-2">
                          <button
                            onClick={() => openEditCategory(category)}
                            className="p-1.5 text-neutral-500 hover:text-neutral-900"
                            title="Edit category"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category)}
                            className="p-1.5 text-neutral-400 hover:text-rose-600"
                            title="Delete category"
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

      {/* TAB 6: REVIEW MODERATION */}
      {activeTab === 'reviews' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-neutral-900 font-display">
                Review Moderation
              </h3>
              <p className="text-xs text-neutral-500">
                Approve authentic feedback, hide spam, and keep product ratings trustworthy.
              </p>
            </div>
            <div className="flex items-center gap-1.5 bg-white border border-neutral-200 rounded-lg p-1 self-start">
              {(['all', 'pending', 'approved'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setReviewFilter(filter)}
                  className={`px-3 py-1.5 rounded-md text-[11px] font-semibold capitalize transition-colors ${
                    reviewFilter === filter
                      ? 'bg-neutral-900 text-white'
                      : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {filteredReviews.length === 0 && (
              <div className="bg-white border border-dashed border-neutral-300 rounded-2xl p-10 text-center">
                <p className="text-sm font-semibold text-neutral-700">No reviews in this view</p>
                <p className="text-xs text-neutral-500 mt-1">
                  New customer feedback will appear here for moderation.
                </p>
              </div>
            )}

            {filteredReviews.map((review) => {
              const isPending = review.isApproved === false;
              return (
                <div
                  key={review.id}
                  className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-neutral-950">{review.title}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                            isPending
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {isPending ? 'Pending' : 'Approved'}
                        </span>
                        {review.verifiedPurchase && (
                          <span className="text-[10px] font-semibold text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded">
                            Verified purchase
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-neutral-500 mt-1">
                        <span className="font-semibold text-neutral-700">{review.userName}</span>
                        {' · '}
                        {review.productName}
                        {' · '}
                        {new Date(review.createdAt).toLocaleDateString('en-IN')}
                      </div>
                    </div>
                    <div className="text-sm text-amber-500 tracking-tight shrink-0">
                      {'★'.repeat(review.rating)}
                      <span className="text-neutral-300">{'★'.repeat(5 - review.rating)}</span>
                    </div>
                  </div>

                  <p className="text-xs text-neutral-600 leading-relaxed">{review.comment}</p>

                  <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-neutral-100">
                    {isPending ? (
                      <button
                        onClick={() => handleModerateReview(review, 'approve')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold rounded-lg"
                      >
                        Approve & Publish
                      </button>
                    ) : (
                      <button
                        onClick={() => handleModerateReview(review, 'reject')}
                        className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-[11px] font-semibold rounded-lg"
                      >
                        Hide Review
                      </button>
                    )}
                    <button
                      onClick={() => handleModerateReview(review, 'delete')}
                      className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 text-[11px] font-semibold rounded-lg flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 7: COUPONS */}
      {activeTab === 'coupons' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-neutral-900 font-display">
              Promotional Codes & VIP Invitations
            </h3>
            <button
              onClick={openCreateCoupon}
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
                <div className="text-sm font-bold text-neutral-950">
                  {c.discountType === 'percentage'
                    ? `${c.discountValue}% off`
                    : `${formatPrice(c.discountValue)} off`}
                  {c.maximumDiscount ? (
                    <span className="text-[11px] font-medium text-neutral-500">
                      {' '}
                      · cap {formatPrice(c.maximumDiscount)}
                    </span>
                  ) : null}
                </div>
                <div className="pt-2 border-t border-neutral-100 space-y-1 text-neutral-500 text-[11px]">
                  <div>Min. Order: {formatPrice(c.minimumOrder)}</div>
                  <div>
                    Used: {c.usedCount}
                    {c.usageLimit ? ` / ${c.usageLimit}` : ''} times
                  </div>
                  <div>Expires: {new Date(c.expiryDate).toLocaleDateString('en-IN')}</div>
                </div>
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
                  <button
                    onClick={() => openEditCoupon(c)}
                    className="px-2.5 py-1 text-[11px] font-semibold text-neutral-700 border border-neutral-200 rounded-md hover:bg-neutral-50 flex items-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteCoupon(c.code)}
                    className="px-2.5 py-1 text-[11px] font-semibold text-rose-600 border border-rose-200 rounded-md hover:bg-rose-50 flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete</span>
                  </button>
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
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-5 py-3.5">Phone</th>
                  <th className="px-5 py-3.5">Orders</th>
                  <th className="px-5 py-3.5">Lifetime Spend</th>
                  <th className="px-5 py-3.5">Role</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Member Since</th>
                  <th className="px-5 py-3.5 text-right">Access</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {customers.map((u) => (
                  <tr key={u.id} className="hover:bg-neutral-50/50">
                    <td className="px-5 py-3">
                      <span className="font-bold text-neutral-900 block">{u.name}</span>
                      <span className="text-[11px] text-neutral-500">{u.email}</span>
                    </td>
                    <td className="px-5 py-3 text-neutral-500 font-mono">{u.phone || 'N/A'}</td>
                    <td className="px-5 py-3 font-semibold text-neutral-800 tabular-nums">
                      {u.orderCount}
                    </td>
                    <td className="px-5 py-3 font-bold text-neutral-900 tabular-nums">
                      {formatPrice(u.lifetimeSpend)}
                    </td>
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
                    <td className="px-5 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                          u.isActive === false
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {u.isActive === false ? 'Suspended' : 'Active'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-neutral-400">
                      {new Date(u.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => handleToggleCustomer(u)}
                        disabled={u.role === 'admin'}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                          u.isActive === false
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-white text-rose-600 border-rose-200 hover:bg-rose-50'
                        }`}
                      >
                        {u.isActive === false ? 'Reactivate' : 'Suspend'}
                      </button>
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
                    onChange={(e) => {
                      const nextCategory = categories.find((cat) => cat.name === e.target.value);
                      setProductForm({
                        ...productForm,
                        category: e.target.value,
                        subcategory: nextCategory?.subcategories[0] || '',
                      });
                    }}
                    className="w-full px-3 py-2 border rounded-lg bg-white"
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                    {!categories.some((category) => category.name === productForm.category) && (
                      <option value={productForm.category}>{productForm.category}</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Subcategory</label>
                  <input
                    type="text"
                    list="aureva-admin-subcategories"
                    value={productForm.subcategory}
                    onChange={(e) => setProductForm({ ...productForm, subcategory: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <datalist id="aureva-admin-subcategories">
                    {(categories.find((cat) => cat.name === productForm.category)?.subcategories || []).map(
                      (subcategory) => (
                        <option key={subcategory} value={subcategory} />
                      )
                    )}
                  </datalist>
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
                  placeholder="/images/product-name.jpg"
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

      {/* CREATE / EDIT COUPON MODAL */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-neutral-900/50 backdrop-blur-xs"
            onClick={() => setIsCouponModalOpen(false)}
          />
          <div className="relative w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-neutral-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-neutral-100">
              <h4 className="text-base font-bold text-neutral-900 font-display">
                {editingCouponCode ? `Edit ${editingCouponCode}` : 'Create Promo Code'}
              </h4>
              <button
                onClick={() => setIsCouponModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCoupon} className="space-y-3 text-xs">
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

              <div>
                <label className="font-bold text-neutral-700 block mb-1">Description</label>
                <input
                  type="text"
                  value={couponForm.description}
                  onChange={(e) =>
                    setCouponForm({ ...couponForm, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Usage Limit</label>
                  <input
                    type="number"
                    value={couponForm.usageLimit || ''}
                    onChange={(e) =>
                      setCouponForm({ ...couponForm, usageLimit: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={couponForm.expiryDate.slice(0, 10)}
                    onChange={(e) =>
                      setCouponForm({
                        ...couponForm,
                        expiryDate: `${e.target.value}T23:59:59Z`,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 px-1 py-1 font-semibold text-neutral-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={couponForm.isActive}
                  onChange={(e) => setCouponForm({ ...couponForm, isActive: e.target.checked })}
                  className="w-4 h-4 accent-neutral-900"
                />
                <span>Coupon is active and redeemable</span>
              </label>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsCouponModalOpen(false)}
                  className="px-4 py-2 text-neutral-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-neutral-900 text-white font-bold rounded-lg hover:bg-neutral-800"
                >
                  {editingCouponCode ? 'Save Changes' : 'Publish Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE / EDIT CATEGORY MODAL */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-neutral-900/50 backdrop-blur-xs"
            onClick={() => setIsCategoryModalOpen(false)}
          />
          <div className="relative w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-neutral-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-neutral-100">
              <h4 className="text-base font-bold text-neutral-900 font-display">
                {editingCategoryId ? 'Edit Category' : 'Create Category'}
              </h4>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-neutral-700 block mb-1">Category Name</label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-neutral-700 block mb-1">Description</label>
                <textarea
                  rows={3}
                  value={categoryForm.description}
                  onChange={(e) =>
                    setCategoryForm({ ...categoryForm, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="font-bold text-neutral-700 block mb-1">
                  Cover Image URL (optional)
                </label>
                <input
                  type="text"
                  value={categoryForm.imageUrl}
                  onChange={(e) => setCategoryForm({ ...categoryForm, imageUrl: e.target.value })}
                  placeholder="/images/category-cover.jpg"
                  className="w-full px-3 py-2 border rounded-lg font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="font-bold text-neutral-700 block mb-1">
                  Subcategories (comma separated)
                </label>
                <input
                  type="text"
                  value={categoryForm.subcategories}
                  onChange={(e) =>
                    setCategoryForm({ ...categoryForm, subcategories: e.target.value })
                  }
                  placeholder="Skincare, Fragrance, Rituals"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 text-neutral-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-neutral-900 text-white font-bold rounded-lg hover:bg-neutral-800"
                >
                  {editingCategoryId ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
