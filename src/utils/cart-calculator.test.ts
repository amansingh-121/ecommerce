import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateSubtotal,
  validateCoupon,
  calculateOrderPricing,
  FREE_SHIPPING_THRESHOLD,
  STANDARD_SHIPPING_FEE,
  EXPRESS_SHIPPING_FEE,
  TAX_RATE,
} from './cart-calculator.ts';
import { CartItem, Coupon } from '../types/ecommerce.ts';

const mockProduct = {
  id: 'prod-1',
  slug: 'studio-headphones',
  name: 'Studio Master Headphones',
  brand: 'Acoustic Labs',
  category: 'Electronics',
  subcategory: 'Audio',
  sku: 'AL-SMH-01',
  description: 'Premium headphones',
  shortDescription: 'High-res audio',
  basePrice: 120,
  originalPrice: 150,
  discountPercentage: 20,
  rating: 4.8,
  reviewCount: 42,
  totalStock: 15,
  images: [],
  thumbnail: '',
  variants: [],
  specifications: [],
  tags: [],
  inStock: true,
  createdAt: '2026-01-01',
};

const mockCart: CartItem[] = [
  {
    id: 'item-1',
    productId: 'prod-1',
    product: mockProduct,
    unitPrice: 1500,
    quantity: 2,
  },
];

const mockCouponPercentage: Coupon = {
  code: 'AUREVA20',
  discountType: 'percentage',
  discountValue: 20,
  minimumOrder: 2000,
  maximumDiscount: 500,
  expiryDate: '2030-01-01',
  usedCount: 5,
  isActive: true,
  description: '20% off orders over ₹2,000',
};

const mockCouponFixed: Coupon = {
  code: 'SAVE500',
  discountType: 'fixed',
  discountValue: 500,
  minimumOrder: 3000,
  expiryDate: '2030-01-01',
  usedCount: 0,
  isActive: true,
  description: '₹500 off orders over ₹3,000',
};

test('calculateSubtotal handles items correctly', () => {
  assert.equal(calculateSubtotal([]), 0);
  assert.equal(calculateSubtotal(mockCart), 3000); // 1500 * 2
});

test('validateCoupon checks minimum order requirement', () => {
  const result = validateCoupon(mockCouponPercentage, 1000);
  assert.equal(result.valid, false);
  assert.match(result.error || '', /Minimum order amount/);
});

test('validateCoupon applies percentage discount with maximum cap', () => {
  // 20% of 3000 = 600, but max discount is 500
  const result = validateCoupon(mockCouponPercentage, 3000);
  assert.equal(result.valid, true);
  assert.equal(result.discountAmount, 500);

  // 20% of 2000 = 400, within cap
  const result2 = validateCoupon(mockCouponPercentage, 2000);
  assert.equal(result2.valid, true);
  assert.equal(result2.discountAmount, 400);
});

test('validateCoupon applies fixed discount', () => {
  const result = validateCoupon(mockCouponFixed, 4000);
  assert.equal(result.valid, true);
  assert.equal(result.discountAmount, 500);
});

test('calculateOrderPricing qualifies for free shipping when above threshold', () => {
  const summary = calculateOrderPricing(mockCart, 'standard', null); // ₹3,000 > ₹2,999
  assert.equal(summary.subtotal, 3000);
  assert.equal(summary.qualifiesForFreeShipping, true);
  assert.equal(summary.shippingFee, 0);
  assert.equal(summary.tax, Number((3000 * TAX_RATE).toFixed(2)));
  assert.equal(summary.total, Number((3000 + 3000 * TAX_RATE).toFixed(2)));
});

test('calculateOrderPricing charges standard shipping fee when below threshold', () => {
  const singleItemCart: CartItem[] = [
    {
      id: 'item-2',
      productId: 'prod-1',
      product: mockProduct,
      unitPrice: 800,
      quantity: 1,
    },
  ];
  const summary = calculateOrderPricing(singleItemCart, 'standard', null);
  assert.equal(summary.subtotal, 800);
  assert.equal(summary.qualifiesForFreeShipping, false);
  assert.equal(summary.shippingFee, STANDARD_SHIPPING_FEE);
  assert.equal(summary.freeShippingGap, FREE_SHIPPING_THRESHOLD - 800);
});

test('calculateOrderPricing respects express shipping selection', () => {
  const summary = calculateOrderPricing(mockCart, 'express', null);
  assert.equal(summary.shippingFee, EXPRESS_SHIPPING_FEE);
});

test('calculateOrderPricing applies coupon and adjusts tax & total', () => {
  const summary = calculateOrderPricing(mockCart, 'standard', mockCouponPercentage);
  // subtotal 3000, 20% is 600 but capped at 500, discounted subtotal = 2500
  assert.equal(summary.subtotal, 3000);
  assert.equal(summary.discount, 500);
  const expectedTax = Number((2500 * TAX_RATE).toFixed(2));
  assert.equal(summary.tax, expectedTax);
  assert.equal(summary.total, Number((2500 + 0 + expectedTax).toFixed(2)));
});
