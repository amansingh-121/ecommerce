import React, { useState, useEffect } from 'react';
import {
  Star,
  ShoppingBag,
  Heart,
  Share2,
  Truck,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  Check,
  MessageSquarePlus,
  X,
} from 'lucide-react';
import { useStore } from '../context/StoreContext.tsx';
import { Product, ProductVariant, Review } from '../types/ecommerce.ts';
import { ProductImage } from '../components/ProductImage.tsx';
import { ProductCard } from '../components/ProductCard.tsx';
import { formatPrice } from '../utils/currency.ts';
import { useOverlay } from '../hooks/useOverlay.ts';

export const ProductDetailPage: React.FC = () => {
  const {
    selectedProductId,
    products,
    addToCart,
    toggleWishlist,
    isInWishlist,
    setIsCartDrawerOpen,
    setCurrentView,
    showToast,
  } = useStore();

  const product = products.find(
    (p) => p.id === selectedProductId || p.slug === selectedProductId
  );

  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(
    product?.variants[0]
  );
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewSummary, setReviewSummary] = useState<{
    pros: string[];
    cons: string[];
    verdict: string;
  } | null>(null);
  const [isLoadingReviewSummary, setIsLoadingReviewSummary] = useState(false);

  // Review modal form state
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newTitle, setNewTitle] = useState('');
  const [newComment, setNewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useOverlay(isReviewModalOpen, () => setIsReviewModalOpen(false));

  // Sync selected variant when product changes
  useEffect(() => {
    if (product) {
      setSelectedVariant(product.variants[0]);
      setActiveImageIdx(0);
      setQuantity(1);
      fetchReviews(product.id);
      fetchReviewSummary(product.id);
    }
  }, [product?.id]);

  const fetchReviews = async (pId: string) => {
    try {
      const res = await fetch(`/api/products/${pId}/reviews`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
      }
    } catch (err) {
      console.error('Failed to load reviews:', err);
    }
  };

  const fetchReviewSummary = async (pId: string) => {
    try {
      setIsLoadingReviewSummary(true);
      const res = await fetch('/api/reviews/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: pId }),
      });
      if (res.ok) {
        const data = await res.json();
        setReviewSummary(data);
      }
    } catch (err) {
      console.warn('Review summary fetch failed:', err);
    } finally {
      setIsLoadingReviewSummary(false);
    }
  };

  const handleCreateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !product) return;

    setIsSubmittingReview(true);
    try {
      const res = await fetch(`/api/products/${product.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: newRating,
          title: newTitle || 'Exceptional experience',
          comment: newComment,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setReviews((prev) => [data.review, ...prev]);
        setIsReviewModalOpen(false);
        setNewComment('');
        setNewTitle('');
        fetchReviewSummary(product.id);
        showToast('Review submitted successfully!');
      }
    } catch (err) {
      showToast('Failed to submit review', 'error');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p>Product not found.</p>
        <button
          onClick={() => setCurrentView('catalog')}
          className="mt-4 px-4 py-2 bg-neutral-900 text-white rounded-lg text-xs"
        >
          Return to Catalog
        </button>
      </div>
    );
  }

  const currentVariant = selectedVariant || product.variants[0];
  const currentPrice = product.basePrice + (currentVariant ? currentVariant.priceModifier : 0);
  const isFavorited = isInWishlist(product.id);
  const images = product.images.length > 0 ? product.images : [product.thumbnail];
  const relatedProducts = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  const handleBuyNow = () => {
    addToCart(product, currentVariant, quantity);
    setIsCartDrawerOpen(false);
    setCurrentView('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: product.name, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.href);
      showToast('Product link copied to clipboard');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-16">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-neutral-500">
        <button
          onClick={() => setCurrentView('home')}
          className="hover:text-neutral-900 transition-colors"
        >
          Home
        </button>
        <span>/</span>
        <button
          onClick={() => setCurrentView('catalog')}
          className="hover:text-neutral-900 transition-colors"
        >
          {product.category}
        </button>
        <span>/</span>
        <span className="text-neutral-900 font-semibold truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main Contiguous Purchase Module (Gallery Left, Purchase Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Gallery Section */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative w-full rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-200/80 shadow-xs aspect-[4/3]">
            <ProductImage
              src={images[activeImageIdx]}
              alt={product.name}
              aspectRatio="4/3"
              className="w-full h-full object-cover"
            />
            {product.discountPercentage > 0 && (
              <div className="absolute top-4 left-4 bg-neutral-900 text-white text-xs font-semibold px-2.5 py-1 rounded">
                Save {product.discountPercentage}%
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-3">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIdx(idx)}
                  className={`w-20 h-20 rounded-xl overflow-hidden bg-neutral-100 border-2 transition-all ${
                    activeImageIdx === idx
                      ? 'border-neutral-950 scale-105'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <ProductImage src={img} alt={`${product.name} preview ${idx}`} aspectRatio="square" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Purchase Module */}
        <div className="lg:col-span-5 bg-white border border-neutral-200/90 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <div className="flex items-center justify-between text-xs text-neutral-500 mb-1">
              <span className="uppercase tracking-wider font-semibold text-neutral-600">
                {product.brand} · {product.sku}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleShare}
                  className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded transition-colors"
                  title="Share product"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => toggleWishlist(product.id)}
                  className="p-1.5 text-neutral-400 hover:text-rose-600 rounded transition-colors"
                  title="Save to wishlist"
                >
                  <Heart
                    className={`w-4 h-4 ${
                      isFavorited ? 'fill-rose-600 stroke-rose-600' : ''
                    }`}
                  />
                </button>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-950 font-display leading-tight">
              {product.name}
            </h1>

            {/* Rating Stars with jump link */}
            <div className="flex items-center gap-2 mt-2 text-xs">
              <div className="flex text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${
                      i < Math.floor(product.rating)
                        ? 'fill-amber-400 stroke-amber-400'
                        : 'stroke-neutral-300'
                    }`}
                  />
                ))}
              </div>
              <span className="font-bold text-neutral-900 tabular-nums">{product.rating}</span>
              <span className="text-neutral-400">·</span>
              <a href="#reviews" className="text-neutral-600 hover:underline">
                {product.reviewCount} verified client reviews
              </a>
            </div>

            {/* Price Baseline */}
            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-3xl font-extrabold text-neutral-950 font-display tabular-nums">
                {formatPrice(currentPrice)}
              </span>
              {product.originalPrice > currentPrice && (
                <span className="text-sm text-neutral-400 line-through tabular-nums">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </div>

            <p className="mt-3 text-xs text-neutral-600 leading-relaxed font-normal">
              {product.shortDescription}
            </p>
          </div>

          {/* Variant Selector */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-neutral-100">
              <div className="flex justify-between text-xs font-semibold text-neutral-900">
                <span>Select Configuration</span>
                <span className="text-neutral-500">{currentVariant?.name}</span>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {product.variants.map((v) => {
                  const isSelected = currentVariant?.id === v.id;
                  return (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(v)}
                      className={`px-3 py-2.5 rounded-xl text-xs font-medium border flex items-center justify-between transition-colors ${
                        isSelected
                          ? 'border-neutral-900 bg-neutral-900 text-white'
                          : 'border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {v.colorHex && (
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0"
                            style={{ backgroundColor: v.colorHex }}
                          />
                        )}
                        <span>{v.name}</span>
                      </div>
                      <div className="text-[11px] tabular-nums">
                        {v.priceModifier > 0
                          ? `+${formatPrice(v.priceModifier)}`
                          : v.stock <= 5
                          ? `Only ${v.stock} left`
                          : 'In Stock'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity & CTA Buttons */}
          <div className="pt-4 border-t border-neutral-100 space-y-3">
            <div className="flex items-center gap-4">
              <span className="text-xs font-semibold text-neutral-700">Quantity:</span>
              <div className="flex items-center border border-neutral-200 rounded-xl bg-neutral-50">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-2 text-neutral-600 hover:text-black font-semibold"
                >
                  -
                </button>
                <span className="px-3 text-xs font-bold tabular-nums text-neutral-900">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-2 text-neutral-600 hover:text-black font-semibold"
                >
                  +
                </button>
              </div>

              <span className="text-xs text-neutral-500">
                Total:{' '}
                <strong className="text-neutral-900 tabular-nums">
                  {formatPrice(currentPrice * quantity)}
                </strong>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => addToCart(product, currentVariant, quantity)}
                disabled={!product.inStock}
                className="py-3.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 border border-neutral-200"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add to Bag</span>
              </button>

              <button
                onClick={handleBuyNow}
                disabled={!product.inStock}
                className="py-3.5 bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs"
              >
                <span>Buy Now</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Trust Highlights */}
          <div className="pt-4 border-t border-neutral-100 space-y-2 text-xs text-neutral-600">
            <div className="flex items-center gap-2.5">
              <Truck className="w-4 h-4 text-neutral-900 shrink-0" />
              <span>Complimentary insured delivery on orders over ₹2,999</span>
            </div>
            <div className="flex items-center gap-2.5">
              <RotateCcw className="w-4 h-4 text-neutral-900 shrink-0" />
              <span>7-day hassle-free returns with prepaid return pickup</span>
            </div>
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-neutral-900 shrink-0" />
              <span>Includes manufacturer warranty and certificate of inspection</span>
            </div>
          </div>
        </div>
      </div>

      {/* Product Details, Specs and Customer Reviews */}
      <div className="pt-12 border-t border-neutral-200 space-y-12">
        {/* Detailed Description */}
        <div className="space-y-4 max-w-3xl">
          <h2 className="text-xl font-bold text-neutral-900 font-display">
            Artisanal Overview & Design Ethos
          </h2>
          <p className="text-sm text-neutral-700 leading-relaxed font-normal">
            {product.description}
          </p>
        </div>

        {/* Technical Specifications Table */}
        {product.specifications && product.specifications.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-neutral-900 font-display">
              Technical Specifications
            </h2>
            <div className="border border-neutral-200 rounded-xl overflow-hidden bg-white">
              {product.specifications.map((group, gIdx) => (
                <div key={gIdx} className={gIdx > 0 ? 'border-t border-neutral-200' : ''}>
                  <div className="bg-neutral-50 px-4 py-2.5 text-xs font-bold text-neutral-800 uppercase tracking-wider border-b border-neutral-200/80">
                    {group.group}
                  </div>
                  <dl className="divide-y divide-neutral-100 text-xs">
                    {group.items.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-3 px-4 py-2.5 hover:bg-neutral-50/50">
                        <dt className="text-neutral-500 font-medium">{item.key}</dt>
                        <dd className="col-span-2 text-neutral-900 font-semibold">{item.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Customer Review Synthesis Box */}
        <div className="bg-neutral-900 text-white rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-400">
              <Sparkles className="w-5 h-5" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                Customer Review Synthesis
              </h3>
            </div>
            <span className="text-[11px] text-neutral-400">
              Synthesized from {reviews.length || product.reviewCount} customer reviews
            </span>
          </div>

          {isLoadingReviewSummary ? (
            <div className="text-xs text-neutral-400 italic py-2">
              Generating customer consensus...
            </div>
          ) : reviewSummary ? (
            <div className="space-y-4 text-xs sm:text-sm">
              <p className="text-neutral-300 italic leading-relaxed border-l-2 border-amber-400 pl-3">
                "{reviewSummary.verdict}"
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block">
                    What Customers Praise
                  </span>
                  {reviewSummary.pros.map((pro, i) => (
                    <div key={i} className="flex items-start gap-2 text-neutral-200 text-xs">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{pro}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block">
                    Considerations
                  </span>
                  {reviewSummary.cons.map((con, i) => (
                    <div key={i} className="flex items-start gap-2 text-neutral-300 text-xs">
                      <span className="text-neutral-500">·</span>
                      <span>{con}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Verified Reviews Section */}
        <div id="reviews" className="space-y-6 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-neutral-900 font-display">
                Client Reviews ({reviews.length})
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Authentic testimonials from verified purchasers.
              </p>
            </div>

            <button
              onClick={() => setIsReviewModalOpen(true)}
              className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
            >
              <MessageSquarePlus className="w-3.5 h-3.5" />
              <span>Write a Review</span>
            </button>
          </div>

          <div className="space-y-4">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="bg-white border border-neutral-200/90 rounded-xl p-5 space-y-2 shadow-2xs"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-neutral-900">{rev.userName}</span>
                    {rev.verifiedPurchase && (
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-semibold">
                        Verified Purchase
                      </span>
                    )}
                  </div>
                  <span className="text-neutral-400 text-[11px]">
                    {new Date(rev.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${
                        i < rev.rating
                          ? 'fill-amber-400 stroke-amber-400'
                          : 'stroke-neutral-300'
                      }`}
                    />
                  ))}
                </div>

                <h5 className="text-xs font-bold text-neutral-900">{rev.title}</h5>
                <p className="text-xs text-neutral-600 leading-relaxed">{rev.comment}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="pt-12 border-t border-neutral-200 space-y-6">
            <h3 className="text-xl font-bold text-neutral-900 font-display">
              Related Pieces in {product.category}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-neutral-900/50 backdrop-blur-xs"
            onClick={() => setIsReviewModalOpen(false)}
          />
          <div className="relative w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-neutral-200">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-base font-bold text-neutral-900 font-display">
                Write a Review for {product.name}
              </h4>
              <button
                onClick={() => setIsReviewModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReview} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setNewRating(star)}
                      className="p-1 text-amber-500"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= newRating
                            ? 'fill-amber-400 stroke-amber-400'
                            : 'stroke-neutral-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Headline / Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Masterpiece of craftsmanship"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Your Review
                </label>
                <textarea
                  rows={4}
                  placeholder="Share details regarding build quality, sound signature, fit, or aesthetic presence..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:border-neutral-900"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingReview || !newComment.trim()}
                className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors"
              >
                {isSubmittingReview ? 'Submitting...' : 'Post Verified Review'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
