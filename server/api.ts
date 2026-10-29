import { Router, Request, Response } from 'express';
import { dbStore } from './db.ts';
import { Product } from '../src/types/ecommerce.ts';

export const apiRouter = Router();

// ----------------------------------------------------
// AUTH ENDPOINTS
// ----------------------------------------------------

apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const user = dbStore.getUserByEmail(email);
  if (!user) {
    // If not found, create a demo customer user automatically for friction-free commercial testing
    const created = dbStore.createUser({
      name: email.split('@')[0],
      email,
      role: email.includes('admin') ? 'admin' : 'customer',
    });
    return res.json({ user: created, token: `jwt-demo-${created.id}` });
  }

  return res.json({ user, token: `jwt-demo-${user.id}` });
});

apiRouter.post('/auth/register', (req: Request, res: Response) => {
  const { name, email, phone, role } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  const existing = dbStore.getUserByEmail(email);
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  const user = dbStore.createUser({
    name,
    email,
    phone,
    role: role || 'customer',
  });

  return res.status(201).json({ user, token: `jwt-demo-${user.id}` });
});

apiRouter.get('/auth/me', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.replace('Bearer ', '');
  const userId = token.replace('jwt-demo-', '');
  const user = dbStore.getUserById(userId) || dbStore.getUserById('usr-alex');

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  return res.json({ user });
});

// ----------------------------------------------------
// PRODUCT & CATALOG ENDPOINTS
// ----------------------------------------------------

apiRouter.get('/products', (req: Request, res: Response) => {
  const {
    search,
    category,
    subcategory,
    brand,
    minPrice,
    maxPrice,
    minRating,
    inStockOnly,
    sort,
    page,
    limit,
  } = req.query;

  const result = dbStore.getProducts({
    search: search ? String(search) : undefined,
    category: category ? String(category) : undefined,
    subcategory: subcategory ? String(subcategory) : undefined,
    brand: brand ? String(brand) : undefined,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    minRating: minRating ? Number(minRating) : undefined,
    inStockOnly: inStockOnly === 'true',
    sort: sort as any,
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 24,
  });

  return res.json(result);
});

apiRouter.get('/products/:id', (req: Request, res: Response) => {
  const product = dbStore.getProductById(req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  return res.json({ product });
});

apiRouter.get('/categories', (_req: Request, res: Response) => {
  const categories = dbStore.getCategories();
  return res.json({ categories });
});

// ----------------------------------------------------
// COUPON VALIDATION
// ----------------------------------------------------

apiRouter.post('/coupons/validate', (req: Request, res: Response) => {
  const { code, subtotal } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'Coupon code is required' });
  }

  const coupon = dbStore.getCoupon(code);
  if (!coupon) {
    return res.status(404).json({ error: `Coupon '${code}' is invalid or has expired.` });
  }

  const numSubtotal = Number(subtotal) || 0;
  if (numSubtotal < coupon.minimumOrder) {
    return res.status(400).json({
      error: `Coupon requires a minimum order of ₹${coupon.minimumOrder.toLocaleString('en-IN')}.`,
    });
  }

  let discount = 0;
  if (coupon.discountType === 'percentage') {
    discount = (numSubtotal * coupon.discountValue) / 100;
    if (coupon.maximumDiscount && discount > coupon.maximumDiscount) {
      discount = coupon.maximumDiscount;
    }
  } else {
    discount = Math.min(coupon.discountValue, numSubtotal);
  }

  return res.json({
    valid: true,
    coupon,
    discountAmount: Number(discount.toFixed(2)),
  });
});

// ----------------------------------------------------
// ORDERS ENDPOINTS
// ----------------------------------------------------

apiRouter.post('/orders', (req: Request, res: Response) => {
  const {
    userId,
    customerName,
    customerEmail,
    customerPhone,
    shippingAddress,
    deliveryMethod,
    paymentMethod,
    items,
    couponCode,
  } = req.body;

  if (!items || !items.length) {
    return res.status(400).json({ error: 'Order must contain at least one item.' });
  }

  if (!shippingAddress || !customerName || !customerEmail) {
    return res.status(400).json({ error: 'Customer and shipping information are required.' });
  }

  const result = dbStore.createOrder({
    userId: userId || 'usr-alex',
    customerName,
    customerEmail,
    customerPhone: customerPhone || '+91 98200 12345',
    shippingAddress,
    deliveryMethod: deliveryMethod || 'standard',
    paymentMethod: paymentMethod || 'Credit / Debit Card',
    items,
    couponCode,
  });

  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  return res.status(201).json({ order: result.order });
});

apiRouter.get('/orders', (req: Request, res: Response) => {
  const { userId } = req.query;
  const orders = dbStore.getOrders(userId ? String(userId) : undefined);
  return res.json({ orders });
});

apiRouter.get('/orders/:id', (req: Request, res: Response) => {
  const order = dbStore.getOrderById(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  return res.json({ order });
});

apiRouter.patch('/orders/:id/status', (req: Request, res: Response) => {
  const { status, note } = req.body;
  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  const result = dbStore.updateOrderStatus(req.params.id, status, note);
  if (!result.success || !result.updatedOrder) {
    return res.status(400).json({ error: result.error || 'Failed to update order' });
  }
  return res.json({ order: result.updatedOrder });
});

apiRouter.post('/orders/:id/cancel', (req: Request, res: Response) => {
  const { reason } = req.body;
  const result = dbStore.updateOrderStatus(req.params.id, 'Cancelled', reason || 'Customer requested');
  if (!result.success || !result.updatedOrder) {
    return res.status(400).json({ error: result.error || 'Failed to cancel order' });
  }
  return res.json({ order: result.updatedOrder });
});

apiRouter.post('/orders/:id/return', (req: Request, res: Response) => {
  const { reason } = req.body;
  const result = dbStore.updateOrderStatus(req.params.id, 'Returned', reason || 'Return initiated');
  if (!result.success || !result.updatedOrder) {
    return res.status(400).json({ error: result.error || 'Failed to return order' });
  }
  return res.json({ order: result.updatedOrder });
});

// ----------------------------------------------------
// REVIEWS ENDPOINTS
// ----------------------------------------------------

apiRouter.get('/products/:id/reviews', (req: Request, res: Response) => {
  const reviews = dbStore.getReviews(req.params.id);
  return res.json({ reviews });
});

apiRouter.post('/products/:id/reviews', (req: Request, res: Response) => {
  const { userId, userName, rating, title, comment } = req.body;
  if (!rating || !comment) {
    return res.status(400).json({ error: 'Rating and comment are required' });
  }

  const newReview = dbStore.addReview(req.params.id, {
    userId: userId || 'usr-alex',
    userName: userName || 'Alex Thorne',
    rating: Number(rating),
    title: title || 'Customer Review',
    comment,
    verifiedPurchase: true,
  });

  return res.status(201).json({ review: newReview });
});

// ----------------------------------------------------
// ADMIN SUITE ENDPOINTS
// ----------------------------------------------------

apiRouter.get('/admin/stats', (_req: Request, res: Response) => {
  const stats = dbStore.getAdminStats();
  return res.json({ stats });
});

apiRouter.post('/admin/products', (req: Request, res: Response) => {
  const productData = req.body;
  if (!productData.name || !productData.basePrice) {
    return res.status(400).json({ error: 'Product name and base price are required' });
  }
  const created = dbStore.createProduct(productData);
  return res.status(201).json({ product: created });
});

apiRouter.put('/admin/products/:id', (req: Request, res: Response) => {
  const updated = dbStore.updateProduct(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Product not found' });
  }
  return res.json({ product: updated });
});

apiRouter.delete('/admin/products/:id', (req: Request, res: Response) => {
  const ok = dbStore.deleteProduct(req.params.id);
  if (!ok) {
    return res.status(404).json({ error: 'Product not found' });
  }
  return res.json({ success: true });
});

apiRouter.get('/admin/coupons', (_req: Request, res: Response) => {
  return res.json({ coupons: dbStore.getCoupons() });
});

apiRouter.post('/admin/coupons', (req: Request, res: Response) => {
  const coupon = req.body;
  if (!coupon.code || !coupon.discountValue) {
    return res.status(400).json({ error: 'Coupon code and value are required' });
  }
  const created = dbStore.createCoupon(coupon);
  return res.status(201).json({ coupon: created });
});

apiRouter.get('/admin/customers', (_req: Request, res: Response) => {
  return res.json({ customers: dbStore.getUsers() });
});

// ----------------------------------------------------
// SHOPPING CONCIERGE & REVIEW SYNTHESIS
// ----------------------------------------------------

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'you', 'your', 'are', 'can', 'have',
  'show', 'find', 'looking', 'look', 'want', 'need', 'please', 'would', 'like',
  'some', 'any', 'best', 'good', 'great', 'something', 'recommend', 'suggest',
  'about', 'from', 'into', 'under', 'over', 'below', 'above', 'between', 'budget',
  'price', 'prices', 'rupees', 'inr', 'rs', 'upto', 'less', 'than', 'within',
  'gift', 'gifts', 'present', 'buy', 'purchase', 'shop', 'shopping',
]);

function tokenizeQuery(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token) && !/^\d+$/.test(token));
}

// Maps everyday search terms to the vocabulary used across the catalog.
const QUERY_SYNONYMS: Record<string, string[]> = {
  shoes: ['shoe', 'sneaker', 'sneakers', 'runner', 'runners', 'footwear'],
  shoe: ['shoes', 'sneaker', 'sneakers', 'runner', 'runners', 'footwear'],
  sneakers: ['sneaker', 'shoes', 'runners', 'footwear'],
  running: ['runner', 'runners', 'sneaker', 'sneakers', 'training'],
  headphone: ['headphones', 'earbuds', 'earphones', 'audio', 'sound'],
  headphones: ['headphone', 'earbuds', 'earphones', 'audio', 'sound'],
  earbuds: ['earbud', 'headphones', 'audio', 'wireless'],
  audio: ['headphones', 'earbuds', 'sound', 'speaker'],
  watch: ['watches', 'timepiece', 'smartwatch', 'chronova'],
  watches: ['watch', 'timepiece', 'smartwatch', 'chronova'],
  timepiece: ['watch', 'watches', 'chronova'],
  bag: ['bags', 'tote', 'crossbody', 'satchel', 'handbag'],
  bags: ['bag', 'tote', 'crossbody', 'satchel', 'handbag'],
  tote: ['bags', 'crossbody', 'satchel'],
  candle: ['candles', 'wax', 'fragrance', 'scent'],
  candles: ['candle', 'wax', 'fragrance', 'scent'],
  vase: ['vases', 'planter', 'ceramic', 'decor'],
  vases: ['vase', 'planter', 'ceramic', 'decor'],
  skincare: ['skin', 'serum', 'elixir', 'moisturizer', 'recovery'],
  perfume: ['fragrance', 'parfum', 'scent'],
  fragrance: ['perfume', 'parfum', 'scent', 'candle'],
  apparel: ['clothing', 'shirt', 'hoodie', 'trench', 'coat', 'knit'],
  clothing: ['apparel', 'shirt', 'hoodie', 'trench', 'coat', 'knit'],
  sunglasses: ['eyewear', 'glasses', 'frames'],
  eyewear: ['sunglasses', 'glasses', 'frames'],
  gym: ['dumbbells', 'weights', 'strength', 'training'],
  weights: ['dumbbells', 'strength', 'gym'],
  yoga: ['mat', 'cork', 'blocks', 'stretch'],
};

function tokenVariants(token: string): string[] {
  return [token, ...(QUERY_SYNONYMS[token] || [])];
}

function matchesAny(haystack: string, variants: string[]): boolean {
  return variants.some((variant) => haystack.includes(variant));
}

function parsePriceRange(query: string): { min?: number; max?: number } {
  const q = query.toLowerCase().replace(/,/g, '');

  const between = q.match(/(?:between|from)\s*(?:₹|rs\.?|inr)?\s*(\d+)\s*(?:and|to|-)\s*(?:₹|rs\.?|inr)?\s*(\d+)/);
  if (between) {
    const a = Number(between[1]);
    const b = Number(between[2]);
    return { min: Math.min(a, b), max: Math.max(a, b) };
  }

  const maxMatch = q.match(/(?:under|below|less than|within|upto|up to|budget(?: of)?|max(?:imum)?|around)\s*(?:₹|rs\.?|inr)?\s*(\d+)/);
  const minMatch = q.match(/(?:over|above|more than|starting at|at least|min(?:imum)?)\s*(?:₹|rs\.?|inr)?\s*(\d+)/);

  return {
    min: minMatch ? Number(minMatch[1]) : undefined,
    max: maxMatch ? Number(maxMatch[1]) : undefined,
  };
}

function scoreProduct(product: Product, tokens: string[]): number {
  const name = product.name.toLowerCase();
  const brand = product.brand.toLowerCase();
  const category = `${product.category} ${product.subcategory}`.toLowerCase();
  const tags = product.tags.map((tag) => tag.toLowerCase());
  const details = `${product.shortDescription} ${product.description} ${product.variants
    .map((variant) => variant.name)
    .join(' ')}`.toLowerCase();

  let score = 0;
  for (const token of tokens) {
    const variants = tokenVariants(token);
    if (matchesAny(name, variants)) score += 6;
    if (matchesAny(brand, variants)) score += 4;
    if (matchesAny(category, variants)) score += 5;
    if (tags.some((tag) => variants.some((variant) => tag.includes(variant) || variant.includes(tag)))) {
      score += 4;
    }
    if (matchesAny(details, variants)) score += 1;
  }
  return score;
}

function uniqueShortTitles(titles: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const title of titles) {
    const key = title.toLowerCase().slice(0, 40);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(title);
    }
  }
  return result;
}

apiRouter.post('/concierge', (req: Request, res: Response) => {
  const { query } = req.body;
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Query is required' });
  }

  const catalog = dbStore.getProducts({ limit: 100 }).products;
  const tokens = tokenizeQuery(query);
  const { min, max } = parsePriceRange(query);

  let candidates = catalog.filter((product) => {
    if (min !== undefined && product.basePrice < min) return false;
    if (max !== undefined && product.basePrice > max) return false;
    return true;
  });

  const matched = candidates
    .map((product) => ({ product, score: scoreProduct(product, tokens) }))
    .filter((entry) => entry.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        Number(b.product.inStock) - Number(a.product.inStock) ||
        b.product.rating - a.product.rating
    )
    .slice(0, 3)
    .map((entry) => entry.product);

  const fallback = [...candidates]
    .sort(
      (a, b) =>
        Number(b.isBestSeller) - Number(a.isBestSeller) ||
        b.rating - a.rating ||
        b.reviewCount - a.reviewCount
    )
    .slice(0, 3);

  const products = matched.length ? matched : fallback;

  if (!products.length) {
    return res.json({
      reply: `I could not find anything within that budget right now. Try a slightly higher range and I will curate the closest matches.`,
      highlightReason: 'No products matched the requested price range.',
      products: [],
    });
  }

  let budgetNote = '';
  if (min !== undefined && max !== undefined) {
    budgetNote = ` between ₹${min.toLocaleString('en-IN')} and ₹${max.toLocaleString('en-IN')}`;
  } else if (min !== undefined) {
    budgetNote = ` above ₹${min.toLocaleString('en-IN')}`;
  } else if (max !== undefined) {
    budgetNote = ` under ₹${max.toLocaleString('en-IN')}`;
  }

  const categoryNote = tokens.length
    ? ` Based on your interest in ${tokens.slice(0, 3).join(', ')},`
    : '';

  return res.json({
    reply: matched.length
      ? `${categoryNote} I curated ${products.length} ${
          products.length === 1 ? 'piece' : 'pieces'
        }${budgetNote} that balance craftsmanship, everyday performance and value.`.trim()
      : `I did not find an exact match${budgetNote}, so here are ${products.length} of our most-loved pieces that come closest to what you are looking for.`,
    highlightReason: matched.length
      ? `Closest matches for "${query.trim()}"`
      : 'Handpicked favourites from the Aureva collection',
    products,
  });
});

apiRouter.post('/reviews/summary', (req: Request, res: Response) => {
  const { productId } = req.body;
  const product = dbStore.getProductById(productId);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const reviews = dbStore.getReviews(productId);

  if (!reviews.length) {
    return res.json({
      pros: [
        'Premium materials selected for lasting everyday use',
        'Thoughtful design with a refined, modern finish',
        'Backed by the Aureva authenticity and returns promise',
      ],
      cons: ['No verified customer feedback has been submitted yet'],
      verdict: `${product.name} is new to the collection. Be the first to share a verified review.`,
    });
  }

  const average = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  const positive = reviews.filter((review) => review.rating >= 4);
  const critical = reviews.filter((review) => review.rating <= 3);

  const pros = uniqueShortTitles(positive.map((review) => review.title)).slice(0, 3);
  const cons = uniqueShortTitles(critical.map((review) => review.title)).slice(0, 2);

  return res.json({
    pros: pros.length
      ? pros
      : ['Customers consistently rate this piece highly for quality and finish'],
    cons: cons.length
      ? cons
      : ['No recurring issues reported by verified buyers'],
    verdict: `${average.toFixed(1)}/5 from ${reviews.length} verified ${
      reviews.length === 1 ? 'review' : 'reviews'
    }. ${positive.length >= critical.length ? 'Buyers consistently praise the craftsmanship and value.' : 'Feedback is mixed, so review the details before ordering.'}`,
  });
});
