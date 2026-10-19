// SocietyBasket sample catalogue — DEMO DATA ONLY.
// Prices are illustrative and do not reflect any real retailer.
// TinyFish live-price integration is not yet connected.

export type RetailerId = 'blinkbasket' | 'freshkart' | 'megastore';

export interface Retailer {
  id: RetailerId;
  name: string;
  tagline: string;
  deliveryFee: number;
  freeDeliveryOver: number | null;
  color: string;
  rating: number;
  etaMins: string;
}

export interface ProductPrice {
  price: number; // listed price for the pack
  discountPct: number; // percentage off the listed price
  inStock: boolean;
}

export interface Product {
  id: string;
  name: string;
  category: CategoryId;
  packSize: string;
  unit: string; // e.g. "1 kg", "500 g", "1 L"
  image: string;
  basePrice: number; // reference MRP for display
  prices: Record<RetailerId, ProductPrice>;
}

export type CategoryId =
  | 'rice'
  | 'atta'
  | 'milk'
  | 'oil'
  | 'sugar'
  | 'pulses'
  | 'biscuits'
  | 'vegetables';

export interface Category {
  id: CategoryId;
  label: string;
  icon: string; // lucide icon name
}

export const SOCIETIES = [
  'Green Acres Residency',
  'Sunrise Apartments',
  'Lake View Towers',
  'Palm Grove Society',
] as const;

export const CATEGORIES: Category[] = [
  { id: 'rice', label: 'Rice', icon: 'Wheat' },
  { id: 'atta', label: 'Atta & Flour', icon: 'Pizza' },
  { id: 'milk', label: 'Milk & Dairy', icon: 'Milk' },
  { id: 'oil', label: 'Cooking Oil', icon: 'Droplet' },
  { id: 'sugar', label: 'Sugar', icon: 'Candy' },
  { id: 'pulses', label: 'Pulses', icon: 'Soup' },
  { id: 'biscuits', label: 'Biscuits', icon: 'Cookie' },
  { id: 'vegetables', label: 'Vegetables', icon: 'Carrot' },
];

export const RETAILERS: Record<RetailerId, Retailer> = {
  blinkbasket: {
    id: 'blinkbasket',
    name: 'BlinkBasket',
    tagline: 'Lightning-fast grocery delivery',
    deliveryFee: 35,
    freeDeliveryOver: 500,
    color: '#F59E0B',
    rating: 4.5,
    etaMins: '8–12 min',
  },
  freshkart: {
    id: 'freshkart',
    name: 'FreshKart',
    tagline: 'Farm-fresh, society-first',
    deliveryFee: 25,
    freeDeliveryOver: 400,
    color: '#0EA5E9',
    rating: 4.3,
    etaMins: '15–20 min',
  },
  megastore: {
    id: 'megastore',
    name: 'MegaStore',
    tagline: 'Bulk prices for bulk savings',
    deliveryFee: 49,
    freeDeliveryOver: 700,
    color: '#EF4444',
    rating: 4.1,
    etaMins: '25–35 min',
  },
};

export const RETAILER_LIST = Object.values(RETAILERS);

const img = {
  riceBasmati:
    'https://images.pexels.com/photos/1306548/pexels-photo-1306548.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  riceSona:
    'https://images.pexels.com/photos/31555433/pexels-photo-31555433.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  attaWhole:
    'https://images.pexels.com/photos/6287223/pexels-photo-6287223.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  attaMulti:
    'https://images.pexels.com/photos/6294375/pexels-photo-6294375.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  milk:
    'https://images.pexels.com/photos/5946755/pexels-photo-5946755.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  curd:
    'https://images.pexels.com/photos/5946733/pexels-photo-5946733.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  oilSunflower:
    'https://images.pexels.com/photos/31275834/pexels-photo-31275834.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  oilMustard:
    'https://images.pexels.com/photos/4910159/pexels-photo-4910159.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  sugar1:
    'https://images.pexels.com/photos/15206766/pexels-photo-15206766.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  sugar5:
    'https://images.pexels.com/photos/33332006/pexels-photo-33332006.png?auto=compress&cs=tinysrgb&h=650&w=940',
  toor:
    'https://images.pexels.com/photos/14177776/pexels-photo-14177776.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  moong:
    'https://images.pexels.com/photos/7245609/pexels-photo-7245609.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  biscuitsMarie:
    'https://images.pexels.com/photos/5985991/pexels-photo-5985991.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  biscuitsChoco:
    'https://images.pexels.com/photos/110934/pexels-photo-110934.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  tomato:
    'https://images.pexels.com/photos/26950753/pexels-photo-26950753.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  onion:
    'https://images.pexels.com/photos/10899600/pexels-photo-10899600.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
};

export const PRODUCTS: Product[] = [
  {
    id: 'rice-basmati-1',
    name: 'Basmati Rice Premium',
    category: 'rice',
    packSize: '1 kg',
    unit: '1 kg',
    image: img.riceBasmati,
    basePrice: 145,
    prices: {
      blinkbasket: { price: 139, discountPct: 5, inStock: true },
      freshkart: { price: 132, discountPct: 9, inStock: true },
      megastore: { price: 128, discountPct: 12, inStock: true },
    },
  },
  {
    id: 'rice-sona-5',
    name: 'Sona Masoori Rice',
    category: 'rice',
    packSize: '5 kg',
    unit: '5 kg',
    image: img.riceSona,
    basePrice: 420,
    prices: {
      blinkbasket: { price: 405, discountPct: 4, inStock: true },
      freshkart: { price: 398, discountPct: 5, inStock: true },
      megastore: { price: 389, discountPct: 7, inStock: false },
    },
  },
  {
    id: 'atta-whole-5',
    name: 'Whole Wheat Atta',
    category: 'atta',
    packSize: '5 kg',
    unit: '5 kg',
    image: img.attaWhole,
    basePrice: 260,
    prices: {
      blinkbasket: { price: 249, discountPct: 4, inStock: true },
      freshkart: { price: 255, discountPct: 2, inStock: true },
      megastore: { price: 239, discountPct: 8, inStock: true },
    },
  },
  {
    id: 'atta-multigrain-2',
    name: 'Multigrain Atta',
    category: 'atta',
    packSize: '2 kg',
    unit: '2 kg',
    image: img.attaMulti,
    basePrice: 130,
    prices: {
      blinkbasket: { price: 125, discountPct: 4, inStock: true },
      freshkart: { price: 128, discountPct: 2, inStock: false },
      megastore: { price: 119, discountPct: 8, inStock: true },
    },
  },
  {
    id: 'milk-toned-1',
    name: 'Toned Milk',
    category: 'milk',
    packSize: '1 L',
    unit: '1 L',
    image: img.milk,
    basePrice: 58,
    prices: {
      blinkbasket: { price: 56, discountPct: 3, inStock: true },
      freshkart: { price: 54, discountPct: 7, inStock: true },
      megastore: { price: 55, discountPct: 5, inStock: true },
    },
  },
  {
    id: 'milk-curd-400',
    name: 'Fresh Curd',
    category: 'milk',
    packSize: '400 g',
    unit: '400 g',
    image: img.curd,
    basePrice: 45,
    prices: {
      blinkbasket: { price: 43, discountPct: 4, inStock: true },
      freshkart: { price: 41, discountPct: 9, inStock: true },
      megastore: { price: 42, discountPct: 7, inStock: false },
    },
  },
  {
    id: 'oil-sunflower-1',
    name: 'Sunflower Cooking Oil',
    category: 'oil',
    packSize: '1 L',
    unit: '1 L',
    image: img.oilSunflower,
    basePrice: 175,
    prices: {
      blinkbasket: { price: 169, discountPct: 3, inStock: true },
      freshkart: { price: 165, discountPct: 6, inStock: true },
      megastore: { price: 159, discountPct: 9, inStock: true },
    },
  },
  {
    id: 'oil-mustard-1',
    name: 'Mustard Oil',
    category: 'oil',
    packSize: '1 L',
    unit: '1 L',
    image: img.oilMustard,
    basePrice: 195,
    prices: {
      blinkbasket: { price: 189, discountPct: 3, inStock: true },
      freshkart: { price: 185, discountPct: 5, inStock: true },
      megastore: { price: 179, discountPct: 8, inStock: true },
    },
  },
  {
    id: 'sugar-1',
    name: 'Refined White Sugar',
    category: 'sugar',
    packSize: '1 kg',
    unit: '1 kg',
    image: img.sugar1,
    basePrice: 52,
    prices: {
      blinkbasket: { price: 50, discountPct: 4, inStock: true },
      freshkart: { price: 49, discountPct: 6, inStock: true },
      megastore: { price: 47, discountPct: 10, inStock: true },
    },
  },
  {
    id: 'sugar-5',
    name: 'White Sugar Family Pack',
    category: 'sugar',
    packSize: '5 kg',
    unit: '5 kg',
    image: img.sugar5,
    basePrice: 245,
    prices: {
      blinkbasket: { price: 238, discountPct: 3, inStock: true },
      freshkart: { price: 232, discountPct: 5, inStock: false },
      megastore: { price: 225, discountPct: 8, inStock: true },
    },
  },
  {
    id: 'pulses-toor-1',
    name: 'Toor Dal (Arhar)',
    category: 'pulses',
    packSize: '1 kg',
    unit: '1 kg',
    image: img.toor,
    basePrice: 165,
    prices: {
      blinkbasket: { price: 159, discountPct: 4, inStock: true },
      freshkart: { price: 155, discountPct: 6, inStock: true },
      megastore: { price: 149, discountPct: 10, inStock: true },
    },
  },
  {
    id: 'pulses-moong-500',
    name: 'Moong Dal',
    category: 'pulses',
    packSize: '500 g',
    unit: '500 g',
    image: img.moong,
    basePrice: 95,
    prices: {
      blinkbasket: { price: 92, discountPct: 3, inStock: true },
      freshkart: { price: 89, discountPct: 6, inStock: true },
      megastore: { price: 86, discountPct: 9, inStock: true },
    },
  },
  {
    id: 'biscuits-marie-200',
    name: 'Marie Gold Biscuits',
    category: 'biscuits',
    packSize: '200 g',
    unit: '200 g',
    image: img.biscuitsMarie,
    basePrice: 35,
    prices: {
      blinkbasket: { price: 34, discountPct: 3, inStock: true },
      freshkart: { price: 32, discountPct: 9, inStock: true },
      megastore: { price: 33, discountPct: 6, inStock: true },
    },
  },
  {
    id: 'biscuits-choco-150',
    name: 'Choco Chip Cookies',
    category: 'biscuits',
    packSize: '150 g',
    unit: '150 g',
    image: img.biscuitsChoco,
    basePrice: 60,
    prices: {
      blinkbasket: { price: 58, discountPct: 3, inStock: true },
      freshkart: { price: 55, discountPct: 8, inStock: true },
      megastore: { price: 54, discountPct: 10, inStock: false },
    },
  },
  {
    id: 'veg-tomato-1',
    name: 'Fresh Tomatoes',
    category: 'vegetables',
    packSize: '1 kg',
    unit: '1 kg',
    image: img.tomato,
    basePrice: 40,
    prices: {
      blinkbasket: { price: 38, discountPct: 5, inStock: true },
      freshkart: { price: 36, discountPct: 10, inStock: true },
      megastore: { price: 37, discountPct: 8, inStock: true },
    },
  },
  {
    id: 'veg-onion-1',
    name: 'Fresh Onions',
    category: 'vegetables',
    packSize: '1 kg',
    unit: '1 kg',
    image: img.onion,
    basePrice: 35,
    prices: {
      blinkbasket: { price: 33, discountPct: 6, inStock: true },
      freshkart: { price: 31, discountPct: 11, inStock: false },
      megastore: { price: 30, discountPct: 14, inStock: true },
    },
  },
];

export interface BasketItem {
  productId: string;
  qty: number;
}

// --- Pricing helpers -------------------------------------------------

export function effectivePrice(p: ProductPrice): number {
  return +(p.price * (1 - p.discountPct / 100)).toFixed(2);
}

export function productSubtotal(product: Product, retailerId: RetailerId, qty: number): number {
  const pp = product.prices[retailerId];
  if (!pp || !pp.inStock) return 0;
  return +(effectivePrice(pp) * qty).toFixed(2);
}

export function basketItemsTotal(
  items: BasketItem[],
  retailerId: RetailerId
): { subtotal: number; deliveryFee: number; total: number; savings: number; mrpTotal: number } {
  const retailer = RETAILERS[retailerId];
  let subtotal = 0;
  let mrpTotal = 0;
  for (const item of items) {
    const product = PRODUCTS.find((p) => p.id === item.productId);
    if (!product) continue;
    const pp = product.prices[retailerId];
    if (!pp || !pp.inStock) continue;
    subtotal += effectivePrice(pp) * item.qty;
    mrpTotal += product.basePrice * item.qty;
  }
  subtotal = +subtotal.toFixed(2);
  mrpTotal = +mrpTotal.toFixed(2);
  const deliveryFee =
    retailer.freeDeliveryOver != null && subtotal >= retailer.freeDeliveryOver
      ? 0
      : items.length > 0
        ? retailer.deliveryFee
        : 0;
  const total = +(subtotal + deliveryFee).toFixed(2);
  const savings = +(mrpTotal - subtotal).toFixed(2);
  return { subtotal, deliveryFee, total, savings, mrpTotal };
}
