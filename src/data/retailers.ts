// Retailer adapter configuration for the multi-retailer comparison engine.
// Each retailer has: id, name, search URL template, extraction support status,
// and an optional note about limitations. New retailers can be added here
// without touching the comparison engine.

export type ExtractionSupport = 'supported' | 'unsupported' | 'untested';

// Tested status tracks real extraction test results. 'verified' means a live
// TinyFish extraction returned products; 'timeout' means the agent ran past
// the deadline; 'blocked' means the site requires login/location/JS that
// blocks automated extraction. These are set from manual testing and updated
// as more retailers are verified.
export type TestedStatus = 'verified' | 'timeout' | 'blocked' | 'untested';
export const RETAILER_TESTED_STATUS: Record<string, TestedStatus> = {
  zepto: 'verified',
  blinkit: 'timeout',
  'swiggy-instamart': 'timeout',
  bigbasket: 'timeout',
  jiomart: 'timeout',
  'amazon-fresh': 'untested',
  'amazon-india': 'timeout',
  'flipkart-minutes': 'untested',
  'dmart-ready': 'untested',
};

export interface RetailerConfig {
  id: string;
  name: string;
  color: string;
  /** Template with {query} placeholder for the search URL */
  searchUrlTemplate: string;
  /** Whether TinyFish can extract from this retailer's pages */
  extractionSupport: ExtractionSupport;
  /** Known limitations or notes */
  notes?: string;
  /** Whether this retailer is enabled for multi-retailer search */
  enabled: boolean;
}

// Each retailer's search URL template uses {query} as the placeholder.
// The query is URL-encoded before substitution.
export const RETAILER_CONFIGS: RetailerConfig[] = [
  {
    id: 'zepto',
    name: 'Zepto',
    color: '#8B5CF6',
    searchUrlTemplate: 'https://www.zeptonow.com/search?query={query}',
    extractionSupport: 'supported',
    notes: 'VERIFIED — live extraction returns real products, pack sizes, and prices',
    enabled: true,
  },
  {
    id: 'blinkit',
    name: 'Blinkit',
    color: '#F59E0B',
    searchUrlTemplate: 'https://www.blinkit.com/search/{query}',
    extractionSupport: 'unsupported',
    notes: 'TIMEOUT — TinyFish agent ran past 110s deadline, likely JS-rendered or requires location',
    enabled: true,
  },
  {
    id: 'swiggy-instamart',
    name: 'Swiggy Instamart',
    color: '#FC8019',
    searchUrlTemplate: 'https://www.swiggy.com/instamart/search?query={query}',
    extractionSupport: 'unsupported',
    notes: 'TIMEOUT — likely requires location selection before showing products',
    enabled: true,
  },
  {
    id: 'bigbasket',
    name: 'BigBasket / BB Now',
    color: '#84A98C',
    searchUrlTemplate: 'https://www.bigbasket.com/ps/?q={query}',
    extractionSupport: 'unsupported',
    notes: 'TIMEOUT — may require pincode/location selection',
    enabled: true,
  },
  {
    id: 'jiomart',
    name: 'JioMart',
    color: '#0EA5E9',
    searchUrlTemplate: 'https://www.jiomart.com/catalogsearch/result?q={query}',
    extractionSupport: 'unsupported',
    notes: 'TIMEOUT — may require location/pincode selection',
    enabled: true,
  },
  {
    id: 'amazon-fresh',
    name: 'Amazon Fresh',
    color: '#FF9900',
    searchUrlTemplate: 'https://www.amazon.in/s?k={query}&i=nowstore',
    extractionSupport: 'untested',
    notes: 'Amazon Fresh / Now store, may require pincode',
    enabled: true,
  },
  {
    id: 'amazon-india',
    name: 'Amazon India Grocery',
    color: '#232F3E',
    searchUrlTemplate: 'https://www.amazon.in/s?k={query}&i=grocery',
    extractionSupport: 'unsupported',
    notes: 'TIMEOUT — Amazon search pages are heavy and JS-rendered',
    enabled: true,
  },
  {
    id: 'flipkart-minutes',
    name: 'Flipkart Minutes',
    color: '#2874F0',
    searchUrlTemplate: 'https://www.flipkart.com/search?q={query}&marketplace=GROCERY',
    extractionSupport: 'untested',
    notes: 'Flipkart grocery listings',
    enabled: true,
  },
  {
    id: 'dmart-ready',
    name: 'DMart Ready',
    color: '#E11D48',
    searchUrlTemplate: 'https://www.dmart.in/search?q={query}',
    extractionSupport: 'untested',
    notes: 'DMart online, may require store selection',
    enabled: true,
  },
];

export const ENABLED_RETAILERS = RETAILER_CONFIGS.filter((r) => r.enabled);

// Build the search URL for a given retailer and query string.
export function buildRetailerSearchUrl(retailer: RetailerConfig, query: string): string {
  const encoded = encodeURIComponent(query.trim());
  return retailer.searchUrlTemplate.replace('{query}', encoded);
}

// Find a retailer config by id.
export function getRetailerById(id: string): RetailerConfig | undefined {
  return RETAILER_CONFIGS.find((r) => r.id === id);
}
