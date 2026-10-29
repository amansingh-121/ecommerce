import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  ShoppingBag,
  Heart,
  User as UserIcon,
  Sparkles,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';
import { useStore } from '../context/StoreContext.tsx';
import { formatPrice } from '../utils/currency.ts';

export const Header: React.FC = () => {
  const {
    currentView,
    setCurrentView,
    cart,
    wishlistIds,
    setIsCartDrawerOpen,
    setIsConciergeOpen,
    currentUser,
    switchUserRole,
    setAccountTab,
    searchQuery,
    setSearchQuery,
    navigateToCategory,
    navigateToProduct,
    setSelectedCategory,
    products,
  } = useStore();

  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Search matches
  const searchResults = searchQuery.trim()
    ? products
        .filter(
          (p) =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
        )
        .slice(0, 5)
    : [];

  // Click outside to close search popover
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsSearchDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCategoryNav = (cat: string) => {
    if (cat === 'all') {
      setSelectedCategory('all');
      setCurrentView('catalog');
    } else {
      navigateToCategory(cat);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsMobileMenuOpen(false);
  };

  const navCategories = ['Electronics', 'Fashion', 'Home', 'Beauty', 'Sports'];

  return (
    <>
      {/* Top Demo & Announcement Bar */}
      <div className="bg-[#111111] text-neutral-300 text-xs py-1.5 px-4 border-b border-neutral-800 font-sans">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="truncate text-[11px] text-neutral-300 tracking-wide">
            <span>FREE standard shipping over ₹2,999 · Extra 10% off with code </span>
            <span className="font-mono text-amber-400 font-bold">AUREVA10</span>
          </div>

          <div className="flex items-center gap-3 shrink-0 text-[11px]">
            {/* Quick Demo Switcher */}
            <div className="flex items-center gap-1 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800 text-neutral-300">
              <span className="text-neutral-500 hidden sm:inline">Role:</span>
              <button
                type="button"
                onClick={() => switchUserRole('customer')}
                className={`px-1.5 py-0.5 rounded transition-colors text-[10px] ${
                  currentUser.role === 'customer'
                    ? 'bg-neutral-800 text-white font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Customer
              </button>
              <span className="text-neutral-700">|</span>
              <button
                type="button"
                onClick={() => switchUserRole('admin')}
                className={`px-1.5 py-0.5 rounded transition-colors text-[10px] ${
                  currentUser.role === 'admin'
                    ? 'bg-neutral-800 text-white font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Admin
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-40 bg-white/98 backdrop-blur-md border-b border-neutral-200 transition-all font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[4.5rem] flex items-center justify-between gap-4 lg:gap-6">
          
          {/* Left: Aureva. Logo */}
          <div className="flex items-center gap-4 shrink-0">
            <button
              type="button"
              onClick={() => {
                setCurrentView('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-neutral-950 hover:opacity-90 transition-opacity"
            >
              Aureva<span className="text-[#c2834f]">.</span>
            </button>
          </div>

          {/* Categories Navigation */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8 text-sm font-medium text-neutral-700 shrink-0">
            {navCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => handleCategoryNav(cat)}
                className="hover:text-neutral-950 transition-colors whitespace-nowrap"
              >
                {cat}
              </button>
            ))}
          </nav>

          {/* Center Prominent Search Bar */}
          <div className="flex-1 max-w-md mx-2 sm:mx-4 relative" ref={searchContainerRef}>
            <div className="relative flex items-center">
              <Search className="absolute left-3.5 w-4 h-4 text-neutral-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search for headphones, sneakers, vases..."
                value={searchQuery}
                onFocus={() => setIsSearchDropdownOpen(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchDropdownOpen(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setCurrentView('catalog');
                    setIsSearchDropdownOpen(false);
                  }
                }}
                className="w-full pl-10 pr-9 py-2 text-xs sm:text-sm bg-neutral-50/80 border border-neutral-200 rounded-lg focus:bg-white focus:border-neutral-400 focus:outline-none transition-colors placeholder:text-neutral-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 text-neutral-400 hover:text-neutral-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Autocomplete Dropdown */}
            {isSearchDropdownOpen && searchQuery.trim() && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-2xl border border-neutral-200 p-2.5 z-50 animate-in fade-in slide-in-from-top-1">
                {searchResults.length > 0 ? (
                  <div className="space-y-1">
                    <div className="text-[10px] uppercase font-semibold text-neutral-400 px-2 py-1 tracking-wider">
                      Matching Products
                    </div>
                    {searchResults.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => {
                          navigateToProduct(product.id);
                          setIsSearchDropdownOpen(false);
                          setSearchQuery('');
                        }}
                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-50 text-left transition-colors group"
                      >
                        <img
                          src={product.thumbnail || product.images[0]}
                          alt={product.name}
                          className="w-9 h-9 object-cover rounded border border-neutral-200 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-neutral-900 truncate group-hover:text-amber-800">
                            {product.name}
                          </p>
                          <p className="text-[11px] text-neutral-500 font-mono">
                            {formatPrice(product.basePrice)}
                          </p>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    ))}
                    <div className="pt-2 border-t border-neutral-100 px-2 flex justify-between items-center text-xs text-neutral-500">
                      <span>Press enter to see all results</span>
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentView('catalog');
                          setIsSearchDropdownOpen(false);
                        }}
                        className="text-amber-800 font-semibold hover:underline"
                      >
                        View all
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 text-center text-xs text-neutral-500">
                    No products found for "{searchQuery}". Try searching for audio, jacket, lamp, or tennis.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Style Concierge Pill Button */}
            <button
              type="button"
              onClick={() => setIsConciergeOpen(true)}
              className="px-3.5 py-1.5 rounded-full border border-amber-600/40 bg-amber-50/50 hover:bg-amber-100/70 text-amber-900 text-xs font-medium flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline">Style Concierge</span>
            </button>

            {/* Wishlist Heart Icon */}
            <button
              type="button"
              onClick={() => {
                setAccountTab('wishlist');
                setCurrentView('profile');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="p-2 text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100 rounded-lg transition-colors relative"
              aria-label="Wishlist"
            >
              <Heart className="w-5 h-5 stroke-[1.75]" />
              {wishlistIds.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-700 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {wishlistIds.length}
                </span>
              )}
            </button>

            {/* Shopping Bag Icon with count badge */}
            <button
              type="button"
              onClick={() => setIsCartDrawerOpen(true)}
              className="p-2 text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100 rounded-lg transition-colors relative"
              aria-label="Shopping bag"
            >
              <ShoppingBag className="w-5 h-5 stroke-[1.75]" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-neutral-950 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </button>

            {/* User Account Icon */}
            <button
              type="button"
              onClick={() => {
                if (currentUser.role === 'admin') {
                  setCurrentView('admin');
                } else {
                  setAccountTab('profile');
                  setCurrentView('profile');
                }
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="p-2 text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100 rounded-lg transition-colors"
              aria-label="Account"
            >
              <UserIcon className="w-5 h-5 stroke-[1.75]" />
            </button>

            {/* Mobile Hamburger Menu */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100 rounded-lg lg:hidden transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-neutral-200 bg-white px-4 py-4 space-y-3 animate-in slide-in-from-top-2">
            <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
              Categories
            </div>
            <div className="grid grid-cols-2 gap-2">
              {navCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleCategoryNav(cat)}
                  className="px-3 py-2 text-xs font-medium text-neutral-800 bg-neutral-50 rounded-lg hover:bg-neutral-100 text-left transition-colors"
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-neutral-100 flex flex-col gap-2 text-xs font-medium text-neutral-700">
              <button
                type="button"
                onClick={() => {
                  setCurrentView('orders');
                  setIsMobileMenuOpen(false);
                }}
                className="py-1.5 text-left hover:text-neutral-950"
              >
                Track Orders
              </button>
              <button
                type="button"
                onClick={() => {
                  setAccountTab('profile');
                  setCurrentView('profile');
                  setIsMobileMenuOpen(false);
                }}
                className="py-1.5 text-left hover:text-neutral-950"
              >
                My Account
              </button>
            </div>
          </div>
        )}
      </header>
    </>
  );
};
