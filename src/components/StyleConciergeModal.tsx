import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  Sparkles,
  Send,
  ArrowRight,
  ShoppingBag,
  CornerDownLeft,
} from 'lucide-react';
import { useStore } from '../context/StoreContext.tsx';
import { Product } from '../types/ecommerce.ts';
import { ProductImage } from './ProductImage.tsx';
import { formatPrice } from '../utils/currency.ts';
import { useOverlay } from '../hooks/useOverlay.ts';

interface Message {
  role: 'user' | 'assistant';
  text: string;
  highlightReason?: string;
  matchedProducts?: Product[];
}

const SAMPLE_PROMPTS = [
  {
    label: 'Wireless headphones',
    query: 'Recommend wireless studio headphones with ANC',
  },
  {
    label: 'Watch under ₹5,000',
    query: 'Find an automatic watch under ₹5,000',
  },
  {
    label: 'Ceramic home decor',
    query: 'Show me minimal ceramic home decor',
  },
  {
    label: 'Trench for travel',
    query: 'I need a structured trench coat for monsoon travel',
  },
];

export const StyleConciergeModal: React.FC = () => {
  const {
    isConciergeOpen,
    setIsConciergeOpen,
    navigateToProduct,
    addToCart,
  } = useStore();

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: 'Welcome to Aureva. Tell me what you are looking for — audio, timepieces, apparel or objects for the home — and I will curate a short list for you.',
    },
  ]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useOverlay(isConciergeOpen, () => setIsConciergeOpen(false));

  useEffect(() => {
    if (!isConciergeOpen) return;
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [isConciergeOpen]);

  useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollTo({ top: node.scrollHeight, behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isConciergeOpen) return null;

  const handleSend = async (queryText?: string) => {
    const q = (queryText || input).trim();
    if (!q || isLoading) return;

    const userMsg: Message = { role: 'user', text: q };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/concierge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();

      const assistantMsg: Message = {
        role: 'assistant',
        text: data.reply || 'Here are our recommendations based on your request.',
        highlightReason: data.highlightReason,
        matchedProducts: data.products,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'I apologize, but I encountered a momentary connection hiccup. Please try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-neutral-950/55 backdrop-blur-sm"
        onClick={() => setIsConciergeOpen(false)}
      />

      {/* Square dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Aureva Style Concierge"
        className="relative flex h-[min(88vh,600px)] w-full max-w-[600px] flex-col overflow-hidden rounded-[26px] border border-white/10 bg-white shadow-[0_32px_80px_-24px_rgba(23,23,23,0.55)] ring-1 ring-black/5"
      >
        {/* Header */}
        <div className="relative shrink-0 overflow-hidden bg-[linear-gradient(135deg,#1c1917_0%,#26201a_60%,#2f2418_100%)] px-5 py-4 text-white">
          <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-[#d8a878]/20 blur-2xl" />
          <div className="relative flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-[#e9c79f] shadow-inner">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-display text-sm font-semibold tracking-tight">
                  Aureva Style Concierge
                </h3>
                <p className="mt-0.5 flex items-center gap-1.5 text-[10px] text-neutral-400">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/70" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  </span>
                  Online · personal styling, thoughtfully curated
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsConciergeOpen(false)}
              aria-label="Close concierge"
              className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Conversation body */}
        <div
          ref={scrollRef}
          className={`min-h-0 flex-1 space-y-5 overflow-y-auto bg-[#faf7f2] px-5 py-5 ${
            messages.length === 1 ? 'flex flex-col justify-center' : ''
          }`}
        >
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${
                msg.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              {msg.role === 'assistant' && (
                <span className="mb-1.5 ml-1 inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.16em] text-[#a97a4d]">
                  <Sparkles className="h-2.5 w-2.5" />
                  Concierge
                </span>
              )}

              <div
                className={`max-w-[88%] px-4 py-3 text-[13px] leading-6 ${
                  msg.role === 'user'
                    ? 'rounded-2xl rounded-tr-md bg-neutral-900 font-medium text-white shadow-sm'
                    : 'rounded-2xl rounded-tl-md border border-[#eadfd2] bg-white text-neutral-700 shadow-[0_1px_2px_rgba(23,23,23,0.04)]'
                }`}
              >
                {msg.text}
              </div>

              {/* Matched products */}
              {msg.matchedProducts && msg.matchedProducts.length > 0 && (
                <div className="mt-3 w-full space-y-2">
                  {msg.highlightReason && (
                    <div className="px-1 text-[9px] font-bold uppercase tracking-[0.16em] text-neutral-400">
                      {msg.highlightReason}
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {msg.matchedProducts.map((prod) => (
                      <div
                        key={prod.id}
                        className="group flex gap-3 rounded-xl border border-neutral-200/90 bg-white p-2.5 transition-all hover:border-[#d9b791] hover:shadow-md"
                      >
                        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                          <ProductImage
                            src={prod.thumbnail || prod.images[0]}
                            alt={prod.name}
                            aspectRatio="square"
                          />
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col justify-between">
                          <div className="min-w-0">
                            <div className="truncate text-[9px] font-bold uppercase tracking-[0.14em] text-[#a97a4d]">
                              {prod.brand}
                            </div>
                            <h5 className="line-clamp-2 text-[11px] font-bold leading-4 text-neutral-900">
                              {prod.name}
                            </h5>
                            <div className="mt-0.5 text-[11px] font-semibold tabular-nums text-neutral-700">
                              {formatPrice(prod.basePrice)}
                            </div>
                          </div>

                          <div className="mt-1.5 flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                navigateToProduct(prod.id);
                                setIsConciergeOpen(false);
                              }}
                              className="inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2 py-1 text-[10px] font-semibold text-neutral-800 transition-colors hover:bg-neutral-200"
                            >
                              View
                              <ArrowRight className="h-2.5 w-2.5" />
                            </button>
                            <button
                              onClick={() => addToCart(prod, prod.variants[0], 1)}
                              aria-label={`Add ${prod.name} to bag`}
                              className="inline-flex items-center gap-1 rounded-md bg-neutral-900 px-2 py-1 text-[10px] font-semibold text-white transition-colors hover:bg-[#965b2a]"
                            >
                              <ShoppingBag className="h-2.5 w-2.5" />
                              Bag
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {messages.length === 1 && !isLoading && (
            <div className="pt-1">
              <p className="mb-2 ml-1 text-[9px] font-bold uppercase tracking-[0.16em] text-neutral-400">
                Popular requests
              </p>
              <div className="grid grid-cols-2 gap-2">
                {SAMPLE_PROMPTS.map((prompt) => (
                  <button
                    key={prompt.label}
                    onClick={() => handleSend(prompt.query)}
                    className="group flex items-start justify-between gap-2 rounded-xl border border-[#eadfd2] bg-white px-3 py-3 text-left transition-all hover:border-[#c99e6f] hover:shadow-sm"
                  >
                    <span className="text-[11px] font-medium leading-4 text-neutral-700">
                      {prompt.label}
                    </span>
                    <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-[#b08a63] transition-transform group-hover:translate-x-0.5" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {isLoading && (
            <div className="flex items-center gap-2.5 rounded-2xl rounded-tl-md border border-[#eadfd2] bg-white px-4 py-3 text-[11px] italic text-neutral-500 shadow-sm">
              <span className="flex gap-1">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#b47a3e] [animation-delay:-0.2s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#b47a3e] [animation-delay:-0.1s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#b47a3e]" />
              </span>
              Curating the closest matches from the collection…
            </div>
          )}
        </div>

        {/* Quick prompts — shown once the conversation has started */}
        {messages.length > 1 && (
          <div className="shrink-0 border-t border-[#eee5d9] bg-[#fdfbf7] px-4 py-2.5">
            <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto">
              <span className="shrink-0 pr-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-[#b08a63]">
                Try
              </span>
              {SAMPLE_PROMPTS.map((prompt) => (
                <button
                  key={prompt.label}
                  onClick={() => handleSend(prompt.query)}
                  className="shrink-0 whitespace-nowrap rounded-full border border-[#e7d8c6] bg-white px-2.5 py-1 text-[10px] font-medium text-neutral-600 transition-colors hover:border-[#c99e6f] hover:bg-[#fbf3e9] hover:text-neutral-900"
                >
                  {prompt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input footer */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="shrink-0 border-t border-neutral-200/80 bg-white px-4 pb-3 pt-3"
        >
          <div className="flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 py-1 pl-4 pr-1 transition-colors focus-within:border-[#c99e6f] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#d8a878]/15">
            <input
              ref={inputRef}
              type="text"
              placeholder="Describe what you are looking for…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              className="min-w-0 flex-1 bg-transparent py-2 text-[13px] text-neutral-800 placeholder:text-neutral-400 focus:outline-none disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-white transition-colors hover:bg-[#965b2a] disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Send message"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="mt-2 flex items-center justify-center gap-1 text-[9px] text-neutral-400">
            <CornerDownLeft className="h-2.5 w-2.5" />
            Enter to send · Esc to close
          </p>
        </form>
      </div>
    </div>
  );
};
