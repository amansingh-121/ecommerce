import React, { useState } from 'react';
import { Package, Sparkles } from 'lucide-react';

interface ProductImageProps {
  src?: string;
  alt: string;
  className?: string;
  aspectRatio?: 'square' | 'video' | 'portrait' | '4/3';
}

export const ProductImage: React.FC<ProductImageProps> = ({
  src,
  alt,
  className = '',
  aspectRatio = '4/3',
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const aspectClass =
    aspectRatio === 'square'
      ? 'aspect-square'
      : aspectRatio === 'video'
      ? 'aspect-video'
      : aspectRatio === 'portrait'
      ? 'aspect-[3/4]'
      : 'aspect-[4/3]';

  if (!src || hasError) {
    return (
      <div
        className={`w-full ${aspectClass} bg-gradient-to-br from-neutral-100 via-neutral-200/60 to-neutral-100 flex flex-col items-center justify-center p-6 text-neutral-400 select-none overflow-hidden relative ${className}`}
        aria-label={alt}
      >
        {/* Subtle geometric background watermark pattern */}
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="w-12 h-12 rounded-xl bg-white/80 shadow-sm border border-neutral-200/60 flex items-center justify-center text-neutral-600 mb-2 relative z-10">
          <Package className="w-6 h-6 stroke-[1.5]" />
        </div>
        <span className="text-xs font-medium text-neutral-600 tracking-tight text-center line-clamp-1 relative z-10">
          {alt}
        </span>
        <span className="text-[10px] text-neutral-400 mt-0.5 tracking-wider uppercase font-mono relative z-10">
          Aureva Signature
        </span>
      </div>
    );
  }

  return (
    <div className={`relative w-full ${aspectClass} overflow-hidden bg-neutral-100 ${className}`}>
      {!isLoaded && (
        <div className="absolute inset-0 bg-neutral-200/50 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-neutral-300 border-t-neutral-800 animate-spin" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
};
