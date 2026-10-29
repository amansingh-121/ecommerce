import React, { useState } from 'react';
import {
  Phone,
  Mail,
  MapPin,
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  X,
  Truck,
  RefreshCw,
  ShieldCheck,
  Award,
} from 'lucide-react';
import { useStore } from '../context/StoreContext.tsx';

type PolicyModalType = 'about' | 'shipping' | 'returns' | 'privacy' | 'terms' | null;

export const Footer: React.FC = () => {
  const { setCurrentView, navigateToCategory, setSelectedCategory, setAccountTab } = useStore();
  const [activeModal, setActiveModal] = useState<PolicyModalType>(null);

  const handleCategoryClick = (cat: string) => {
    if (cat === 'all') {
      setSelectedCategory('all');
      setCurrentView('catalog');
    } else {
      navigateToCategory(cat);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <footer className="bg-[#0c0c0c] text-neutral-300 border-t border-neutral-900 mt-20 text-xs font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">
            
            {/* Left Brand Column: Aureva. info & contact */}
            <div className="lg:col-span-4 space-y-5">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentView('home');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="text-2xl font-serif font-bold tracking-tight text-white hover:text-neutral-200 transition-colors"
                >
                  Aureva<span className="text-[#c2834f]">.</span>
                </button>
              </div>

              <p className="text-xs text-neutral-400 leading-relaxed max-w-sm">
                Curated luxury and precision living. Verified craftsmanship across electronics,
                fashion, home, beauty and sports — delivered pan-India with care.
              </p>

              {/* Contact Details */}
              <div className="space-y-2.5 text-xs text-neutral-300 pt-1">
                <div className="flex items-center gap-3">
                  <Phone className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <span>1800-266-8899 (9 AM – 9 PM IST)</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <a href="mailto:care@aureva.in" className="hover:text-white transition-colors">
                    care@aureva.in
                  </a>
                </div>
                <div className="flex items-center gap-3 text-neutral-400">
                  <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <span>BKC, Mumbai 400051</span>
                </div>
              </div>

              {/* Circular Social Icons */}
              <div className="flex items-center gap-3 pt-3">
                <a
                  href="#instagram"
                  aria-label="Instagram"
                  className="w-8 h-8 rounded-full border border-neutral-700/80 flex items-center justify-center text-neutral-400 hover:text-white hover:border-neutral-500 transition-colors"
                >
                  <Instagram className="w-3.5 h-3.5" />
                </a>
                <a
                  href="#facebook"
                  aria-label="Facebook"
                  className="w-8 h-8 rounded-full border border-neutral-700/80 flex items-center justify-center text-neutral-400 hover:text-white hover:border-neutral-500 transition-colors"
                >
                  <Facebook className="w-3.5 h-3.5" />
                </a>
                <a
                  href="#twitter"
                  aria-label="X (Twitter)"
                  className="w-8 h-8 rounded-full border border-neutral-700/80 flex items-center justify-center text-neutral-400 hover:text-white hover:border-neutral-500 transition-colors"
                >
                  <Twitter className="w-3.5 h-3.5" />
                </a>
                <a
                  href="#youtube"
                  aria-label="YouTube"
                  className="w-8 h-8 rounded-full border border-neutral-700/80 flex items-center justify-center text-neutral-400 hover:text-white hover:border-neutral-500 transition-colors"
                >
                  <Youtube className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Middle Column 1: SHOP */}
            <div className="lg:col-span-2 space-y-3.5">
              <h4 className="text-[11px] font-semibold tracking-wider text-[#c2834f] uppercase font-mono">
                SHOP
              </h4>
              <ul className="space-y-2.5 text-xs text-neutral-300">
                <li>
                  <button
                    type="button"
                    onClick={() => handleCategoryClick('all')}
                    className="hover:text-white transition-colors"
                  >
                    All Products
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleCategoryClick('Electronics')}
                    className="hover:text-white transition-colors"
                  >
                    Electronics
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleCategoryClick('Fashion')}
                    className="hover:text-white transition-colors"
                  >
                    Fashion
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleCategoryClick('Home')}
                    className="hover:text-white transition-colors"
                  >
                    Home
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleCategoryClick('Beauty')}
                    className="hover:text-white transition-colors"
                  >
                    Beauty
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleCategoryClick('Sports')}
                    className="hover:text-white transition-colors"
                  >
                    Sports
                  </button>
                </li>
              </ul>
            </div>

            {/* Middle Column 2: CUSTOMER SERVICE */}
            <div className="lg:col-span-2 space-y-3.5">
              <h4 className="text-[11px] font-semibold tracking-wider text-[#c2834f] uppercase font-mono">
                CUSTOMER SERVICE
              </h4>
              <ul className="space-y-2.5 text-xs text-neutral-300">
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentView('profile');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="hover:text-white transition-colors"
                  >
                    My Account
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentView('orders');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="hover:text-white transition-colors"
                  >
                    Track Order
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveModal('returns')}
                    className="hover:text-white transition-colors"
                  >
                    Returns & Refunds
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setAccountTab('wishlist');
                      setCurrentView('profile');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="hover:text-white transition-colors"
                  >
                    Wishlist
                  </button>
                </li>
              </ul>
            </div>

            {/* Middle Column 3: COMPANY */}
            <div className="lg:col-span-2 space-y-3.5">
              <h4 className="text-[11px] font-semibold tracking-wider text-[#c2834f] uppercase font-mono">
                COMPANY
              </h4>
              <ul className="space-y-2.5 text-xs text-neutral-300">
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveModal('about')}
                    className="hover:text-white transition-colors"
                  >
                    About Aureva
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveModal('privacy')}
                    className="hover:text-white transition-colors"
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveModal('terms')}
                    className="hover:text-white transition-colors"
                  >
                    Terms of Service
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveModal('shipping')}
                    className="hover:text-white transition-colors"
                  >
                    Shipping Policy
                  </button>
                </li>
              </ul>
            </div>

            {/* Right Column: WE ACCEPT */}
            <div className="lg:col-span-2 space-y-3.5">
              <h4 className="text-[11px] font-semibold tracking-wider text-[#c2834f] uppercase font-mono">
                WE ACCEPT
              </h4>
              
              <div className="space-y-2 font-mono text-[11px] text-neutral-300">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="px-2.5 py-1 rounded-md bg-[#161616] border border-neutral-800 text-center">
                    UPI
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-[#161616] border border-neutral-800 text-center">
                    RuPay
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-[#161616] border border-neutral-800 text-center">
                    VISA
                  </span>
                </div>
                <div>
                  <span className="inline-block px-3 py-1 rounded-md bg-[#161616] border border-neutral-800 text-center">
                    Mastercard
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="px-2.5 py-1 rounded-md bg-[#161616] border border-neutral-800 text-center">
                    Net Banking
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-[#161616] border border-neutral-800 text-center">
                    COD
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Hairline sub-footer */}
        <div className="border-t border-neutral-900/80 py-5 px-4 text-center text-[11px] text-neutral-500">
          © {new Date().getFullYear()} Aureva Retail Pvt Ltd. All rights reserved. Pan-India Insured Logistics.
        </div>
      </footer>

      {/* Policy and Info Modals */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#141414] border border-neutral-800 rounded-2xl max-w-lg w-full p-6 text-neutral-200 shadow-2xl relative">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {activeModal === 'about' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2.5 text-white">
                  <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center text-[#c2834f]">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-serif font-semibold">About Aureva.</h3>
                    <p className="text-xs text-neutral-400">Masterpiece Living, Curated for You</p>
                  </div>
                </div>
                <div className="space-y-2.5 text-xs text-neutral-300 leading-relaxed border-t border-neutral-800 pt-4">
                  <p>
                    Aureva is India’s most considered luxury marketplace, bridging uncompromising engineering and bespoke aesthetics across 5 pillars: Electronics, Fashion, Home, Beauty, and Sports.
                  </p>
                  <p className="text-neutral-400">
                    Operating out of Bandra Kurla Complex (BKC), Mumbai, every piece in our catalogue is direct-sourced, authenticated, and delivered in tamper-evident sealed packaging.
                  </p>
                </div>
              </div>
            )}

            {activeModal === 'shipping' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2.5 text-white">
                  <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center text-[#c2834f]">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-serif font-semibold">Pan-India Shipping Policy</h3>
                    <p className="text-xs text-neutral-400">Complimentary standard delivery on orders over ₹2,999</p>
                  </div>
                </div>
                <div className="space-y-3 text-xs text-neutral-300 leading-relaxed border-t border-neutral-800 pt-4">
                  <div className="p-3 bg-neutral-900 rounded-lg border border-neutral-800">
                    <span className="font-semibold text-white block">Metro Express (Mumbai, Delhi NCR, Bengaluru, Hyderabad):</span>
                    <span className="text-neutral-400">Delivered within 24 to 48 hours via Bluedart Apex.</span>
                  </div>
                  <div className="p-3 bg-neutral-900 rounded-lg border border-neutral-800">
                    <span className="font-semibold text-white block">Rest of India:</span>
                    <span className="text-neutral-400">Delivered within 3 to 5 business days with live SMS/WhatsApp tracking.</span>
                  </div>
                </div>
              </div>
            )}

            {activeModal === 'returns' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2.5 text-white">
                  <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center text-[#c2834f]">
                    <RefreshCw className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-serif font-semibold">7-Day Effortless Returns</h3>
                    <p className="text-xs text-neutral-400">Doorstep pickup across 19,000+ pin codes</p>
                  </div>
                </div>
                <div className="space-y-2.5 text-xs text-neutral-300 leading-relaxed border-t border-neutral-800 pt-4">
                  <ul className="list-disc pl-4 space-y-1.5 text-neutral-300">
                    <li>7-day return window from the day of confirmed delivery.</li>
                    <li>Items must remain in original unused condition with tags and packaging.</li>
                    <li>Complimentary doorstep pickup by our courier partner.</li>
                    <li>Refunds processed directly via original payment or instant UPI.</li>
                  </ul>
                </div>
              </div>
            )}

            {activeModal === 'privacy' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2.5 text-white">
                  <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center text-[#c2834f]">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-serif font-semibold">Privacy Policy</h3>
                    <p className="text-xs text-neutral-400">Data Protection & Encryption</p>
                  </div>
                </div>
                <div className="space-y-2 text-xs text-neutral-300 leading-relaxed border-t border-neutral-800 pt-4">
                  <p>
                    Aureva maintains strict compliance with Indian Digital Personal Data Protection standards. All payment transactions are encrypted with 256-bit SSL protocols.
                  </p>
                </div>
              </div>
            )}

            {activeModal === 'terms' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2.5 text-white">
                  <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center text-[#c2834f]">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-serif font-semibold">Terms of Service</h3>
                    <p className="text-xs text-neutral-400">Commercial Marketplace Agreement</p>
                  </div>
                </div>
                <div className="space-y-2 text-xs text-neutral-300 leading-relaxed border-t border-neutral-800 pt-4">
                  <p>
                    All products are guaranteed 100% authentic with manufacturer warranty. Prices are displayed in ₹; applicable GST is calculated at checkout.
                  </p>
                </div>
              </div>
            )}

            <div className="mt-5 pt-3 border-t border-neutral-800 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
