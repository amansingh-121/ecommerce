import React, { useState } from 'react';
import {
  ShieldCheck,
  Check,
  ArrowRight,
  ArrowLeft,
  Truck,
  CreditCard,
  MapPin,
  Lock,
  Tag,
  AlertCircle,
} from 'lucide-react';
import { useStore } from '../context/StoreContext.tsx';
import { Address, PaymentMethod } from '../types/ecommerce.ts';
import { ProductImage } from '../components/ProductImage.tsx';
import { formatPrice } from '../utils/currency.ts';

export const CheckoutPage: React.FC = () => {
  const {
    cart,
    pricing,
    appliedCoupon,
    applyCouponCode,
    removeCoupon,
    deliveryMethod,
    setDeliveryMethod,
    currentUser,
    clearCart,
    setCurrentView,
    setSelectedOrderId,
    showToast,
  } = useStore();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Address form
  const defaultAddr = currentUser.savedAddresses[0] || {
    id: 'addr-new',
    fullName: currentUser.name || 'Alex Thorne',
    phone: currentUser.phone || '+91 98200 12345',
    street: 'Bandra Kurla Complex, Unit 1204',
    city: 'Mumbai',
    state: 'Maharashtra',
    postalCode: '400051',
    country: 'India',
  };

  const [shippingAddress, setShippingAddress] = useState<Address>(defaultAddr);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Credit / Debit Card');
  const [couponInput, setCouponInput] = useState('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  // Card details state
  const [cardNumber, setCardNumber] = useState('•••• •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('888');

  // UPI ID state
  const [upiId, setUpiId] = useState('alex@okaxis');

  const isAddressComplete = Boolean(
    shippingAddress.fullName.trim() &&
      shippingAddress.phone.trim() &&
      shippingAddress.street.trim() &&
      shippingAddress.city.trim() &&
      shippingAddress.state.trim() &&
      shippingAddress.postalCode.trim() &&
      shippingAddress.country.trim()
  );

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-neutral-900 mb-2">Your Shopping Bag is Empty</h2>
        <p className="text-xs text-neutral-500 mb-6">
          Add items to your cart before proceeding through checkout.
        </p>
        <button
          onClick={() => setCurrentView('catalog')}
          className="px-6 py-2.5 bg-neutral-900 text-white rounded-lg text-xs font-semibold"
        >
          Explore Catalog
        </button>
      </div>
    );
  }

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    const res = await applyCouponCode(couponInput.trim());
    if (res.success) {
      setCouponInput('');
    }
  };

  const handlePlaceOrder = async () => {
    if (!isAddressComplete) {
      setCurrentStep(1);
      setOrderError('Please complete all shipping address fields before placing your order.');
      showToast('Please complete your shipping address', 'error');
      return;
    }

    setIsSubmittingOrder(true);
    setOrderError(null);

    try {
      const payload = {
        userId: currentUser.id,
        customerName: shippingAddress.fullName,
        customerEmail: currentUser.email,
        customerPhone: shippingAddress.phone,
        shippingAddress,
        deliveryMethod,
        paymentMethod,
        items: cart.map((i) => ({
          productId: i.productId,
          variantId: i.variantId,
          quantity: i.quantity,
        })),
        couponCode: appliedCoupon?.code,
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setOrderError(data.error || 'Failed to authorize order.');
        setIsSubmittingOrder(false);
        return;
      }

      // Successful order
      clearCart();
      setSelectedOrderId(data.order.id);
      setCurrentView('orders');
      showToast(`Order #${data.order.orderNumber} successfully confirmed!`);
    } catch (err: any) {
      setOrderError(err.message || 'An unexpected payment error occurred.');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Checkout Progress Stepper */}
      <div className="mb-10 max-w-2xl mx-auto">
        <div className="flex items-center justify-between">
          {[
            { step: 1, label: 'Address' },
            { step: 2, label: 'Delivery' },
            { step: 3, label: 'Payment' },
            { step: 4, label: 'Review' },
          ].map((item, idx) => {
            const isCompleted = currentStep > item.step;
            const isCurrent = currentStep === item.step;
            return (
              <React.Fragment key={item.step}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isCompleted
                        ? 'bg-neutral-900 text-white'
                        : isCurrent
                        ? 'border-2 border-neutral-900 text-neutral-900 bg-white font-extrabold'
                        : 'bg-neutral-200 text-neutral-500'
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4" /> : item.step}
                  </div>
                  <span
                    className={`text-[11px] mt-1.5 font-medium ${
                      isCurrent ? 'text-neutral-900 font-bold' : 'text-neutral-500'
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
                {idx < 3 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 -mt-5 ${
                      currentStep > idx + 1 ? 'bg-neutral-900' : 'bg-neutral-200'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Step Forms */}
        <div className="lg:col-span-7 bg-white border border-neutral-200/90 rounded-2xl p-6 sm:p-8 shadow-xs">
          {/* STEP 1: ADDRESS */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-neutral-900 font-display">
                  1. Shipping & Contact Address
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Enter destination coordinates for your priority dispatch.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    value={shippingAddress.fullName}
                    onChange={(e) =>
                      setShippingAddress({ ...shippingAddress, fullName: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-neutral-900"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={shippingAddress.phone}
                    onChange={(e) =>
                      setShippingAddress({ ...shippingAddress, phone: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-neutral-900"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-neutral-700 block mb-1">
                    Street Address & Suite
                  </label>
                  <input
                    type="text"
                    value={shippingAddress.street}
                    onChange={(e) =>
                      setShippingAddress({ ...shippingAddress, street: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-neutral-900"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-neutral-700 block mb-1">City</label>
                  <input
                    type="text"
                    value={shippingAddress.city}
                    onChange={(e) =>
                      setShippingAddress({ ...shippingAddress, city: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-neutral-900"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-neutral-700 block mb-1">State / Province</label>
                  <input
                    type="text"
                    value={shippingAddress.state}
                    onChange={(e) =>
                      setShippingAddress({ ...shippingAddress, state: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-neutral-900"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Postal Code</label>
                  <input
                    type="text"
                    value={shippingAddress.postalCode}
                    onChange={(e) =>
                      setShippingAddress({ ...shippingAddress, postalCode: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-neutral-900"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Country</label>
                  <input
                    type="text"
                    value={shippingAddress.country}
                    onChange={(e) =>
                      setShippingAddress({ ...shippingAddress, country: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-neutral-900"
                    required
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (!isAddressComplete) {
                      showToast('Please complete all shipping address fields', 'error');
                      return;
                    }
                    setCurrentStep(2);
                  }}
                  className="px-6 py-3 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-xl flex items-center gap-2"
                >
                  <span>Continue to Delivery</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: DELIVERY METHOD */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-neutral-900 font-display">
                  2. Select Delivery Method
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Choose transit velocity and handling options.
                </p>
              </div>

              <div className="space-y-3">
                <label
                  onClick={() => setDeliveryMethod('standard')}
                  className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                    deliveryMethod === 'standard'
                      ? 'border-neutral-900 bg-neutral-50 ring-1 ring-neutral-900'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Truck className="w-5 h-5 text-neutral-700" />
                    <div>
                      <div className="text-xs font-bold text-neutral-900">
                        Standard Carbon-Neutral Delivery
                      </div>
                      <div className="text-[11px] text-neutral-500">
                        Delivered in 3–5 business days via tracked carrier
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-neutral-900 tabular-nums">
                    {pricing.qualifiesForFreeShipping ? 'FREE' : formatPrice(99)}
                  </span>
                </label>

                <label
                  onClick={() => setDeliveryMethod('express')}
                  className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                    deliveryMethod === 'express'
                      ? 'border-neutral-900 bg-neutral-50 ring-1 ring-neutral-900'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Truck className="w-5 h-5 text-neutral-900" />
                    <div>
                      <div className="text-xs font-bold text-neutral-900">
                        Express Priority Courier
                      </div>
                      <div className="text-[11px] text-neutral-500">
                        Guaranteed arrival in 1–2 business days with signature release
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-neutral-900 tabular-nums">{formatPrice(199)}</span>
                </label>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Address</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-6 py-3 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-xl flex items-center gap-2"
                >
                  <span>Continue to Payment</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: PAYMENT METHOD */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-neutral-900 font-display">
                  3. Select Payment Gateway
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Encrypted 256-bit TLS secure payment channel.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                {(
                  [
                    'Credit / Debit Card',
                    'UPI / Instant Pay',
                    'Net Banking',
                    'Cash on Delivery (COD)',
                  ] as PaymentMethod[]
                ).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`p-3.5 rounded-xl border text-left font-semibold transition-all ${
                      paymentMethod === method
                        ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs'
                        : 'border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-800'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>

              {/* Mock fields based on method */}
              {paymentMethod === 'Credit / Debit Card' && (
                <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3 text-xs">
                  <div>
                    <label className="font-bold text-neutral-700 block mb-1">Card Number</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-neutral-700 block mb-1">Expiration</label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg font-mono"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-neutral-700 block mb-1">CVV / CVC</label>
                      <input
                        type="password"
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'UPI / Instant Pay' && (
                <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2 text-xs">
                  <label className="font-bold text-neutral-700 block">Virtual Payment Address (VPA / UPI ID)</label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg"
                  />
                  <p className="text-[11px] text-neutral-500">
                    A payment request will be sent to your UPI application upon final authorization.
                  </p>
                </div>
              )}

              {paymentMethod === 'Cash on Delivery (COD)' && (
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 leading-relaxed">
                  <strong>Cash on Delivery (COD) Selected:</strong> Please ensure the exact total of{' '}
                  <strong className="underline">{formatPrice(pricing.total)}</strong> is available in cash or local QR scan upon delivery.
                </div>
              )}

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Delivery</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="px-6 py-3 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-xl flex items-center gap-2"
                >
                  <span>Review Order</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: ORDER REVIEW */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-neutral-900 font-display">
                  4. Review & Authorize Order
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Confirm shipping coordinates and payment arrangement.
                </p>
              </div>

              {orderError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{orderError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                  <span className="font-bold text-neutral-900 block mb-1">Destination</span>
                  <p className="text-neutral-600 leading-relaxed">
                    {shippingAddress.fullName}
                    <br />
                    {shippingAddress.street}
                    <br />
                    {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}
                    <br />
                    {shippingAddress.country}
                  </p>
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="text-[11px] font-bold text-neutral-900 underline mt-2"
                  >
                    Edit
                  </button>
                </div>

                <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                  <span className="font-bold text-neutral-900 block mb-1">Payment & Shipping</span>
                  <p className="text-neutral-600 leading-relaxed">
                    Method: <strong>{paymentMethod}</strong>
                    <br />
                    Delivery: <strong>{deliveryMethod === 'express' ? 'Express Courier' : 'Standard'}</strong>
                  </p>
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="text-[11px] font-bold text-neutral-900 underline mt-2"
                  >
                    Edit
                  </button>
                </div>
              </div>

              <div className="pt-4 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Payment</span>
                </button>

                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  disabled={isSubmittingOrder}
                  className="px-8 py-4 bg-neutral-950 hover:bg-neutral-800 text-white text-sm font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>{isSubmittingOrder ? 'Processing...' : `Place Order · ${formatPrice(pricing.total)}`}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar: Order Summary */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 shadow-xs space-y-4">
            <h4 className="text-sm font-bold text-neutral-900 uppercase tracking-wider font-display border-b border-neutral-100 pb-3">
              Order Summary ({cart.reduce((s, i) => s + i.quantity, 0)} items)
            </h4>

            {/* Item lines */}
            <div className="divide-y divide-neutral-100 max-h-72 overflow-y-auto pr-1">
              {cart.map((item) => (
                <div key={item.id} className="py-3 flex gap-3">
                  <div className="w-14 h-14 rounded-lg bg-neutral-100 overflow-hidden shrink-0 border border-neutral-200/60">
                    <ProductImage
                      src={item.product.thumbnail || item.product.images[0]}
                      alt={item.product.name}
                      aspectRatio="square"
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-between text-xs">
                    <div>
                      <div className="font-semibold text-neutral-900 line-clamp-1">
                        {item.product.name}
                      </div>
                      {item.variantName && (
                        <div className="text-[11px] text-neutral-500">{item.variantName}</div>
                      )}
                    </div>
                    <div className="flex justify-between items-baseline text-neutral-600">
                      <span>Qty: {item.quantity}</span>
                      <span className="font-bold text-neutral-900 tabular-nums">
                        {formatPrice(item.unitPrice * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Promo Code Box */}
            <div className="pt-2 border-t border-neutral-100">
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-emerald-50 text-emerald-800 px-3 py-2 rounded-lg text-xs">
                  <span className="font-semibold">{appliedCoupon.code} (-{formatPrice(pricing.discount)})</span>
                  <button onClick={removeCoupon} className="hover:underline font-medium">Remove</button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter coupon code"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    className="flex-1 px-3 py-2 text-xs uppercase bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-neutral-900 text-white text-xs font-semibold rounded-lg hover:bg-neutral-800 transition-colors"
                  >
                    Apply
                  </button>
                </form>
              )}
            </div>

            {/* Price lines */}
            <div className="pt-2 border-t border-neutral-100 space-y-2 text-xs text-neutral-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-neutral-900 tabular-nums">
                  {formatPrice(pricing.subtotal)}
                </span>
              </div>
              {pricing.discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Promo Discount</span>
                  <span className="font-semibold tabular-nums">-{formatPrice(pricing.discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Shipping ({deliveryMethod})</span>
                <span className="tabular-nums">
                  {pricing.shippingFee === 0 ? 'Complimentary' : formatPrice(pricing.shippingFee)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>GST (18%)</span>
                <span className="tabular-nums">{formatPrice(pricing.tax)}</span>
              </div>
              <div className="pt-3 border-t border-neutral-200 flex justify-between text-base font-bold text-neutral-950">
                <span>Total Due</span>
                <span className="tabular-nums">{formatPrice(pricing.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
