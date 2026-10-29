import React from 'react';
import { Heart, ShoppingBag, Eye, Star } from 'lucide-react';
import { Product } from '../types/ecommerce.ts';
import { useStore } from '../context/StoreContext.tsx';
import { ProductImage } from './ProductImage.tsx';
import { formatPrice } from '../utils/currency.ts';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const {
    navigateToProduct,
    addToCart,
    toggleWishlist,
    isInWishlist,
    setQuickViewProduct,
  } = useStore();

  const isFavorited = isInWishlist(product.id);
  const [justAdded, setJustAdded] = React.useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!product.inStock) return;
    addToCart(product, product.variants[0], 1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  return (
    <div className="group relative flex flex-col bg-white border border-neutral-200/90 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300">
      {/* Visual Image Container */}
      <div className="relative w-full overflow-hidden bg-neutral-100 aspect-square">
        <button
          onClick={() => navigateToProduct(product.id)}
          className="w-full h-full text-left block focus:outline-none cursor-pointer"
          tabIndex={-1}
        >
          <ProductImage
            src={product.thumbnail || product.images[0]}
            alt={product.name}
            aspectRatio="square"
            className="group-hover:scale-104 transition-transform duration-500 ease-out"
          />
        </button>

        {/* Warm Amber Discount Pill */}
        {product.discountPercentage > 0 && (
          <div className="absolute top-3 left-3 bg-[#b47a3e] text-white text-[10px] font-bold tracking-wider px-2 py-0.5 rounded shadow-xs uppercase">
            {product.discountPercentage}% OFF
          </div>
        )}

        {/* Circular Wishlist Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            isFavorited
              ? 'bg-rose-50 text-rose-600 shadow-sm'
              : 'bg-white/95 text-neutral-600 hover:text-neutral-950 hover:bg-white shadow-sm'
          }`}
          aria-label={isFavorited ? 'Remove from wishlist' : 'Save to wishlist'}
        >
          <Heart
            className={`w-4 h-4 ${
              isFavorited ? 'fill-rose-600 stroke-rose-600' : 'stroke-[1.75]'
            }`}
          />
        </button>

        {/* Quick View Button on Hover */}
        <div className="absolute bottom-3 inset-x-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
          <button
            onClick={() => setQuickViewProduct(product)}
            className="flex-1 py-1.5 px-3 bg-white/95 backdrop-blur-xs text-neutral-900 text-xs font-semibold rounded-lg shadow-sm hover:bg-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Quick View</span>
          </button>
        </div>
      </div>

      {/* Card Content & Metadata */}
      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          {/* Brand uppercase monospace */}
          <div className="text-[11px] font-mono tracking-wider uppercase text-neutral-500 font-semibold mb-1 truncate">
            {product.brand}
          </div>

          {/* Product Title */}
          <h3 className="text-sm font-semibold text-neutral-900 leading-snug line-clamp-1 hover:text-neutral-600 transition-colors">
            <button
              onClick={() => navigateToProduct(product.id)}
              className="text-left w-full focus:outline-none cursor-pointer"
            >
              {product.name}
            </button>
          </h3>

          {/* Star Rating Row */}
          <div className="flex items-center gap-1.5 mt-1.5 text-xs text-neutral-500">
            <div className="flex items-center text-amber-500">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-3.5 h-3.5 ${
                    star <= Math.round(product.rating)
                      ? 'fill-amber-400 stroke-amber-400'
                      : 'stroke-neutral-300 text-neutral-300'
                  }`}
                />
              ))}
            </div>
            <span className="font-semibold text-neutral-800 tabular-nums ml-0.5">
              {product.rating}
            </span>
            <span className="text-neutral-400">({product.reviewCount})</span>
          </div>

          {/* Pricing Row: Price, Strike-through original, and percentage off */}
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-base font-bold text-neutral-950 font-mono">
              {formatPrice(product.basePrice)}
            </span>
            {product.originalPrice > product.basePrice && (
              <span className="text-xs text-neutral-400 line-through font-mono">
                {formatPrice(product.originalPrice)}
              </span>
            )}
            {product.discountPercentage > 0 && (
              <span className="text-xs text-emerald-700 font-medium font-mono">
                {product.discountPercentage}% off
              </span>
            )}
          </div>
        </div>

        {/* Full-width Amber "Add to Bag" Button */}
        <div className="mt-3.5">
          <button
            onClick={handleAddToCart}
            disabled={!product.inStock}
            className={`w-full py-2.5 px-4 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs ${
              !product.inStock
                ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                : justAdded
                ? 'bg-emerald-700 text-white'
                : 'bg-[#965b2a] hover:bg-[#834d22] active:scale-[0.99] text-white'
            }`}
            aria-label={`Add ${product.name} to bag`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>{justAdded ? '✓ Added to Bag' : product.inStock ? 'Add to Bag' : 'Out of Stock'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
