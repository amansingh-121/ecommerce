import React, { useState } from 'react';
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
} from 'lucide-react';
import { useStore } from '../context/StoreContext.tsx';
import { Address } from '../types/ecommerce.ts';
import { ProductImage } from '../components/ProductImage.tsx';
import { formatPrice } from '../utils/currency.ts';

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
  } = useStore();

  const activeTab = accountTab;

  // Edit profile state
  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [phone, setPhone] = useState(currentUser.phone || '');

  // Add address modal
  const [isAddAddressOpen, setIsAddAddressOpen] = useState(false);
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

  const wishlistProducts = products.filter((p) => wishlistIds.includes(p.id));

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({ name, email, phone });
  };

  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddr.street || !newAddr.city) return;

    const created: Address = {
      ...newAddr,
      id: `addr-${Date.now()}`,
    };

    updateUserProfile({
      savedAddresses: [...currentUser.savedAddresses, created],
    });
    setIsAddAddressOpen(false);
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
    showToast('New shipping address saved');
  };

  const handleDeleteAddress = (id: string) => {
    updateUserProfile({
      savedAddresses: currentUser.savedAddresses.filter((a) => a.id !== id),
    });
    showToast('Address removed', 'info');
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
                  onClick={() => setIsAddAddressOpen(true)}
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
                    className="p-4 border border-neutral-200 rounded-xl relative space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-neutral-900">{addr.fullName}</span>
                      <button
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="text-neutral-400 hover:text-rose-600 transition-colors"
                        title="Delete address"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-neutral-600 leading-relaxed">
                      {addr.street}
                      <br />
                      {addr.city}, {addr.state} {addr.postalCode}
                      <br />
                      {addr.country}
                    </p>

                    <div className="text-[11px] text-neutral-400 font-mono">
                      Phone: {addr.phone}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Address Modal */}
              {isAddAddressOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <div
                    className="fixed inset-0 bg-neutral-900/50 backdrop-blur-xs"
                    onClick={() => setIsAddAddressOpen(false)}
                  />
                  <div className="relative w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-neutral-200 space-y-4">
                    <h4 className="text-base font-bold text-neutral-900 font-display">
                      Add New Shipping Address
                    </h4>

                    <form onSubmit={handleAddAddress} className="space-y-3 text-xs">
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

                      <div className="flex justify-end gap-2 pt-3">
                        <button
                          type="button"
                          onClick={() => setIsAddAddressOpen(false)}
                          className="px-4 py-2 text-neutral-600 font-semibold"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-neutral-900 text-white font-bold rounded-lg"
                        >
                          Save Address
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
