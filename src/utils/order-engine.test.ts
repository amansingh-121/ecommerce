import test from 'node:test';
import assert from 'node:assert/strict';
import { canTransitionOrderStatus, transitionOrder } from './order-engine.ts';
import { Order } from '../types/ecommerce.ts';

const mockOrder: Order = {
  id: 'ord-101',
  orderNumber: 'ORD-2026-9041',
  userId: 'usr-1',
  customerName: 'Alex Thorne',
  customerEmail: 'alex@example.com',
  customerPhone: '+1 (555) 234-5678',
  shippingAddress: {
    id: 'addr-1',
    fullName: 'Alex Thorne',
    phone: '+1 (555) 234-5678',
    street: '742 Evergreen Terrace',
    city: 'Springfield',
    state: 'OR',
    postalCode: '97477',
    country: 'United States',
    isDefault: true,
  },
  deliveryMethod: 'standard',
  paymentMethod: 'Credit / Debit Card',
  paymentStatus: 'Paid',
  status: 'Pending',
  items: [],
  subtotal: 150,
  discount: 0,
  shippingFee: 0,
  tax: 12,
  total: 162,
  trackingNumber: 'TRK-98321481',
  timeline: [
    {
      status: 'Pending',
      timestamp: '2026-10-28T10:00:00Z',
      message: 'Order created',
    },
  ],
  createdAt: '2026-10-28T10:00:00Z',
  updatedAt: '2026-10-28T10:00:00Z',
};

test('canTransitionOrderStatus validates valid next states', () => {
  assert.equal(canTransitionOrderStatus('Pending', 'Confirmed'), true);
  assert.equal(canTransitionOrderStatus('Pending', 'Cancelled'), true);
  assert.equal(canTransitionOrderStatus('Pending', 'Delivered'), false); // cannot jump
  assert.equal(canTransitionOrderStatus('Confirmed', 'Processing'), true);
  assert.equal(canTransitionOrderStatus('Shipped', 'Out for Delivery'), true);
  assert.equal(canTransitionOrderStatus('Delivered', 'Returned'), true);
  assert.equal(canTransitionOrderStatus('Cancelled', 'Delivered'), false); // terminal
});

test('transitionOrder creates timeline history and changes status', () => {
  const result = transitionOrder(mockOrder, 'Confirmed', 'Payment received via Stripe');
  assert.equal(result.success, true);
  assert.equal(result.updatedOrder.status, 'Confirmed');
  assert.equal(result.updatedOrder.timeline.length, 2);
  assert.equal(result.updatedOrder.timeline[1].status, 'Confirmed');
  assert.equal(result.updatedOrder.timeline[1].message, 'Payment received via Stripe');
});

test('transitionOrder rejects invalid transition', () => {
  const result = transitionOrder(mockOrder, 'Delivered');
  assert.equal(result.success, false);
  assert.equal(result.updatedOrder.status, 'Pending'); // unchanged
  assert.match(result.error || '', /Cannot transition order/);
});

test('transitionOrder updates payment status on cancellation', () => {
  const result = transitionOrder(mockOrder, 'Cancelled', 'Customer changed mind');
  assert.equal(result.success, true);
  assert.equal(result.updatedOrder.status, 'Cancelled');
  assert.equal(result.updatedOrder.paymentStatus, 'Refunded');
  assert.equal(result.updatedOrder.cancelReason, 'Customer changed mind');
});
