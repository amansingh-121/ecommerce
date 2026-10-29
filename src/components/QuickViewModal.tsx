import React, { useEffect, useState } from 'react';
import { X, Star, ShoppingBag, Check, ArrowRight } from 'lucide-react';
import { useStore } from '../context/StoreContext.tsx';
import { ProductImage } from './ProductImage.tsx';
import { ProductVariant } from '../types/ecommerce.ts';
import { formatPrice } from '../utils/currency.ts';
import { useOverlay } from '../hooks/useOverlay.ts';

export const QuickViewModal: React.FC = () => {
  const {
    quickViewProduct,
    setQuickViewProduct,
    addToCart,
    navigateToProduct,
  } = useStore();

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(
    quickViewProduct?.variants[0]
  );
  const [quantity, setQuantity] = useState(1);

  useOverlay(Boolean(quickViewProduct), () => setQuickViewProduct(null));

  // Reset the selected variant whenever a different product is opened
  useEffect(() => {
    if (quickViewProduct) {
      setSelectedVariant(quickViewProduct.variants[0]);
      setQuantity(1);
    }
  }, [quickViewProduct?.id]);

  if (!quickViewProduct) return null;

  const currentVariant = selectedVariant || quickViewProduct.variants[0];
  const currentPrice =
    quickViewProduct.basePrice + (currentVariant ? currentVariant.priceModifier : 0);

  const handleAdd = () => {
    addToCart(quickViewProduct, currentVariant, quantity);
    setQuickViewProduct(null);
  };

  const handleFullDetails = () => {
    navigateToProduct(quickViewProduct.id);
    setQuickViewProduct(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-neutral-900/50 backdrop-blur-xs transition-opacity"
        onClick={() => setQuickViewProduct(null)}
      />

      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden z-10 grid grid-cols-1 md:grid-cols-2">
        <button
          onClick={() => setQuickViewProduct(null)}
          className="absolute top-4 right-4 z-20 p-1.5 bg-white/80 backdrop-blur-xs hover:bg-white text-neutral-500 hover:text-neutral-900 rounded-full transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Product Media */}
        <div className="bg-neutral-100 flex items-center justify-center p-6">
          <div className="w-full max-w-sm rounded-xl overflow-hidden shadow-xs border border-neutral-200/60 bg-white">
            <ProductImage
              src={quickViewProduct.thumbnail || quickViewProduct.images[0]}
              alt={quickViewProduct.name}
              aspectRatio="square"
            />
          </div>
        </div>

        {/* Purchase Module */}
        <div className="p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider font-semibold text-neutral-500 mb-1">
              {quickViewProduct.brand} · {quickViewProduct.category}
            </div>

            <h3 className="text-xl font-bold text-neutral-900 leading-tight">
              {quickViewProduct.name}
            </h3>

            {/* Rating */}
            <div className="flex items-center gap-1.5 mt-2 text-xs text-neutral-500">
              <div className="flex text-amber-500">
                <Star className="w-4 h-4 fill-amber-400 stroke-amber-400" />
              </div>
              <span className="font-semibold text-neutral-800 tabular-nums">
                {quickViewProduct.rating}
              </span>
              <span>({quickViewProduct.reviewCount} customer reviews)</span>
            </div>

            {/* Price */}
            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-2xl font-bold text-neutral-900 tabular-nums">
                {formatPrice(currentPrice)}
              </span>
              {quickViewProduct.originalPrice > currentPrice && (
                <span className="text-sm text-neutral-400 line-through tabular-nums">
                  {formatPrice(quickViewProduct.originalPrice)}
                </span>
              )}
            </div>

            <p className="mt-3 text-xs text-neutral-600 line-clamp-3 leading-relaxed">
              {quickViewProduct.shortDescription || quickViewProduct.description}
            </p>

            {/* Variant Selector */}
            {quickViewProduct.variants && quickViewProduct.variants.length > 0 && (
              <div className="mt-5 space-y-2">
                <div className="text-xs font-semibold text-neutral-800 flex justify-between">
                  <span>Configuration / Variant:</span>
                  <span className="text-neutral-500">{currentVariant?.name}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {quickViewProduct.variants.map((v) => {
                    const isSelected = currentVariant?.id === v.id;
                    return (
                      <button
                        key={v.id}
                        onClick={() => setSelectedVariant(v)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                          isSelected
                            ? 'border-neutral-900 bg-neutral-900 text-white'
                            : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100'
                        }`}
                      >
                        {v.colorHex && (
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-black/20"
                            style={{ backgroundColor: v.colorHex }}
                          />
                        )}
                        <span>{v.name}</span>
                        {v.priceModifier > 0 && (
                          <span className="text-[10px] opacity-75">
                            (+{formatPrice(v.priceModifier)})
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Action CTAs */}
          <div className="mt-8 pt-4 border-t border-neutral-100 space-y-3">
            <div className="flex gap-3">
              {/* Quantity */}
              <div className="flex items-center border border-neutral-200 rounded-xl px-2 py-1">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-2 text-neutral-500 hover:text-black font-semibold"
                >
                  -
                </button>
                <span className="px-2 text-xs font-bold tabular-nums">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-2 text-neutral-500 hover:text-black font-semibold"
                >
                  +
                </button>
              </div>

              {/* Add to Bag */}
              <button
                onClick={handleAdd}
                className="flex-1 py-3 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add to Shopping Bag</span>
              </button>
            </div>

            <button
              onClick={handleFullDetails}
              className="w-full text-center text-xs font-medium text-neutral-600 hover:text-neutral-900 py-1 flex items-center justify-center gap-1 group"
            >
              <span>View complete specifications & verified reviews</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
