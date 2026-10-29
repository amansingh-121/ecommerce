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
  Download,
} from 'lucide-react';
import { useStore } from '../context/StoreContext.tsx';
import { InvoiceData, Order, OrderStatus } from '../types/ecommerce.ts';
import { ProductImage } from '../components/ProductImage.tsx';
import { formatPrice } from '../utils/currency.ts';
import { useOverlay } from '../hooks/useOverlay.ts';

type OrderFilter = 'all' | 'active' | 'delivered' | 'cancelled';

const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  'Pending',
  'Confirmed',
  'Processing',
  'Shipped',
  'Out for Delivery',
];

function escapeHtml(value: string | number | undefined | null): string {
  return String(value ?? '').replace(/[&<>"']/g, (character) => {
    switch (character) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      default:
        return '&#39;';
    }
  });
}

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
  const [statusFilter, setStatusFilter] = useState<OrderFilter>('all');
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<string | null>(null);

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

  const handleDownloadInvoice = async (order: Order) => {
    setDownloadingInvoiceId(order.id);
    try {
      const res = await fetch(`/api/orders/${order.id}/invoice`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invoice is unavailable.');
      }

      const invoice = data.invoice as InvoiceData;
      const address = invoice.shippingAddress;
      const itemRows = invoice.items
        .map(
          (item) => `
            <tr>
              <td>
                <strong>${escapeHtml(item.productName)}</strong>
                ${
                  item.variantName
                    ? `<span class="muted">${escapeHtml(item.variantName)}</span>`
                    : ''
                }
              </td>
              <td class="right">${item.quantity}</td>
              <td class="right">${formatPrice(item.unitPrice)}</td>
              <td class="right">${formatPrice(item.subtotal)}</td>
            </tr>`
        )
        .join('');

      const invoiceHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(invoice.invoiceNumber)}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif; margin: 0; padding: 40px; color: #171717; background: #ffffff; }
    .header { display: flex; justify-content: space-between; gap: 24px; align-items: flex-start; }
    h1 { margin: 0; font-size: 26px; letter-spacing: 0.18em; }
    h2 { margin: 0 0 6px; font-size: 16px; text-transform: uppercase; letter-spacing: 0.12em; }
    .muted { display: block; margin-top: 2px; color: #737373; font-size: 11px; }
    .meta { margin-top: 6px; font-size: 11px; line-height: 1.6; color: #525252; }
    .rule { border: 0; border-top: 1px solid #e5e5e5; margin: 24px 0; }
    .grid { display: flex; gap: 48px; font-size: 11px; line-height: 1.7; }
    .grid > div { flex: 1; }
    .label { color: #737373; text-transform: uppercase; letter-spacing: 0.08em; font-size: 10px; font-weight: 600; }
    table { width: 100%; border-collapse: collapse; margin-top: 24px; font-size: 11px; }
    th { text-align: left; background: #f5f5f5; padding: 9px 10px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: #525252; }
    td { padding: 10px; border-bottom: 1px solid #ededed; vertical-align: top; }
    .right { text-align: right; }
    .totals { width: 300px; margin-left: auto; margin-top: 18px; font-size: 11px; }
    .totals div { display: flex; justify-content: space-between; padding: 4px 0; }
    .totals .grand { border-top: 1px solid #d4d4d4; margin-top: 6px; padding-top: 8px; font-size: 14px; font-weight: 700; }
    .footer { margin-top: 36px; font-size: 10px; color: #737373; line-height: 1.7; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>AUREVA</h1>
      <div class="meta">
        Aureva Commerce Private Limited<br />
        Bandra Kurla Complex, Mumbai 400051, India<br />
        GSTIN: ${escapeHtml(invoice.gstin)}
      </div>
    </div>
    <div style="text-align: right;">
      <h2>Tax Invoice</h2>
      <div class="meta">
        ${escapeHtml(invoice.invoiceNumber)}<br />
        Issued ${new Date(invoice.issuedAt).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })}<br />
        Order ${escapeHtml(invoice.orderNumber)}
      </div>
    </div>
  </div>

  <hr class="rule" />

  <div class="grid">
    <div>
      <div class="label">Billed To</div>
      <strong>${escapeHtml(invoice.customerName)}</strong><br />
      ${escapeHtml(invoice.customerEmail)}<br />
      ${escapeHtml(invoice.customerPhone)}
    </div>
    <div>
      <div class="label">Shipping Address</div>
      <strong>${escapeHtml(address.fullName)}</strong><br />
      ${escapeHtml(address.street)}<br />
      ${escapeHtml(address.city)}, ${escapeHtml(address.state)} ${escapeHtml(address.postalCode)}<br />
      ${escapeHtml(address.country)}
    </div>
    <div>
      <div class="label">Payment</div>
      ${escapeHtml(invoice.paymentMethod)}<br />
      Status: ${escapeHtml(invoice.paymentStatus)}<br />
      ${invoice.couponCode ? `Coupon: ${escapeHtml(invoice.couponCode)}` : 'No coupon applied'}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th class="right">Qty</th>
        <th class="right">Unit Price</th>
        <th class="right">Amount</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>

  <div class="totals">
    <div><span>Subtotal</span><span>${formatPrice(invoice.subtotal)}</span></div>
    ${
      invoice.discount > 0
        ? `<div><span>Discount</span><span>-${formatPrice(invoice.discount)}</span></div>`
        : ''
    }
    <div><span>Shipping</span><span>${
      invoice.shippingFee === 0 ? 'Complimentary' : formatPrice(invoice.shippingFee)
    }</span></div>
    <div><span>GST (18%)</span><span>${formatPrice(invoice.tax)}</span></div>
    <div class="grand"><span>Total</span><span>${formatPrice(invoice.total)}</span></div>
  </div>

  <div class="footer">
    This is a computer-generated tax invoice and does not require a signature.<br />
    Prices are inclusive of GST where applicable. For assistance, contact care@aureva.com.
  </div>
</body>
</html>`;

      const blob = new Blob([invoiceHtml], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${invoice.invoiceNumber}.html`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      showToast(`Invoice ${invoice.invoiceNumber} downloaded`);
    } catch (err: any) {
      showToast(err.message || 'Could not download invoice', 'error');
    } finally {
      setDownloadingInvoiceId(null);
    }
  };

  const activeOrders = orders.filter((order) =>
    ACTIVE_ORDER_STATUSES.includes(order.status)
  );
  const deliveredOrders = orders.filter((order) => order.status === 'Delivered');
  const cancelledOrders = orders.filter((order) =>
    ['Cancelled', 'Returned'].includes(order.status)
  );

  const filteredOrders = orders.filter((order) => {
    if (statusFilter === 'active') return ACTIVE_ORDER_STATUSES.includes(order.status);
    if (statusFilter === 'delivered') return order.status === 'Delivered';
    if (statusFilter === 'cancelled') return ['Cancelled', 'Returned'].includes(order.status);
    return true;
  });

  const filterOptions: { id: OrderFilter; label: string; count: number }[] = [
    { id: 'all', label: 'All Orders', count: orders.length },
    { id: 'active', label: 'In Progress', count: activeOrders.length },
    { id: 'delivered', label: 'Delivered', count: deliveredOrders.length },
    { id: 'cancelled', label: 'Cancelled & Returns', count: cancelledOrders.length },
  ];

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

      {!isLoading && orders.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {filterOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setStatusFilter(option.id)}
              className={`rounded-full border px-3.5 py-2 text-[11px] font-semibold transition-colors ${
                statusFilter === option.id
                  ? 'border-neutral-900 bg-neutral-900 text-white'
                  : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:text-neutral-900'
              }`}
            >
              {option.label}
              <span
                className={`ml-1.5 tabular-nums ${
                  statusFilter === option.id ? 'text-neutral-300' : 'text-neutral-400'
                }`}
              >
                ({option.count})
              </span>
            </button>
          ))}
        </div>
      )}

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
