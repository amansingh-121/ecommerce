import React, { useEffect, useMemo, useState } from 'react';
import {
  User as UserIcon,
  Heart,
  Package,
  MapPin,
  Bell,
  Shield,
  Trash2,
  Plus,
  ShoppingBag,
  ExternalLink,
  LayoutDashboard,
  Edit2,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { useStore } from '../context/StoreContext.tsx';
import { Address, Order } from '../types/ecommerce.ts';
import { ProductImage } from '../components/ProductImage.tsx';
import { formatPrice } from '../utils/currency.ts';
import { useOverlay } from '../hooks/useOverlay.ts';

export const AccountPage: React.FC = () => {
  const {
    currentUser,
    updateUserProfile,
    wishlistIds,
    toggleWishlist,
    products,
    addToCart,
    setCurrentView,
    navigateToProduct,
    showToast,
    accountTab,
    setAccountTab,
    setSelectedOrderId,
  } = useStore();

  const activeTab = accountTab;

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  // Edit profile state
  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [phone, setPhone] = useState(currentUser.phone || '');

  // Add / edit address modal
  const [isAddAddressOpen, setIsAddAddressOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [newAddr, setNewAddr] = useState<Omit<Address, 'id'>>({
    fullName: currentUser.name,
    phone: currentUser.phone || '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    isDefault: false,
  });

  const closeAddressForm = () => {
    setIsAddAddressOpen(false);
    setEditingAddressId(null);
    setNewAddr({
      fullName: currentUser.name,
      phone: currentUser.phone || '',
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'India',
      isDefault: false,
    });
  };

  useOverlay(isAddAddressOpen, closeAddressForm);

  useEffect(() => {
    if (activeTab !== 'overview') return;

    let cancelled = false;
    const loadOrders = async () => {
      setIsLoadingOrders(true);
      try {
        const res = await fetch(`/api/orders?userId=${currentUser.id}`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setOrders(data.orders || []);
        }
      } catch (err) {
        console.error('Failed to load account orders:', err);
      } finally {
        if (!cancelled) setIsLoadingOrders(false);
      }
    };

    loadOrders();
    return () => {
      cancelled = true;
    };
  }, [activeTab, currentUser.id]);

  const wishlistProducts = useMemo(
    () => products.filter((p) => wishlistIds.includes(p.id)),
    [products, wishlistIds]
  );

  const wishlistRecommendations = useMemo(() => {
    const savedCategories = new Set(wishlistProducts.map((product) => product.category));
    const pool = products.filter((product) => !wishlistIds.includes(product.id));
    const matchingCategory = pool.filter((product) => savedCategories.has(product.category));
    return (matchingCategory.length ? matchingCategory : pool).slice(0, 4);
  }, [products, wishlistIds, wishlistProducts]);

  const readyToShipOrders = orders.filter(
    (order) => !['Delivered', 'Cancelled', 'Returned'].includes(order.status)
  );
  const deliveredOrders = orders.filter((order) => order.status === 'Delivered');
  const lifetimeSpend = orders
    .filter((order) => order.paymentStatus === 'Paid')
    .reduce((sum, order) => sum + order.total, 0);
  const recentOrders = orders.slice(0, 3);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({ name, email, phone });
  };

  const openNewAddress = () => {
    setEditingAddressId(null);
    setNewAddr({
      fullName: currentUser.name,
      phone: currentUser.phone || '',
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'India',
      isDefault: currentUser.savedAddresses.length === 0,
    });
    setIsAddAddressOpen(true);
  };

  const openEditAddress = (address: Address) => {
    const { id, ...rest } = address;
    setEditingAddressId(id);
    setNewAddr(rest);
    setIsAddAddressOpen(true);
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddr.street.trim() || !newAddr.city.trim()) {
      showToast('Street and city are required', 'error');
      return;
    }

    const addressId = editingAddressId || `addr-${Date.now()}`;
    const makeDefault = Boolean(newAddr.isDefault) || currentUser.savedAddresses.length === 0;
    const savedAddress: Address = {
      ...newAddr,
      id: addressId,
      isDefault: makeDefault,
    };

    let nextAddresses = editingAddressId
      ? currentUser.savedAddresses.map((address) =>
          address.id === addressId ? savedAddress : address
        )
      : [...currentUser.savedAddresses, savedAddress];

    if (makeDefault) {
      nextAddresses = nextAddresses.map((address) => ({
        ...address,
        isDefault: address.id === addressId,
      }));
    }

    updateUserProfile({ savedAddresses: nextAddresses });
    closeAddressForm();
  };

  const handleDeleteAddress = (id: string) => {
    let remaining = currentUser.savedAddresses.filter((address) => address.id !== id);
    if (remaining.length > 0 && !remaining.some((address) => address.isDefault)) {
      remaining = remaining.map((address, index) => ({
        ...address,
        isDefault: index === 0,
      }));
    }
    updateUserProfile({ savedAddresses: remaining });
    showToast('Address removed', 'info');
  };

  const handleSetDefaultAddress = (id: string) => {
    updateUserProfile({
      savedAddresses: currentUser.savedAddresses.map((address) => ({
        ...address,
        isDefault: address.id === id,
      })),
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Account Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-neutral-900 text-white flex items-center justify-center text-xl font-bold font-display overflow-hidden border border-neutral-200">
            {currentUser.avatarUrl ? (
              <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
            ) : (
              currentUser.name.charAt(0)
            )}
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-950 font-display">
              {currentUser.name}
            </h1>
            <p className="text-xs text-neutral-500">
              {currentUser.email} · Member since 2026
            </p>
          </div>
        </div>

        <button
          onClick={() => setCurrentView('orders')}
          className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors self-start sm:self-auto"
        >
          <Package className="w-4 h-4" />
          <span>View My Orders</span>
        </button>
      </div>

      {/* Tabs Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Sidebar Nav */}
        <div className="space-y-1">
          {[
            { id: 'overview', label: 'Overview', icon: LayoutDashboard },
            { id: 'profile', label: 'Personal Information', icon: UserIcon },
            { id: 'addresses', label: 'Saved Addresses', icon: MapPin },
            { id: 'wishlist', label: `Wishlist (${wishlistIds.length})`, icon: Heart },
            { id: 'notifications', label: 'Alerts & Messages', icon: Bell },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setAccountTab(tab.id as any)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-neutral-900 text-white font-semibold shadow-xs'
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Panel */}
        <div className="md:col-span-3 bg-white border border-neutral-200 rounded-2xl p-6 sm:p-8 shadow-xs">
          {/* TAB 0: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-7">
              <div>
                <h3 className="text-base font-bold text-neutral-900 font-display">
                  Account Overview
                </h3>
                <p className="text-xs text-neutral-500">
                  A snapshot of your Aureva activity, orders and lifetime value.
                </p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  {
                    label: 'Total Orders',
                    value: String(orders.length),
                    icon: Package,
                    tone: 'bg-neutral-100 text-neutral-800',
                  },
                  {
                    label: 'In Progress',
                    value: String(readyToShipOrders.length),
                    icon: ArrowRight,
                    tone: 'bg-amber-50 text-amber-700',
                  },
                  {
                    label: 'Delivered',
                    value: String(deliveredOrders.length),
                    icon: CheckCircle2,
                    tone: 'bg-emerald-50 text-emerald-700',
                  },
                  {
                    label: 'Lifetime Spend',
                    value: formatPrice(lifetimeSpend),
                    icon: ShoppingBag,
                    tone: 'bg-[#f6efe8] text-[#965b2a]',
                  },
                ].map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div
                      key={stat.label}
                      className="rounded-xl border border-neutral-200 bg-white p-4"
                    >
                      <div
                        className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg ${stat.tone}`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="text-lg font-bold text-neutral-950 tabular-nums font-display">
                        {stat.value}
                      </div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                        {stat.label}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                    Recent Orders
                  </h4>
                  <button
                    type="button"
                    onClick={() => setCurrentView('orders')}
                    className="text-[11px] font-semibold text-[#965b2a] hover:underline"
                  >
                    View all orders
                  </button>
                </div>

                {isLoadingOrders ? (
                  <div className="py-6 text-center text-xs text-neutral-400">
                    Loading your orders...
                  </div>
                ) : recentOrders.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-6 text-center">
                    <Package className="mx-auto mb-2 h-6 w-6 text-neutral-400" />
                    <p className="text-xs text-neutral-600">
                      You haven't placed an order yet. Explore the collection to get started.
                    </p>
                    <button
                      type="button"
                      onClick={() => setCurrentView('catalog')}
                      className="mt-3 rounded-lg bg-neutral-900 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-800"
                    >
                      Browse the Catalog
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-neutral-100 rounded-xl border border-neutral-200">
                    {recentOrders.map((order) => (
                      <button
                        key={order.id}
                        type="button"
                        onClick={() => {
                          setSelectedOrderId(order.id);
                          setCurrentView('orders');
                        }}
                        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-xs transition-colors hover:bg-neutral-50"
                      >
                        <div>
                          <span className="font-mono font-bold text-neutral-900">
                            {order.orderNumber}
                          </span>
                          <span className="ml-2 text-[10px] text-neutral-400">
                            {new Date(order.createdAt).toLocaleDateString('en-IN')}
                          </span>
                          <div className="mt-0.5 text-[11px] text-neutral-500">
                            {order.items.length} item{order.items.length > 1 ? 's' : ''} ·{' '}
                            {order.paymentMethod}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`hidden sm:inline-flex rounded border px-2 py-0.5 text-[10px] font-semibold ${
                              order.status === 'Delivered'
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                : ['Cancelled', 'Returned'].includes(order.status)
                                ? 'border-neutral-200 bg-neutral-100 text-neutral-600'
                                : 'border-amber-200 bg-amber-50 text-amber-700'
                            }`}
                          >
                            {order.status}
                          </span>
                          <span className="font-bold tabular-nums text-neutral-950">
                            {formatPrice(order.total)}
                          </span>
                          <ArrowRight className="h-3.5 w-3.5 text-neutral-400" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 1: PROFILE */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-neutral-900 font-display">
                  Personal Information
                </h3>
                <p className="text-xs text-neutral-500">
                  Manage your verified client credentials and contact preferences.
                </p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4 max-w-lg text-xs">
                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-neutral-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-neutral-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Primary Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-neutral-900"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold rounded-lg text-xs transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: ADDRESSES */}
          {activeTab === 'addresses' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-neutral-900 font-display">
                    Saved Delivery Addresses
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Manage coordinate presets for instant one-click checkout.
                  </p>
                </div>

                <button
                  onClick={openNewAddress}
                  className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Address</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {currentUser.savedAddresses.map((addr) => (
                  <div
                    key={addr.id}
                    className={`p-4 border rounded-xl relative space-y-2 text-xs ${
                      addr.isDefault ? 'border-neutral-900/30 bg-neutral-50/60' : 'border-neutral-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-bold text-neutral-900 truncate">{addr.fullName}</span>
                        {addr.isDefault && (
                          <span className="shrink-0 rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-700">
                            Default
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => openEditAddress(addr)}
                          className="text-neutral-400 hover:text-neutral-900 transition-colors"
                          title="Edit address"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteAddress(addr.id)}
                          className="text-neutral-400 hover:text-rose-600 transition-colors"
                          title="Delete address"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-neutral-600 leading-relaxed">
                      {addr.street}
                      <br />
                      {addr.city}, {addr.state} {addr.postalCode}
                      <br />
                      {addr.country}
                    </p>

                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-neutral-100">
                      <span className="text-[11px] text-neutral-400 font-mono">
                        {addr.phone}
                      </span>
                      {!addr.isDefault && (
                        <button
                          onClick={() => handleSetDefaultAddress(addr.id)}
                          className="text-[10px] font-semibold text-[#965b2a] hover:underline"
                        >
                          Set as default
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add / Edit Address Modal */}
              {isAddAddressOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <div
                    className="fixed inset-0 bg-neutral-900/50 backdrop-blur-xs"
                    onClick={closeAddressForm}
                  />
                  <div className="relative w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-neutral-200 space-y-4">
                    <h4 className="text-base font-bold text-neutral-900 font-display">
                      {editingAddressId ? 'Edit Shipping Address' : 'Add New Shipping Address'}
                    </h4>

                    <form onSubmit={handleSaveAddress} className="space-y-3 text-xs">
                      <div>
                        <label className="font-bold text-neutral-700 block mb-1">Full Name</label>
                        <input
                          type="text"
                          value={newAddr.fullName}
                          onChange={(e) => setNewAddr({ ...newAddr, fullName: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-neutral-900"
                          required
                        />
                      </div>
                      <div>
                        <label className="font-bold text-neutral-700 block mb-1">Phone</label>
                        <input
                          type="text"
                          value={newAddr.phone}
                          onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-neutral-900"
                          required
                        />
                      </div>
                      <div>
                        <label className="font-bold text-neutral-700 block mb-1">
                          Street Address
                        </label>
                        <input
                          type="text"
                          value={newAddr.street}
                          onChange={(e) => setNewAddr({ ...newAddr, street: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-neutral-900"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="font-bold text-neutral-700 block mb-1">City</label>
                          <input
                            type="text"
                            value={newAddr.city}
                            onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-neutral-900"
                            required
                          />
                        </div>
                        <div>
                          <label className="font-bold text-neutral-700 block mb-1">State</label>
                          <input
                            type="text"
                            value={newAddr.state}
                            onChange={(e) => setNewAddr({ ...newAddr, state: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-neutral-900"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="font-bold text-neutral-700 block mb-1">
                            Postal Code
                          </label>
                          <input
                            type="text"
                            value={newAddr.postalCode}
                            onChange={(e) =>
                              setNewAddr({ ...newAddr, postalCode: e.target.value })
                            }
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-neutral-900"
                            required
                          />
                        </div>
                        <div>
                          <label className="font-bold text-neutral-700 block mb-1">Country</label>
                          <input
                            type="text"
                            value={newAddr.country}
                            onChange={(e) => setNewAddr({ ...newAddr, country: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-neutral-900"
                            required
                          />
                        </div>
                      </div>

                      <label className="flex items-center gap-2 pt-1 cursor-pointer text-xs text-neutral-700 select-none">
                        <input
                          type="checkbox"
                          checked={Boolean(newAddr.isDefault)}
                          onChange={(e) =>
                            setNewAddr({ ...newAddr, isDefault: e.target.checked })
                          }
                          className="w-4 h-4 rounded border-neutral-300"
                        />
                        <span>Set as default delivery address</span>
                      </label>

                      <div className="flex justify-end gap-2 pt-3">
                        <button
                          type="button"
                          onClick={closeAddressForm}
                          className="px-4 py-2 text-neutral-600 font-semibold"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-neutral-900 text-white font-bold rounded-lg"
                        >
                          {editingAddressId ? 'Update Address' : 'Save Address'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: WISHLIST */}
          {activeTab === 'wishlist' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-neutral-900 font-display">
                  Saved Pieces ({wishlistProducts.length})
                </h3>
                <p className="text-xs text-neutral-500">
                  Curate your desired models for allocation and purchase.
                </p>
              </div>

              {wishlistProducts.length === 0 ? (
                <div className="text-center py-12 text-xs text-neutral-500">
                  Your wishlist is empty. Tap the heart icon on any product to save it here.
                </div>
              ) : (
                <div className="divide-y divide-neutral-100">
                  {wishlistProducts.map((p) => (
                    <div key={p.id} className="py-4 flex items-center justify-between gap-4 text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 rounded-xl bg-neutral-100 overflow-hidden shrink-0 border border-neutral-200/60">
                          <ProductImage
                            src={p.thumbnail || p.images[0]}
                            alt={p.name}
                            aspectRatio="square"
                          />
                        </div>
                        <div>
                          <div className="text-[10px] text-neutral-400 font-semibold uppercase">
                            {p.brand}
                          </div>
                          <h4
                            onClick={() => navigateToProduct(p.id)}
                            className="font-bold text-neutral-900 hover:underline cursor-pointer"
                          >
                            {p.name}
                          </h4>
                          <span className="font-bold text-neutral-900 tabular-nums">
                            {formatPrice(p.basePrice)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            addToCart(p, p.variants[0], 1);
                            toggleWishlist(p.id);
                          }}
                          className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Move to Bag</span>
                        </button>
                        <button
                          onClick={() => toggleWishlist(p.id)}
                          className="p-2 text-neutral-400 hover:text-rose-600 transition-colors"
                          title="Remove from wishlist"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {wishlistRecommendations.length > 0 && (
                <div className="space-y-3 pt-6 border-t border-neutral-100">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                      Complete Your Collection
                    </h4>
                    <p className="text-[11px] text-neutral-500">
                      Picked to complement the pieces you have saved.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {wishlistRecommendations.map((p) => (
                      <div
                        key={p.id}
                        className="flex gap-3 rounded-xl border border-neutral-200 p-3"
                      >
                        <button
                          type="button"
                          onClick={() => navigateToProduct(p.id)}
                          className="w-16 h-16 rounded-lg bg-neutral-100 overflow-hidden shrink-0 border border-neutral-200/60"
                        >
                          <ProductImage
                            src={p.thumbnail || p.images[0]}
                            alt={p.name}
                            aspectRatio="square"
                          />
                        </button>
                        <div className="min-w-0 flex-1">
                          <div className="text-[9px] font-semibold uppercase tracking-wider text-neutral-400">
                            {p.brand}
                          </div>
                          <button
                            type="button"
                            onClick={() => navigateToProduct(p.id)}
                            className="block truncate text-left text-[11px] font-bold text-neutral-900 hover:underline"
                          >
                            {p.name}
                          </button>
                          <div className="mt-0.5 flex items-center justify-between gap-2">
                            <span className="text-[11px] font-bold tabular-nums text-neutral-900">
                              {formatPrice(p.basePrice)}
                            </span>
                            <button
                              type="button"
                              onClick={() => addToCart(p, p.variants[0], 1)}
                              className="rounded-lg bg-neutral-900 px-2.5 py-1.5 text-[10px] font-semibold text-white hover:bg-neutral-800"
                            >
                              Add to Bag
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="space-y-4 text-xs">
              <div>
                <h3 className="text-base font-bold text-neutral-900 font-display">
                  Notifications & Dispatch Dispatches
                </h3>
                <p className="text-xs text-neutral-500">
                  Stay updated on batch releases and order status updates.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-neutral-900">Package Dispatched: ORD-2026-9041</span>
                    <span className="text-[11px] text-neutral-400">Today, 08:00 AM</span>
                  </div>
                  <p className="text-neutral-600 leading-relaxed">
                    Your Aureva Studio ANC Over-Ear Headphones have dispatched via Blue Dart Priority.
                  </p>
                </div>

                <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-neutral-900">VIP Invitation Code Active</span>
                    <span className="text-[11px] text-neutral-400">2 days ago</span>
                  </div>
                  <p className="text-neutral-600 leading-relaxed">
                    Use code <strong>AUREVA15</strong> at checkout to redeem 15% off orders over ₹2,000.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
