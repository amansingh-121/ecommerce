import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { StoreProvider, useStore } from './context/StoreContext.tsx';
import { Header } from './components/Header.tsx';
import { Footer } from './components/Footer.tsx';
import { CartDrawer } from './components/CartDrawer.tsx';
import { StyleConciergeModal } from './components/StyleConciergeModal.tsx';
import { QuickViewModal } from './components/QuickViewModal.tsx';

// Page Views
import { HomePage } from './pages/HomePage.tsx';
import { CatalogPage } from './pages/CatalogPage.tsx';
import { ProductDetailPage } from './pages/ProductDetailPage.tsx';
import { CheckoutPage } from './pages/CheckoutPage.tsx';
import { OrdersPage } from './pages/OrdersPage.tsx';
import { AccountPage } from './pages/AccountPage.tsx';
import { AdminDashboard } from './pages/AdminDashboard.tsx';

const AppContent: React.FC = () => {
  const { currentView, selectedProductId } = useStore();
  const [isNavigating, setIsNavigating] = useState(false);

  // Smooth scroll to top and trigger silky progress bar on route changes
  useEffect(() => {
    setIsNavigating(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const timer = setTimeout(() => setIsNavigating(false), 300);
    return () => clearTimeout(timer);
  }, [currentView, selectedProductId]);

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50/70 text-neutral-900 selection:bg-neutral-900 selection:text-white font-sans relative">
      {/* Sleek top transition progress bar for smooth navigation feedback */}
      <div
        className={`fixed top-0 left-0 right-0 h-0.5 bg-[#965b2a] z-50 transition-all duration-300 ease-out pointer-events-none ${
          isNavigating ? 'w-full opacity-100' : 'w-0 opacity-0'
        }`}
      />

      <Header />

      <main className="flex-1 overflow-x-hidden relative">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentView + (currentView === 'product-detail' ? `-${selectedProductId}` : '')}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="w-full h-full"
          >
            {currentView === 'home' && <HomePage />}
            {currentView === 'catalog' && <CatalogPage />}
            {currentView === 'product-detail' && <ProductDetailPage />}
            {currentView === 'checkout' && <CheckoutPage />}
            {currentView === 'orders' && <OrdersPage />}
            {currentView === 'profile' && <AccountPage />}
            {currentView === 'admin' && <AdminDashboard />}
          </motion.div>
        </AnimatePresence>
      </main>

      <Footer />

      {/* Global Interactive Overlays */}
      <CartDrawer />
      <StyleConciergeModal />
      <QuickViewModal />
    </div>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}
