// Live product extraction types and helpers.
// These power the TinyFish LIVE comparison engine — filtering irrelevant
// products, normalizing pack sizes, and comparing price per kg/L across retailers.

export interface LiveProduct {
  name: string;
  retailer: string;
  brand: string;
  variant: string;
  packSize: string;
  displayPrice: string;
  currency: string;
  discount: string;
  availability: string;
  imageUrl: string;
  sourceUrl: string;
  extractedAt: string;
  matchStatus: MatchStatus;
  matchScore: number;
}

export interface LiveExtraction {
  products: LiveProduct[];
  sourceUrl: string;
  fetchedAt: string;
  searchIntent: string;
}

// --- Match status (relevance to the user's query) ---------------------

export type MatchStatus = 'exact' | 'similar' | 'unverified';

// Tokens that appear across many grocery products and carry little
// discriminative power for relevance matching.
const GENERIC_WORDS = new Set([
  'product', 'pack', 'combo', 'buy', 'online', 'best', 'price', 'offer',
  'delivery', 'fresh', 'premium', 'original', 'quality', 'value', 'with',
  'and', 'the', 'for', 'kg', 'g', 'l', 'ml', 'pack', 'free', 'pure',
]);

// Tokenize a string into lowercase words, dropping generic grocery noise.
function tokenize(s: string): string[] {
  return s.toLowerCase().split(/[\s,/&\-|()]+/).filter((w) => w.length >= 2);
}

function meaningfulTokens(s: string): string[] {
  return tokenize(s).filter((t) => !GENERIC_WORDS.has(t) && t.length >= 3);
}

// Score how well a single extracted product matches the user's query.
// Returns a score in [0, 1] and a MatchStatus.
//
// - Brand-bearing queries (e.g. "aashirvaad atta") require the brand token
//   to appear in the product name for an exact match; otherwise the product
//   is at most "similar".
// - Pack-size tokens in the query (e.g. "5 kg") are checked against the
//   product's packSize field when present.
export function scoreMatch(product: { name: string; packSize: string; brand: string }, query: string): {
  status: MatchStatus;
  score: number;
} {
  const q = (query || '').trim().toLowerCase();
  if (!q) return { status: 'unverified', score: 0 };

  const name = (product.name || '').toLowerCase();
  const brand = (product.brand || '').toLowerCase();
  const pack = (product.packSize || '').toLowerCase();

  const qTokens = tokenize(q);
  const qMeaningful = meaningfulTokens(q);

  if (qTokens.length === 0) return { status: 'unverified', score: 0 };

  // Every query token (incl. brand) must be present for an exact match.
  const allTokensPresent = qTokens.every((t) => name.includes(t) || brand.includes(t));
  // All *meaningful* tokens present is a weaker, "similar" bar.
  const meaningfulPresent =
    qMeaningful.length > 0 && qMeaningful.every((t) => name.includes(t) || brand.includes(t));

  // Pack-size check: if the query mentions a specific pack size, require it.
  const qPackMatch = q.match(/(\d+(?:\.\d+)?)\s*(kg|g|l|ml)/);
  let packOk = true;
  if (qPackMatch) {
    const qPackStr = `${qPackMatch[1]} ${qPackMatch[2]}`;
    packOk = pack.includes(qPackStr) || pack.includes(qPackMatch[0].replace(/\s+/g, ''));
  }

  if (allTokensPresent && packOk) return { status: 'exact', score: 1 };
  if (meaningfulPresent && packOk) return { status: 'similar', score: 0.6 };

  // Partial overlap: at least one meaningful token matches.
  const anyMeaningful = qMeaningful.some((t) => name.includes(t) || brand.includes(t));
  if (anyMeaningful) return { status: 'similar', score: 0.3 };

  return { status: 'unverified', score: 0 };
}

// Attach match scores to a list of extracted products.
export function scoreProducts<T extends { name: string; packSize: string; brand: string }>(
  products: T[],
  query: string
): Array<T & { matchStatus: MatchStatus; matchScore: number }> {
  return products.map((p) => {
    const { status, score } = scoreMatch(p, query);
    return { ...p, matchStatus: status, matchScore: score };
  });
}

// --- Pack size parsing -------------------------------------------------

export interface ParsedPack {
  amount: number; // normalized to kg or L
  unit: 'kg' | 'L' | 'g' | 'ml';
  raw: string;
}

// Parse a pack-size string like "1 kg", "500g", "2 L", "750 ml" into a
// normalized amount in grams or millilitres for comparison.
export function parsePackSize(raw: string): ParsedPack | null {
  if (!raw) return null;
  const cleaned = raw.toLowerCase().replace(/\s+/g, ' ').trim();

  // Match patterns like "1 kg", "500g", "2.5 l", "750ml", "1.5litre"
  const m = cleaned.match(/([\d.]+)\s*(kg|g|l|ml|litre|liter|kgs|kilo|kilos)?/);
  if (!m) return null;

  const amount = parseFloat(m[1]);
  if (isNaN(amount) || amount <= 0) return null;

  let unit = m[2] || '';
  // Default: if number is large, assume g; if small, assume kg
  if (!unit) {
    unit = amount >= 100 ? 'g' : 'kg';
  }

  if (unit === 'kg' || unit === 'kgs' || unit === 'kilo' || unit === 'kilos') {
    return { amount, unit: 'kg', raw };
  }
  if (unit === 'g') {
    return { amount, unit: 'g', raw };
  }
  if (unit === 'l' || unit === 'litre' || unit === 'liter') {
    return { amount, unit: 'L', raw };
  }
  if (unit === 'ml') {
    return { amount, unit: 'ml', raw };
  }
  return null;
}

// Convert a parsed pack to grams (for solids) or millilitres (for liquids).
// Returns null if the unit is unrecognised.
export function toBaseUnits(parsed: ParsedPack): number | null {
  switch (parsed.unit) {
    case 'kg':
      return parsed.amount * 1000;
    case 'g':
      return parsed.amount;
    case 'L':
      return parsed.amount * 1000;
    case 'ml':
      return parsed.amount;
    default:
      return null;
  }
}

// --- Price parsing -----------------------------------------------------

// Extract a numeric price from display strings like "₹159", "Rs. 159",
// "159.00", "$12.99". Returns null if no number found.
export function parsePrice(display: string): number | null {
  if (!display) return null;
  const cleaned = display.replace(/[₹$£€]/g, '').replace(/rs\.?/gi, '').replace(/[,/]/g, '').trim();
  const m = cleaned.match(/([\d.]+)/);
  if (!m) return null;
  const val = parseFloat(m[1]);
  return isNaN(val) ? null : val;
}

// Parse discount percentage from strings like "10% off", "Save 15%", "−10%"
export function parseDiscountPct(discount: string): number {
  if (!discount) return 0;
  const m = discount.match(/(\d+(?:\.\d+)?)\s*%/);
  if (!m) return 0;
  return parseFloat(m[1]) || 0;
}

// --- Price per unit ----------------------------------------------------

export interface PricePerUnit {
  product: LiveProduct;
  price: number;
  baseUnits: number; // grams or ml
  pricePerKgOrL: number; // price per kg (or per L)
  discountPct: number;
}

// Compute the effective price (after discount) per kg or litre.
// Returns null if price or pack size can't be parsed.
export function computePricePerUnit(product: LiveProduct): PricePerUnit | null {
  const price = parsePrice(product.displayPrice);
  if (price === null || price <= 0) return null;

  const parsed = parsePackSize(product.packSize);
  if (!parsed) return null;

  const baseUnits = toBaseUnits(parsed);
  if (baseUnits === null || baseUnits <= 0) return null;

  const discountPct = parseDiscountPct(product.discount);
  const effectivePrice = price * (1 - discountPct / 100);

  // price per kg (1000 g) or per L (1000 ml)
  const pricePerKgOrL = +((effectivePrice / baseUnits) * 1000).toFixed(2);

  return {
    product,
    price,
    baseUnits,
    pricePerKgOrL,
    discountPct,
  };
}

// --- Search-intent filtering -------------------------------------------

// Derive a search intent from the URL's query parameters or path segments.
// e.g. "https://amazon.in/s?k=atta+jowar" → "atta jowar"
export function deriveSearchIntent(url: string): string {
  try {
    const u = new URL(url.trim());
    const params = u.searchParams;
    // Common search query params across retailers
    const q = params.get('k') || params.get('q') || params.get('search') || params.get('query') || params.get('keyword') || '';
    if (q.trim()) return q.trim().toLowerCase();
    // Fall back to last path segment
    const segments = u.pathname.split('/').filter(Boolean);
    if (segments.length > 0) return decodeURIComponent(segments[segments.length - 1]).toLowerCase();
  } catch {
    // not a valid URL — use the raw string
  }
  return url.trim().toLowerCase();
}

// Keep only products whose match status is at least "similar" relative to the
// search query. "Unverified" results (no meaningful token overlap) are dropped
// so unrelated products never pollute the comparison. If scoring fails because
// the query is empty, all products are returned unchanged.
export function filterByIntent(products: LiveProduct[], query: string): LiveProduct[] {
  const q = (query || '').trim().toLowerCase();
  if (!q) return products;
  return products.filter((p) => p.matchStatus !== 'unverified');
}

// --- Live comparison ---------------------------------------------------

export interface LiveComparisonRow {
  product: LiveProduct;
  pricePerUnit: PricePerUnit;
  isCheapest: boolean;
}

export interface LiveComparisonResult {
  rows: LiveComparisonRow[];
  cheapest: PricePerUnit | null;
  dearest: PricePerUnit | null;
  savings: number; // difference between dearest and cheapest per-unit price
  savingsPct: number; // percentage saved by choosing cheapest
}

// Compare live products by price per kg/L. Only products whose pack size and
// price can be parsed are included. Highlights the cheapest option.
export function compareLiveProducts(products: LiveProduct[]): LiveComparisonResult {
  const priced: PricePerUnit[] = [];
  for (const p of products) {
    const ppu = computePricePerUnit(p);
    if (ppu) priced.push(ppu);
  }

  if (priced.length === 0) {
    return { rows: [], cheapest: null, dearest: null, savings: 0, savingsPct: 0 };
  }

  const sorted = [...priced].sort((a, b) => a.pricePerKgOrL - b.pricePerKgOrL);
  const cheapest = sorted[0];
  const dearest = sorted[sorted.length - 1];
  const savings = +(dearest.pricePerKgOrL - cheapest.pricePerKgOrL).toFixed(2);
  const savingsPct = dearest.pricePerKgOrL > 0
    ? +((savings / dearest.pricePerKgOrL) * 100).toFixed(1)
    : 0;

  const rows: LiveComparisonRow[] = sorted.map((ppu) => ({
    product: ppu.product,
    pricePerUnit: ppu,
    isCheapest: ppu === cheapest,
  }));

  return { rows, cheapest, dearest, savings, savingsPct };
}

// --- Multi-retailer search types ---------------------------------------

export type RetailerFetchStatus = 'pending' | 'loading' | 'success' | 'failed' | 'timeout' | 'unavailable';

export interface RetailerResult {
  retailerId: string;
  retailerName: string;
  status: RetailerFetchStatus;
  products: LiveProduct[];
  error?: string;
  sourceUrl: string;
  fetchedAt?: string;
}

export interface MultiRetailerSearch {
  query: string;
  results: RetailerResult[];
  startedAt: string;
  completedAt?: string;
}

// Match equivalent products across retailers by brand, variant, and pack size.
// Two products are "equivalent" if they share the same normalized pack size
// (in grams or ml) AND their names share at least one significant token beyond
// generic grocery words.

export interface ProductMatchGroup {
  key: string;
  label: string;
  packSize: string;
  baseUnits: number;
  products: LiveProduct[];
}

// Group products into equivalence classes by pack size + shared name tokens.
export function groupEquivalentProducts(products: LiveProduct[]): ProductMatchGroup[] {
  const groups = new Map<string, ProductMatchGroup>();

  for (const p of products) {
    const parsed = parsePackSize(p.packSize);
    if (!parsed) continue;
    const baseUnits = toBaseUnits(parsed);
    if (baseUnits === null || baseUnits <= 0) continue;

    // Extract significant tokens from the product name (brand + variant words).
    const tokens = meaningfulTokens(p.name);
    if (tokens.length === 0) continue;

    // Try to match against existing groups with the same pack size.
    let matchedKey: string | null = null;
    for (const [key, group] of groups) {
      if (group.baseUnits !== baseUnits) continue;
      // Check if any token overlaps with the group's label tokens.
      const groupTokens = meaningfulTokens(group.label);
      const overlap = tokens.some((t) => groupTokens.includes(t));
      if (overlap) {
        matchedKey = key;
        break;
      }
    }

    if (matchedKey) {
      groups.get(matchedKey)!.products.push(p);
    } else {
      const key = `${baseUnits}-${tokens.slice(0, 2).join('-')}-${groups.size}`;
      groups.set(key, {
        key,
        label: p.name,
        packSize: p.packSize,
        baseUnits,
        products: [p],
      });
    }
  }

  return Array.from(groups.values()).filter((g) => g.products.length > 0);
}

// Build a comparison result from a set of equivalent products (same group).
export function compareEquivalentProducts(group: ProductMatchGroup): LiveComparisonResult {
  return compareLiveProducts(group.products);
}
