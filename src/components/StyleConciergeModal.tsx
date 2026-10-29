import React, { useState } from 'react';
import { X, Sparkles, Send, ArrowRight, ShoppingBag } from 'lucide-react';
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
      text: 'Welcome to Aureva. I am your personal shopping concierge. Ask me to find the ideal audio gear, fine timepieces, minimal apparel, or curated objects for your home.',
    },
  ]);

  useOverlay(isConciergeOpen, () => setIsConciergeOpen(false));

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

  const samplePrompts = [
    'Recommend wireless studio headphones with ANC',
    'Find an automatic watch under ₹5,000',
    'Show me minimal ceramic home decor',
    'I need a structured trench coat for monsoon travel',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-neutral-900/50 backdrop-blur-xs transition-opacity"
        onClick={() => setIsConciergeOpen(false)}
      />

      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-neutral-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold tracking-tight font-display">
                Aureva Style Concierge
              </h3>
              <p className="text-[11px] text-neutral-400">
                Personal styling, thoughtfully curated
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsConciergeOpen(false)}
            className="text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conversation Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${
                msg.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[85%] rounded-xl px-4 py-3 text-sm ${
                  msg.role === 'user'
                    ? 'bg-neutral-900 text-white font-medium'
                    : 'bg-neutral-100 text-neutral-800 border border-neutral-200/60 leading-relaxed'
                }`}
              >
                {msg.text}
              </div>

              {/* Matched Products Card Grid */}
              {msg.matchedProducts && msg.matchedProducts.length > 0 && (
                <div className="mt-3 w-full max-w-xl space-y-2">
                  {msg.highlightReason && (
                    <div className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider px-1">
                      {msg.highlightReason}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {msg.matchedProducts.map((prod) => (
                      <div
                        key={prod.id}
                        className="bg-white border border-neutral-200 rounded-xl p-3 flex gap-3 hover:border-neutral-400 transition-colors shadow-xs"
                      >
                        <div className="w-16 h-16 rounded-lg bg-neutral-100 overflow-hidden shrink-0">
                          <ProductImage
                            src={prod.thumbnail || prod.images[0]}
                            alt={prod.name}
                            aspectRatio="square"
                          />
                        </div>
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <div className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">
                              {prod.brand}
                            </div>
                            <h5 className="text-xs font-bold text-neutral-900 line-clamp-1">
                              {prod.name}
                            </h5>
                            <div className="text-xs font-semibold text-neutral-900 mt-0.5 tabular-nums">
                              {formatPrice(prod.basePrice)}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 mt-2">
                            <button
                              onClick={() => {
                                navigateToProduct(prod.id);
                                setIsConciergeOpen(false);
                              }}
                              className="px-2 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[11px] font-semibold rounded flex items-center gap-1 transition-colors"
                            >
                              <span>View</span>
                              <ArrowRight className="w-2.5 h-2.5" />
                            </button>
                            <button
                              onClick={() => addToCart(prod, prod.variants[0], 1)}
                              className="px-2 py-1 bg-neutral-900 hover:bg-neutral-800 text-white text-[11px] font-semibold rounded flex items-center gap-1 transition-colors"
                            >
                              <ShoppingBag className="w-2.5 h-2.5" />
                              <span>Bag</span>
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

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-neutral-500 italic py-2">
              <div className="w-2 h-2 rounded-full bg-neutral-400 animate-ping" />
              <span>Aureva is curating the closest matches from the collection...</span>
            </div>
          )}
        </div>

        {/* Quick prompt chips */}
        <div className="px-6 py-2 bg-neutral-50 border-t border-neutral-100 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-neutral-400 text-[11px] whitespace-nowrap">Try:</span>
          {samplePrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSend(prompt)}
              className="px-2.5 py-1 bg-white border border-neutral-200 hover:border-neutral-400 rounded-full text-neutral-600 hover:text-neutral-900 whitespace-nowrap text-xs transition-colors shrink-0"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Footer */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-4 border-t border-neutral-200 bg-white flex gap-2"
        >
          <input
            type="text"
            placeholder="Describe what you are looking for (e.g. running shoes, daily watch, gift under ₹2,000)..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 text-sm bg-neutral-100 border border-transparent rounded-xl focus:bg-white focus:border-neutral-400 focus:outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white rounded-xl transition-colors flex items-center justify-center"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
