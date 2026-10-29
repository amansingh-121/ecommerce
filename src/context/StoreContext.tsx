import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Product,
  Category,
  CartItem,
  Coupon,
  User,
  Order,
  ProductVariant,
} from '../types/ecommerce.ts';
import { calculateOrderPricing, OrderPricingSummary } from '../utils/cart-calculator.ts';
import { formatPrice } from '../utils/currency.ts';

export type AppView =
  | 'home'
  | 'catalog'
  | 'product-detail'
  | 'cart'
  | 'checkout'
  | 'orders'
  | 'profile'
  | 'admin';

export type AccountTab = 'overview' | 'profile' | 'addresses' | 'wishlist' | 'notifications';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface StoreContextType {
  // Navigation & Views
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  selectedProductId: string | null;
  setSelectedProductId: (id: string | null) => void;
  selectedOrderId: string | null;
  setSelectedOrderId: (id: string | null) => void;
  navigateToProduct: (idOrSlug: string) => void;
  navigateToCategory: (categoryName: string) => void;

  // Catalog State
  products: Product[];
  categories: Category[];
  isLoadingCatalog: boolean;
  refreshProducts: () => Promise<void>;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;

  // Cart State & Operations
  cart: CartItem[];
  addToCart: (product: Product, variant?: ProductVariant, quantity?: number) => void;
  removeFromCart: (cartItemId: string) => void;
  updateCartQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  isCartDrawerOpen: boolean;
  setIsCartDrawerOpen: (open: boolean) => void;

  // Coupons & Pricing
  appliedCoupon: Coupon | null;
  applyCouponCode: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;
  deliveryMethod: 'standard' | 'express';
  setDeliveryMethod: (method: 'standard' | 'express') => void;
  pricing: OrderPricingSummary;

  // Wishlist
  wishlistIds: string[];
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;

  // Auth / User
  currentUser: User;
  switchUserRole: (role: 'customer' | 'admin') => void;
  updateUserProfile: (updates: Partial<User>) => void;
  accountTab: AccountTab;
  setAccountTab: (tab: AccountTab) => void;

  // Modals & Assistant
  isConciergeOpen: boolean;
  setIsConciergeOpen: (open: boolean) => void;
  quickViewProduct: Product | null;
  setQuickViewProduct: (prod: Product | null) => void;

  // Toasts
  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const DEFAULT_CUSTOMER: User = {
  id: 'usr-alex',
  name: 'Alex Thorne',
  email: 'alex@aureva.com',
  phone: '+91 98200 12345',
  role: 'customer',
  avatarUrl: '/images/1534528741775-53994a69daeb.jpg',
  savedAddresses: [
    {
      id: 'addr-default-1',
      fullName: 'Alex Thorne',
      phone: '+91 98200 12345',
      street: 'Bandra Kurla Complex, Unit 1204',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400051',
      country: 'India',
      isDefault: true,
    },
  ],
  createdAt: '2026-01-01T00:00:00Z',
};

const DEFAULT_ADMIN: User = {
  id: 'usr-admin-1',
  name: 'Eleanor Vance',
  email: 'admin@aureva.com',
  phone: '+91 98111 77788',
  role: 'admin',
  avatarUrl: '/images/1580489944761-15a19d654956.jpg',
  savedAddresses: [],
  createdAt: '2026-01-01T00:00:00Z',
};

import { INITIAL_PRODUCTS, INITIAL_CATEGORIES } from '../data/initialCatalog.ts';

function readStoredValue<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isConciergeOpen, setIsConciergeOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  const [deliveryMethod, setDeliveryMethod] = useState<'standard' | 'express'>('standard');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  const [currentUser, setCurrentUser] = useState<User>(() =>
    readStoredValue('aureva_user', DEFAULT_CUSTOMER)
  );
  const [accountTab, setAccountTab] = useState<AccountTab>('overview');

  const [wishlistIds, setWishlistIds] = useState<string[]>(() =>
    readStoredValue('aureva_wishlist', ['prod-elec-5', 'prod-elec-3'])
  );

  const [cart, setCart] = useState<CartItem[]>(() =>
    readStoredValue('aureva_cart', [])
  );

  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem('aureva_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('aureva_wishlist', JSON.stringify(wishlistIds));
  }, [wishlistIds]);

  useEffect(() => {
    localStorage.setItem('aureva_user', JSON.stringify(currentUser));
  }, [currentUser]);

  // Load products and categories from backend
  const fetchCatalog = async () => {
    try {
      setIsLoadingCatalog(true);
      const [prodsRes, catsRes] = await Promise.all([
        fetch('/api/products?limit=50'),
        fetch('/api/categories'),
      ]);

      if (prodsRes.ok) {
        const pData = await prodsRes.json();
        setProducts(pData.products || []);
      }
      if (catsRes.ok) {
        const cData = await catsRes.json();
        setCategories(cData.categories || []);
      }
    } catch (err) {
      console.error('Failed to fetch catalog from backend:', err);
    } finally {
      setIsLoadingCatalog(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  // Compute pricing
  const pricing = calculateOrderPricing(cart, deliveryMethod, appliedCoupon);

  // Cart actions
  const addToCart = (product: Product, variant?: ProductVariant, quantity = 1) => {
    setCart((prev) => {
      const lineId = variant ? `${product.id}-${variant.id}` : product.id;
      const existingIdx = prev.findIndex((item) => item.id === lineId);
      const unitPrice = variant
        ? product.basePrice + variant.priceModifier
        : product.basePrice;

      if (existingIdx !== -1) {
        const updated = [...prev];
        updated[existingIdx].quantity += quantity;
        return updated;
      } else {
        const newItem: CartItem = {
          id: lineId,
          productId: product.id,
          product,
          variantId: variant?.id,
          variantName: variant?.name,
          unitPrice,
          quantity,
          selectedColor: variant?.color,
          selectedSize: variant?.size,
        };
        return [...prev, newItem];
      }
    });

    showToast(`Added "${product.name}" to bag`);
    setIsCartDrawerOpen(true);
  };

  const removeFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== cartItemId));
    showToast('Item removed from shopping bag', 'info');
  };

  const updateCartQuantity = (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.id === cartItemId ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
  };

  const applyCouponCode = async (
    code: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotal: pricing.subtotal }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.error || 'Invalid coupon code.' };
      }
      setAppliedCoupon(data.coupon);
      showToast(`Coupon "${data.coupon.code}" applied: ${formatPrice(data.discountAmount)} off!`);
      return { success: true, message: `Saved ${formatPrice(data.discountAmount)}!` };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to validate coupon' };
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    showToast('Coupon removed', 'info');
  };

  // Wishlist actions
  const toggleWishlist = (productId: string) => {
    setWishlistIds((prev) => {
      const exists = prev.includes(productId);
      if (exists) {
        showToast('Removed from your wishlist', 'info');
        return prev.filter((id) => id !== productId);
      } else {
        showToast('Saved to your wishlist');
        return [...prev, productId];
      }
    });
  };

  const isInWishlist = (productId: string) => wishlistIds.includes(productId);

  // User switch
  const switchUserRole = (role: 'customer' | 'admin') => {
    if (role === 'admin') {
      setCurrentUser(DEFAULT_ADMIN);
      setCurrentView('admin');
      showToast('Switched to Administrator session');
    } else {
      setCurrentUser(DEFAULT_CUSTOMER);
      setCurrentView('home');
      showToast('Switched to Customer account');
    }
  };

  const updateUserProfile = (updates: Partial<User>) => {
    setCurrentUser((prev) => ({ ...prev, ...updates }));
    showToast('Profile updated successfully');
  };

  // Navigation helpers
  const navigateToProduct = (idOrSlug: string) => {
    setSelectedProductId(idOrSlug);
    setCurrentView('product-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToCategory = (catName: string) => {
    setSelectedCategory(catName);
    setCurrentView('catalog');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <StoreContext.Provider
      value={{
        currentView,
        setCurrentView,
        selectedProductId,
        setSelectedProductId,
        selectedOrderId,
        setSelectedOrderId,
        navigateToProduct,
        navigateToCategory,
        products,
        categories,
        isLoadingCatalog,
        refreshProducts: fetchCatalog,
        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory,
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        isCartDrawerOpen,
        setIsCartDrawerOpen,
        appliedCoupon,
        applyCouponCode,
        removeCoupon,
        deliveryMethod,
        setDeliveryMethod,
        pricing,
        wishlistIds,
        toggleWishlist,
        isInWishlist,
        currentUser,
        switchUserRole,
        updateUserProfile,
        accountTab,
        setAccountTab,
        isConciergeOpen,
        setIsConciergeOpen,
        quickViewProduct,
        setQuickViewProduct,
        toasts,
        showToast,
      }}
    >
      {children}

      {/* Floating Toast notification container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto px-4 py-3 rounded-lg shadow-lg text-sm font-medium border flex items-center gap-3 transition-all transform animate-in fade-in slide-in-from-bottom-2 duration-200 ${
              toast.type === 'error'
                ? 'bg-rose-900 text-white border-rose-800'
                : toast.type === 'info'
                ? 'bg-neutral-900 text-white border-neutral-800'
                : 'bg-neutral-900 text-white border-neutral-800'
            }`}
          >
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
