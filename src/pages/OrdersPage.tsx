import React, { useState, useEffect } from 'react';
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  RotateCcw,
  XCircle,
  ChevronRight,
  FileText,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { useStore } from '../context/StoreContext.tsx';
import { Order, OrderStatus } from '../types/ecommerce.ts';
import { ProductImage } from '../components/ProductImage.tsx';
import { formatPrice } from '../utils/currency.ts';
import { useOverlay } from '../hooks/useOverlay.ts';

export const OrdersPage: React.FC = () => {
  const {
    currentUser,
    selectedOrderId,
    setSelectedOrderId,
    setCurrentView,
    showToast,
  } = useStore();

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeOrderModal, setActiveOrderModal] = useState<Order | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  const closeOrderModal = () => {
    setActiveOrderModal(null);
    setSelectedOrderId(null);
  };

  useOverlay(Boolean(activeOrderModal), closeOrderModal);
  useOverlay(cancelModalOpen, () => setCancelModalOpen(false));

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/orders?userId=${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
        if (selectedOrderId) {
          const match = data.orders.find((o: Order) => o.id === selectedOrderId);
          if (match) setActiveOrderModal(match);
        }
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [currentUser.id]);

  const handleCancelOrder = async (orderId: string) => {
    if (!cancelReason.trim()) return;
    setIsProcessingAction(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Order cancelled and refund processed.');
        setCancelModalOpen(false);
        setActiveOrderModal(data.order);
        fetchOrders();
      } else {
        showToast(data.error || 'Failed to cancel order', 'error');
      }
    } catch (err) {
      showToast('Error cancelling order', 'error');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleReturnOrder = async (orderId: string) => {
    const reason = window.prompt('Please provide a reason for the return request:');
    if (!reason) return;
    setIsProcessingAction(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Return label generated and return initiated.');
        setActiveOrderModal(data.order);
        fetchOrders();
      } else {
        showToast(data.error || 'Failed to initiate return', 'error');
      }
    } catch (err) {
      showToast('Error processing return', 'error');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'Delivered':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Shipped':
      case 'Out for Delivery':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'Confirmed':
      case 'Processing':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Cancelled':
      case 'Returned':
        return 'bg-neutral-100 text-neutral-600 border-neutral-300';
      case 'Pending':
      default:
        return 'bg-neutral-100 text-neutral-800 border-neutral-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-950 font-display">
          My Order History & Tracking
        </h1>
        <p className="text-xs text-neutral-500 mt-1">
          Review dispatch statuses, courier tracking numbers, invoices, and return requests.
        </p>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-xs text-neutral-500 italic">
          Loading order history...
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-2xl p-12 text-center max-w-md mx-auto space-y-4">
          <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 mx-auto">
            <Package className="w-6 h-6 stroke-[1.5]" />
          </div>
          <h3 className="text-base font-bold text-neutral-900">No Orders Found</h3>
          <p className="text-xs text-neutral-500 leading-relaxed">
            You haven't placed any orders yet. Discover our latest series models.
          </p>
          <button
            onClick={() => setCurrentView('catalog')}
            className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-xl"
          >
            Explore Catalog
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-xs space-y-6"
            >
              {/* Order Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100 text-xs">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-sm text-neutral-950">
                      {order.orderNumber}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded border text-[11px] font-semibold ${getStatusBadge(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <div className="text-neutral-500 mt-1">
                    Placed on {new Date(order.createdAt).toLocaleDateString()} · Carrier:{' '}
                    <span className="font-mono font-semibold text-neutral-800">
                      {order.trackingNumber}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveOrderModal(order)}
                    className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Track Status & Invoice</span>
                  </button>
                </div>
              </div>

              {/* Items List */}
              <div className="divide-y divide-neutral-100">
                {order.items.map((item, idx) => (
                  <div key={idx} className="py-3 flex items-center justify-between gap-4 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-lg bg-neutral-100 overflow-hidden shrink-0 border border-neutral-200/60">
                        <ProductImage
                          src={item.productImage}
                          alt={item.productName}
                          aspectRatio="square"
                        />
                      </div>
                      <div>
                        <h4 className="font-bold text-neutral-900">{item.productName}</h4>
                        {item.variantName && (
                          <span className="text-[11px] text-neutral-500 block">
                            Variant: {item.variantName}
                          </span>
                        )}
                        <span className="text-neutral-500 text-[11px]">Qty: {item.quantity}</span>
                      </div>
                    </div>

                    <div className="font-bold text-neutral-900 tabular-nums">
                      {formatPrice(item.subtotal)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Footer & Total */}
              <div className="pt-4 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-neutral-600 gap-2">
                <div>
                  Paid via <strong>{order.paymentMethod}</strong> ({order.paymentStatus})
                </div>
                <div className="text-sm font-bold text-neutral-950 flex items-center gap-2">
                  <span>Grand Total:</span>
                  <span className="text-base tabular-nums">{formatPrice(order.total)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TRACKING TIMELINE & INVOICE MODAL */}
      {activeOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-neutral-900/50 backdrop-blur-xs"
            onClick={closeOrderModal}
          />

          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-neutral-950 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold font-display tracking-tight">
                  Order Tracking & Invoice
                </h3>
                <span className="text-[11px] text-neutral-400 font-mono">
                  {activeOrderModal.orderNumber} · Carrier {activeOrderModal.trackingNumber}
                </span>
              </div>
              <button
                onClick={closeOrderModal}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Status Timeline */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                  Live Dispatch Progression
                </h4>

                <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-neutral-200">
                  {activeOrderModal.timeline.map((event, idx) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-neutral-900 border-2 border-white flex items-center justify-center" />
                      <div className="text-xs font-bold text-neutral-900 flex items-center gap-2">
                        <span>{event.status}</span>
                        <span className="text-[10px] text-neutral-400 font-normal">
                          {new Date(event.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-600 mt-0.5">{event.message}</p>
                      {event.location && (
                        <span className="text-[10px] font-mono text-neutral-400 block mt-0.5">
                          Location: {event.location}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Destination & Payment details */}
              <div className="grid grid-cols-2 gap-4 text-xs pt-4 border-t border-neutral-100">
                <div className="bg-neutral-50 p-4 rounded-xl">
                  <span className="font-bold text-neutral-900 block mb-1">Shipping Address</span>
                  <p className="text-neutral-600 leading-relaxed">
                    {activeOrderModal.shippingAddress.fullName}
                    <br />
                    {activeOrderModal.shippingAddress.street}
                    <br />
                    {activeOrderModal.shippingAddress.city},{' '}
                    {activeOrderModal.shippingAddress.state}{' '}
                    {activeOrderModal.shippingAddress.postalCode}
                  </p>
                </div>

                <div className="bg-neutral-50 p-4 rounded-xl">
                  <span className="font-bold text-neutral-900 block mb-1">Financial Receipt</span>
                  <div className="space-y-1 text-neutral-600">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span className="tabular-nums">{formatPrice(activeOrderModal.subtotal)}</span>
                    </div>
                    {activeOrderModal.discount > 0 && (
                      <div className="flex justify-between text-emerald-700">
                        <span>Discount:</span>
                        <span className="tabular-nums">-{formatPrice(activeOrderModal.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Shipping:</span>
                      <span className="tabular-nums">
                        {activeOrderModal.shippingFee === 0
                          ? 'Free'
                          : formatPrice(activeOrderModal.shippingFee)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>GST:</span>
                      <span className="tabular-nums">{formatPrice(activeOrderModal.tax)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-neutral-900 pt-1 border-t border-neutral-200">
                      <span>Total:</span>
                      <span className="tabular-nums">{formatPrice(activeOrderModal.total)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Actions (Cancel / Return) */}
              <div className="pt-4 border-t border-neutral-100 flex items-center justify-between text-xs">
                {activeOrderModal.status === 'Pending' ||
                activeOrderModal.status === 'Confirmed' ? (
                  <button
                    onClick={() => setCancelModalOpen(true)}
                    className="px-4 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-semibold rounded-lg transition-colors"
                  >
                    Cancel Order & Request Full Refund
                  </button>
                ) : activeOrderModal.status === 'Delivered' ? (
                  <button
                    onClick={() => handleReturnOrder(activeOrderModal.id)}
                    className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Initiate 7-Day Return</span>
                  </button>
                ) : (
                  <span className="text-neutral-500 text-[11px]">
                    Status is locked at this stage. Contact concierge for changes.
                  </span>
                )}

                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 border border-neutral-200 hover:bg-neutral-50 text-neutral-800 font-semibold rounded-lg flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Print Receipt</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CANCEL ORDER CONFIRMATION MODAL */}
      {cancelModalOpen && activeOrderModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs"
            onClick={() => setCancelModalOpen(false)}
          />
          <div className="relative w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-neutral-200 space-y-4">
            <h4 className="text-base font-bold text-neutral-900 font-display">
              Confirm Order Cancellation
            </h4>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Order #{activeOrderModal.orderNumber} will be aborted immediately. A full refund of{' '}
              <strong className="text-neutral-900">{formatPrice(activeOrderModal.total)}</strong> will be credited to your original payment method.
            </p>

            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">
                Reason for cancellation
              </label>
              <textarea
                rows={3}
                placeholder="Changed mind, placed duplicate order, etc."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:border-neutral-900"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900"
              >
                Keep Order
              </button>
              <button
                type="button"
                disabled={isProcessingAction || !cancelReason.trim()}
                onClick={() => handleCancelOrder(activeOrderModal.id)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors"
              >
                {isProcessingAction ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
