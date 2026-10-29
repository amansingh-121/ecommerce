import React from 'react';
import {
  ArrowRight,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  Truck,
  RotateCcw,
  ShieldCheck,
  Star,
} from 'lucide-react';
import { useStore } from '../context/StoreContext.tsx';
import { ProductCard } from '../components/ProductCard.tsx';
import { formatPrice } from '../utils/currency.ts';

export const HomePage: React.FC = () => {
  const {
    products,
    categories,
    setCurrentView,
    navigateToCategory,
    setIsConciergeOpen,
    setSelectedCategory,
  } = useStore();

  const featuredProducts = products.filter((p) => p.isFeatured).slice(0, 4);
  const bestSellers = products.filter((p) => p.isBestSeller).slice(0, 4);
  const newArrivals = products.filter((p) => p.isNewArrival).slice(0, 4);

  return (
    <div className="space-y-16 sm:space-y-24 font-sans">
      {/* 1. Main Hero Section */}
      <section className="relative overflow-hidden bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            
            {/* Left Column: Hero Copy & Actions */}
            <div className="lg:col-span-7 space-y-6">
              {/* Eyebrow */}
              <div className="text-xs font-bold tracking-widest text-[#965b2a] uppercase font-mono">
                CURATED LUXURY & PRECISION LIVING
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-neutral-950 tracking-tight leading-[1.12]">
                Masterpiece Living,<br />
                Curated for You<span className="text-[#965b2a]">.</span>
              </h1>

              {/* Subparagraph */}
              <p className="text-base sm:text-lg text-neutral-600 max-w-xl leading-relaxed font-normal">
                Five categories, one obsessive standard. Verified craftsmanship, transparent ₹ pricing and a personal style concierge — India's most considered marketplace.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-3.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('all');
                    setCurrentView('catalog');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-6 py-3.5 bg-[#965b2a] hover:bg-[#834f24] text-white text-sm font-semibold rounded-lg shadow-sm transition-all flex items-center gap-2 group"
                >
                  <span>Shop Now</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsConciergeOpen(true)}
                  className="px-5 py-3.5 bg-white border border-neutral-300 hover:border-neutral-400 hover:bg-neutral-50 text-neutral-800 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 shadow-2xs"
                >
                  <Sparkles className="w-4 h-4 text-[#965b2a]" />
                  <span>Ask the Style Concierge</span>
                </button>
              </div>

              {/* Micro Trust Indicators */}
              <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-neutral-600 font-medium">
                <div className="flex items-center gap-1.5 text-emerald-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>100% authentic</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-neutral-500 shrink-0" />
                  <span>Pan-India delivery</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <RotateCcw className="w-4 h-4 text-neutral-500 shrink-0" />
                  <span>7-day returns</span>
                </div>
              </div>
            </div>

            {/* Right Column: Hero High-Fashion Visual */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-3xl overflow-hidden bg-neutral-100 border border-neutral-200 shadow-xl group">
                <img
                  src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=1200&auto=format&fit=crop"
                  alt="Aureva Curated Fashion & Masterpiece Living"
                  className="w-full aspect-[4/5] object-cover object-top group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                
                {/* Floating Subtle Provenance Tag */}
                <div className="absolute bottom-4 left-4 right-4 p-3.5 bg-white/95 backdrop-blur-md rounded-2xl border border-neutral-200/80 shadow-md flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 block">
                      Featured Allocation
                    </span>
                    <span className="text-xs font-semibold text-neutral-900">
                      Tailored Architectural Trench & Fine Knits
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigateToCategory('Fashion');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="text-xs text-[#965b2a] font-semibold hover:underline flex items-center gap-1"
                  >
                    <span>Explore</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. Five Curated Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs font-bold tracking-widest text-[#965b2a] uppercase font-mono block mb-1">
              THE FIVE PILLARS
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-neutral-950">
              Curated Collections
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('all');
              setCurrentView('catalog');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="text-xs font-semibold text-[#965b2a] hover:text-[#78461e] flex items-center gap-1"
          >
            <span>View All Products</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
          {[
            {
              name: 'Electronics',
              desc: 'Wireless audio, smart timepieces & studio gear',
              image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=600&auto=format&fit=crop',
            },
            {
              name: 'Fashion',
              desc: 'Tailored apparel, artisan leather & eyewear',
              image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600&auto=format&fit=crop',
            },
            {
              name: 'Home',
              desc: 'Sculptural ceramics, candles & tableware',
              image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=600&auto=format&fit=crop',
            },
            {
              name: 'Beauty',
              desc: 'Botanical skincare, parfum & rituals',
              image: 'https://images.unsplash.com/photo-1608248597359-3a362143eaec?q=80&w=600&auto=format&fit=crop',
            },
            {
              name: 'Sports',
              desc: 'Cork yoga, running & strength essentials',
              image: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?q=80&w=600&auto=format&fit=crop',
            },
          ].map((cat) => (
            <button
              key={cat.name}
              type="button"
              onClick={() => {
                navigateToCategory(cat.name);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="group relative rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-200 text-left aspect-[3/4] flex flex-col justify-end p-4 transition-all duration-300 hover:shadow-lg"
            >
              <img
                src={cat.image}
                alt={cat.name}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 brightness-90 group-hover:brightness-100"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
              
              <div className="relative z-10 space-y-1">
                <h3 className="text-base font-serif font-bold text-white group-hover:text-amber-200 transition-colors">
                  {cat.name}
                </h3>
                <p className="text-[11px] text-neutral-300 line-clamp-1 leading-snug">
                  {cat.desc}
                </p>
                <span className="inline-flex items-center gap-1 text-[10px] text-amber-300 font-semibold pt-1">
                  <span>Explore Collection</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* 3. Featured Masterpiece Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs font-bold tracking-widest text-[#965b2a] uppercase font-mono block mb-1">
              CURATED RELEASES
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-neutral-950">
              Featured Pieces
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('all');
              setCurrentView('catalog');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="text-xs font-semibold text-[#965b2a] hover:underline flex items-center gap-1"
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 4. Best Sellers Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs font-bold tracking-widest text-[#965b2a] uppercase font-mono block mb-1">
              VERIFIED POPULARITY
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-neutral-950">
              Collector Favorites
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {bestSellers.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 5. New Arrivals */}
      {newArrivals.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="text-xs font-bold tracking-widest text-[#965b2a] uppercase font-mono block mb-1">
                JUST ARRIVED
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-neutral-950">
                New Arrivals
              </h2>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all');
                setCurrentView('catalog');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-xs font-semibold text-[#965b2a] hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {newArrivals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* 6. Promotional Allocation Offer */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl p-8 sm:p-12 bg-white border border-neutral-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-xs font-mono uppercase tracking-widest text-[#965b2a] font-bold">
              LIMITED ALLOCATION OFFER
            </span>
            <h3 className="text-2xl sm:text-3xl font-serif font-bold text-neutral-950">
              Receive 15% off your first order over ₹2,000
            </h3>
            <p className="text-xs sm:text-sm text-neutral-600">
              Use code <span className="font-mono font-bold text-neutral-900 bg-neutral-100 px-1.5 py-0.5 rounded">AUREVA15</span> during checkout. Complimentary pan-India delivery on orders over ₹2,999.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setSelectedCategory('all');
              setCurrentView('catalog');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="px-6 py-3.5 bg-neutral-950 hover:bg-neutral-800 text-white text-xs sm:text-sm font-semibold rounded-xl shrink-0 transition-colors shadow-sm"
          >
            Redeem Invitation Code
          </button>
        </div>
      </section>

      {/* 7. Verified Customer Reviews */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center max-w-xl mx-auto">
          <span className="text-xs font-mono font-bold tracking-widest text-[#965b2a] uppercase block mb-1">
            TESTIMONIALS
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-neutral-950">
            Collector Reflections
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              name: 'Ananya Sen',
              city: 'Mumbai, India',
              quote: 'The craftsmanship on the tailored outerwear and acoustic monitors is exceptional. Delivery to BKC took less than 24 hours in immaculate packaging.',
              rating: 5,
            },
            {
              name: 'Marcus Vance',
              city: 'Bengaluru, India',
              quote: 'The planar magnetic headphones deliver startling acoustic detail across recording sessions. True studio reference grade hardware.',
              rating: 5,
            },
            {
              name: 'David Sterling',
              city: 'Delhi NCR, India',
              quote: 'The automatic movement watch is gaining barely 2 seconds a day. The sapphire crystal and sunburst dial catch ambient light with stunning presence.',
              rating: 5,
            },
          ].map((rev) => (
            <div key={rev.name} className="p-6 bg-white border border-neutral-200 rounded-2xl shadow-xs space-y-4">
              <div className="flex items-center gap-1 text-amber-500">
                {[...Array(rev.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 stroke-amber-400" />
                ))}
              </div>
              <p className="text-xs sm:text-sm text-neutral-700 italic leading-relaxed">
                "{rev.quote}"
              </p>
              <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-neutral-900 block">{rev.name}</span>
                  <span className="text-neutral-400 text-[11px]">{rev.city}</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
                  Verified Client
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};
