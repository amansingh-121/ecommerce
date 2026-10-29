import React, { useState, useMemo } from 'react';
import {
  SlidersHorizontal,
  ChevronDown,
  X,
  RotateCcw,
  Star,
  Check,
} from 'lucide-react';
import { useStore } from '../context/StoreContext.tsx';
import { ProductCard } from '../components/ProductCard.tsx';

const SUBCATEGORIES_BY_CATEGORY: Record<string, string[]> = {
  Electronics: ['Headphones', 'Smart Watches', 'Speakers'],
  Fashion: ['Bags & Totes', 'Apparel', 'Eyewear'],
  Home: ['Vases & Planters', 'Candles', 'Tableware'],
  Beauty: ['Skincare', 'Fragrance', 'Rituals'],
  Sports: ['Yoga', 'Strength'],
};

export const CatalogPage: React.FC = () => {
  const {
    products,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    setCurrentView,
  } = useStore();

  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');
  const [minPriceInput, setMinPriceInput] = useState<string>('');
  const [maxPriceInput, setMaxPriceInput] = useState<string>('');
  const [minRating, setMinRating] = useState<number>(0);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [minDiscount, setMinDiscount] = useState<number>(0);
  const [sortOption, setSortOption] = useState<
    'recommended' | 'price-asc' | 'price-desc' | 'rating' | 'newest'
  >('recommended');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const categoriesList = ['All Products', 'Electronics', 'Fashion', 'Home', 'Beauty', 'Sports'];

  const handlePricePill = (min: number | null, max: number | null) => {
    setMinPriceInput(min !== null ? String(min) : '');
    setMaxPriceInput(max !== null ? String(max) : '');
  };

  const handleCategorySelect = (cat: string) => {
    if (cat === 'All Products') {
      setSelectedCategory('all');
    } else {
      setSelectedCategory(cat);
    }
    setSelectedSubcategory('all');
  };

  // Dynamic count for each category
  const getCategoryCount = (cat: string) => {
    if (cat === 'All Products') return products.length;
    return products.filter(
      (p) =>
        p.category.toLowerCase() === cat.toLowerCase() ||
        p.category.toLowerCase().includes(cat.toLowerCase())
    ).length;
  };

  // Current available subcategories
  const activeSubcategories = useMemo(() => {
    if (selectedCategory === 'all') {
      return [];
    }
    const matchedKey = Object.keys(SUBCATEGORIES_BY_CATEGORY).find(
      (k) => k.toLowerCase() === selectedCategory.toLowerCase()
    );
    return matchedKey ? SUBCATEGORIES_BY_CATEGORY[matchedKey] : [];
  }, [selectedCategory]);

  // Filter & sort products
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.subcategory?.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Category
    if (selectedCategory !== 'all') {
      const catLower = selectedCategory.toLowerCase();
      result = result.filter(
        (p) =>
          p.category.toLowerCase() === catLower ||
          p.category.toLowerCase().includes(catLower) ||
          catLower.includes(p.category.toLowerCase()) ||
          p.slug.toLowerCase().includes(catLower)
      );
    }

    // Subcategory
    if (selectedSubcategory !== 'all') {
      const subLower = selectedSubcategory.toLowerCase();
      result = result.filter(
        (p) =>
          p.subcategory.toLowerCase() === subLower ||
          p.subcategory.toLowerCase().includes(subLower)
      );
    }

    // Price Filters
    const minVal = minPriceInput ? parseFloat(minPriceInput) : null;
    const maxVal = maxPriceInput ? parseFloat(maxPriceInput) : null;
    if (minVal !== null && !isNaN(minVal)) {
      result = result.filter((p) => p.basePrice >= minVal);
    }
    if (maxVal !== null && !isNaN(maxVal)) {
      result = result.filter((p) => p.basePrice <= maxVal);
    }

    // Rating
    if (minRating > 0) {
      result = result.filter((p) => p.rating >= minRating);
    }

    // In Stock
    if (inStockOnly) {
      result = result.filter((p) => p.inStock && p.totalStock > 0);
    }

    // Discount
    if (minDiscount > 0) {
      result = result.filter((p) => p.discountPercentage >= minDiscount);
    }

    // Sort
    switch (sortOption) {
      case 'price-asc':
        result.sort((a, b) => a.basePrice - b.basePrice);
        break;
      case 'price-desc':
        result.sort((a, b) => b.basePrice - a.basePrice);
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
        result.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case 'recommended':
      default:
        result.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
        break;
    }

    return result;
  }, [
    products,
    searchQuery,
    selectedCategory,
    selectedSubcategory,
    minPriceInput,
    maxPriceInput,
    minRating,
    inStockOnly,
    minDiscount,
    sortOption,
  ]);

  const resetFilters = () => {
    setSelectedCategory('all');
    setSelectedSubcategory('all');
    setMinPriceInput('');
    setMaxPriceInput('');
    setMinRating(0);
    setInStockOnly(false);
    setMinDiscount(0);
    setSearchQuery('');
    setSortOption('recommended');
  };

  const hasActiveFilters =
    selectedCategory !== 'all' ||
    selectedSubcategory !== 'all' ||
    Boolean(minPriceInput) ||
    Boolean(maxPriceInput) ||
    minRating > 0 ||
    inStockOnly ||
    minDiscount > 0 ||
    Boolean(searchQuery);

  const FilterSidebarContent = (
    <div className="space-y-6 text-xs font-sans">
      
      {/* 1. CATEGORY */}
      <div className="space-y-3">
        <h4 className="text-[11px] font-mono font-bold tracking-widest text-[#c2834f] uppercase">
          CATEGORY
        </h4>
        <div className="space-y-1.5">
          {categoriesList.map((cat) => {
            const isSelected =
              (cat === 'All Products' && selectedCategory === 'all') ||
              selectedCategory.toLowerCase() === cat.toLowerCase();
            const count = getCategoryCount(cat);
            const label = cat === 'All Products' ? 'All Products' : `${cat} (${count})`;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => handleCategorySelect(cat)}
                className={`w-full text-left py-1 text-xs transition-colors flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? 'font-bold text-[#965b2a] text-sm'
                    : 'text-neutral-600 hover:text-neutral-950 font-normal'
                }`}
              >
                <span>{label}</span>
                {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#965b2a]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 1.5 SUBCATEGORY */}
      {activeSubcategories.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-neutral-100">
          <h4 className="text-[11px] font-mono font-bold tracking-widest text-[#c2834f] uppercase">
            SUBCATEGORY
          </h4>
          <div className="space-y-1.5">
            {activeSubcategories.map((subcat) => {
              const isSelected = selectedSubcategory.toLowerCase() === subcat.toLowerCase();
              return (
                <button
                  key={subcat}
                  type="button"
                  onClick={() => setSelectedSubcategory(isSelected ? 'all' : subcat)}
                  className={`w-full text-left py-1 text-xs transition-colors flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'font-bold text-neutral-950 text-sm'
                      : 'text-neutral-600 hover:text-neutral-950 font-normal'
                  }`}
                >
                  <span>{subcat}</span>
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-neutral-900" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. PRICE */}
      <div className="space-y-3 pt-4 border-t border-neutral-100">
        <h4 className="text-[11px] font-mono font-bold tracking-widest text-[#c2834f] uppercase">
          PRICE
        </h4>
        
        {/* Min - Max Inputs */}
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={minPriceInput}
            onChange={(e) => setMinPriceInput(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-white border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-400 placeholder:text-neutral-400"
          />
          <span className="text-neutral-400">—</span>
          <input
            type="number"
            placeholder="Max"
            value={maxPriceInput}
            onChange={(e) => setMaxPriceInput(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-white border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-400 placeholder:text-neutral-400"
          />
        </div>

        {/* Quick Price Pills */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          <button
            type="button"
            onClick={() => handlePricePill(0, 2000)}
            className={`px-2.5 py-1.5 rounded-full border text-[11px] transition-colors cursor-pointer ${
              minPriceInput === '0' && maxPriceInput === '2000'
                ? 'bg-neutral-900 text-white border-neutral-900'
                : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:border-neutral-300'
            }`}
          >
            Under ₹2,000
          </button>
          <button
            type="button"
            onClick={() => handlePricePill(2000, 3500)}
            className={`px-2.5 py-1.5 rounded-full border text-[11px] transition-colors cursor-pointer ${
              minPriceInput === '2000' && maxPriceInput === '3500'
                ? 'bg-neutral-900 text-white border-neutral-900'
                : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:border-neutral-300'
            }`}
          >
            ₹2,000 – ₹3,500
          </button>
          <button
            type="button"
            onClick={() => handlePricePill(3500, 6000)}
            className={`px-2.5 py-1.5 rounded-full border text-[11px] transition-colors cursor-pointer ${
              minPriceInput === '3500' && maxPriceInput === '6000'
                ? 'bg-neutral-900 text-white border-neutral-900'
                : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:border-neutral-300'
            }`}
          >
            ₹3,500 – ₹6,000
          </button>
          <button
            type="button"
            onClick={() => handlePricePill(6000, null)}
            className={`px-2.5 py-1.5 rounded-full border text-[11px] transition-colors cursor-pointer ${
              minPriceInput === '6000' && !maxPriceInput
                ? 'bg-neutral-900 text-white border-neutral-900'
                : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:border-neutral-300'
            }`}
          >
            Above ₹6,000
          </button>
        </div>
      </div>

      {/* 3. CUSTOMER RATING */}
      <div className="space-y-3 pt-4 border-t border-neutral-100">
        <h4 className="text-[11px] font-mono font-bold tracking-widest text-[#c2834f] uppercase">
          CUSTOMER RATING
        </h4>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setMinRating(minRating === 4 ? 0 : 4)}
            className={`px-3 py-1.5 rounded-full border text-[11px] transition-colors flex items-center gap-1.5 cursor-pointer ${
              minRating === 4
                ? 'bg-neutral-900 text-white border-neutral-900'
                : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:border-neutral-300'
            }`}
          >
            <Star className="w-3 h-3 fill-amber-400 stroke-amber-400" />
            <span>4★ & above</span>
          </button>
          <button
            type="button"
            onClick={() => setMinRating(minRating === 3 ? 0 : 3)}
            className={`px-3 py-1.5 rounded-full border text-[11px] transition-colors flex items-center gap-1.5 cursor-pointer ${
              minRating === 3
                ? 'bg-neutral-900 text-white border-neutral-900'
                : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:border-neutral-300'
            }`}
          >
            <Star className="w-3 h-3 fill-amber-400 stroke-amber-400" />
            <span>3★ & above</span>
          </button>
        </div>
      </div>

      {/* 4. DISCOUNT & AVAILABILITY */}
      <div className="space-y-3 pt-4 border-t border-neutral-100">
        <h4 className="text-[11px] font-mono font-bold tracking-widest text-[#c2834f] uppercase">
          DISCOUNT & AVAILABILITY
        </h4>
        
        {/* In stock checkbox */}
        <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-700 select-none">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => setInStockOnly(e.target.checked)}
            className="w-4 h-4 rounded border-neutral-300 text-neutral-900 focus:ring-0"
          />
          <span>In stock only</span>
        </label>

        {/* Discount Chips */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          <button
            type="button"
            onClick={() => setMinDiscount(minDiscount === 10 ? 0 : 10)}
            className={`px-2.5 py-1.5 rounded-full border text-[11px] transition-colors cursor-pointer ${
              minDiscount === 10
                ? 'bg-neutral-900 text-white border-neutral-900'
                : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:border-neutral-300'
            }`}
          >
            10% off or more
          </button>
          <button
            type="button"
            onClick={() => setMinDiscount(minDiscount === 25 ? 0 : 25)}
            className={`px-2.5 py-1.5 rounded-full border text-[11px] transition-colors cursor-pointer ${
              minDiscount === 25
                ? 'bg-neutral-900 text-white border-neutral-900'
                : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:border-neutral-300'
            }`}
          >
            25% off or more
          </button>
          <button
            type="button"
            onClick={() => setMinDiscount(minDiscount === 35 ? 0 : 35)}
            className={`px-2.5 py-1.5 rounded-full border text-[11px] transition-colors cursor-pointer ${
              minDiscount === 35
                ? 'bg-neutral-900 text-white border-neutral-900'
                : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:border-neutral-300'
            }`}
          >
            35% off or more
          </button>
        </div>
      </div>

      {/* Reset Filter Button */}
      {hasActiveFilters && (
        <div className="pt-4 border-t border-neutral-100">
          <button
            type="button"
            onClick={resetFilters}
            className="w-full py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear All Filters</span>
          </button>
        </div>
      )}

    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
      
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-neutral-500 mb-4" aria-label="Breadcrumb">
        <button
          type="button"
          onClick={() => {
            setCurrentView('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="hover:text-neutral-900 transition-colors cursor-pointer"
        >
          Home
        </button>
        <span className="text-neutral-400">›</span>
        <button
          type="button"
          onClick={() => {
            setSelectedCategory('all');
            setSelectedSubcategory('all');
          }}
          className="hover:text-neutral-900 transition-colors cursor-pointer"
        >
          Shop
        </button>
        {selectedCategory !== 'all' && (
          <>
            <span className="text-neutral-400">›</span>
            <span className="text-neutral-900 font-medium capitalize">
              {selectedCategory}
            </span>
          </>
        )}
        {selectedSubcategory !== 'all' && (
          <>
            <span className="text-neutral-400">›</span>
            <span className="text-neutral-900 font-semibold">
              {selectedSubcategory}
            </span>
          </>
        )}
      </nav>

      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-neutral-200">
        <div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-neutral-950 tracking-tight">
            {selectedCategory === 'all' ? 'All Products' : selectedCategory}
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Showing {filteredProducts.length} of {products.length} products
          </p>
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-3">
          {/* Mobile Filter Toggle */}
          <button
            type="button"
            onClick={() => setIsMobileFilterOpen(true)}
            className="lg:hidden px-3.5 py-2 bg-white border border-neutral-200 rounded-lg text-xs font-medium text-neutral-800 flex items-center gap-2 hover:bg-neutral-50 cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
          </button>

          <div className="relative">
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as any)}
              className="appearance-none bg-white border border-neutral-200 rounded-lg px-3.5 py-2 pr-8 text-xs font-medium text-neutral-800 focus:outline-none focus:border-neutral-400 cursor-pointer shadow-2xs"
            >
              <option value="recommended">Recommended</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="newest">Newest</option>
              <option value="rating">Highest Rated</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block lg:col-span-3 sticky top-24 pr-4">
          {FilterSidebarContent}
        </aside>

        {/* Product Grid Area */}
        <main className="lg:col-span-9">
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 transition-opacity duration-200">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="p-12 text-center rounded-2xl bg-white border border-dashed border-neutral-300 space-y-3">
              <h3 className="text-base font-serif font-bold text-neutral-800">
                No matching pieces found
              </h3>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                No articles matched your active filter selections. Try broadening your price range or clearing selected criteria.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="px-4 py-2 bg-neutral-900 text-white text-xs font-semibold rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          )}
        </main>

      </div>

      {/* Mobile Filters Drawer */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-neutral-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileFilterOpen(false)}
          />
          <div className="relative ml-auto w-full max-w-xs bg-white h-full shadow-xl p-6 overflow-y-auto flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-neutral-100">
                <span className="font-serif font-bold text-neutral-950 text-base">Filters</span>
                <button
                  type="button"
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="p-1.5 text-neutral-500 hover:text-neutral-900 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {FilterSidebarContent}
            </div>

            <div className="pt-6 mt-6 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(false)}
                className="w-full py-2.5 bg-neutral-900 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Apply Filters ({filteredProducts.length} Results)
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
