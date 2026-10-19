import { useState } from 'react';
import { Zap, RefreshCw, AlertTriangle, CheckCircle2, Radio, Info, Fish, Link as LinkIcon, Filter, ArrowRight } from 'lucide-react';
import {
  PRODUCTS,
  RETAILER_LIST,
  effectivePrice,
} from '@/data/catalog';
import {
  type LiveProduct,
  type LiveExtraction,
  deriveSearchIntent,
  filterByIntent,
  computePricePerUnit,
} from '@/data/liveProducts';
import { Button, Card, Badge, SectionTitle } from './ui';

type FetchState = 'idle' | 'loading' | 'success' | 'error';

interface LiveResult {
  products: LiveProduct[];
  sourceUrl: string;
  fetchedAt: string;
  filtered: LiveProduct[];
  intent: string;
}

interface FetchedPrice {
  productId: string;
  productName: string;
  retailer: string;
  price: number;
  discountPct: number;
  fetchedAt: string;
}

// Simulated fetch: applies a small jitter to demo prices so the fallback
// visibly produces numbers. DEMO ONLY — never labelled as live.
function simulateFetch(): Promise<FetchedPrice[]> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < 0.15) {
        reject(new Error('TinyFish demo gateway timed out. This is a simulated error.'));
        return;
      }
      const sample = PRODUCTS.slice(0, 6);
      const out: FetchedPrice[] = [];
      for (const p of sample) {
        const r = RETAILER_LIST[Math.floor(Math.random() * RETAILER_LIST.length)];
        const base = effectivePrice(p.prices[r.id]);
        const jitter = +(base * (1 + (Math.random() * 0.06 - 0.03))).toFixed(2);
        out.push({
          productId: p.id,
          productName: p.name,
          retailer: r.name,
          price: jitter,
          discountPct: p.prices[r.id].discountPct,
          fetchedAt: new Date().toLocaleTimeString(),
        });
      }
      resolve(out);
    }, 1400);
  });
}

function isUrlValid(raw: string): boolean {
  try {
    const u = new URL(raw.trim());
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function deriveRetailerName(url: string): string {
  try {
    const u = new URL(url.trim());
    const host = u.hostname.replace(/^www\./, '');
    const main = host.split('.')[0];
    return main.charAt(0).toUpperCase() + main.slice(1);
  } catch {
    return 'Unknown retailer';
  }
}

export function TinyFishPage({
  liveExtraction: _liveExtraction,
  setLiveExtraction,
}: {
  liveExtraction: LiveExtraction | null;
  setLiveExtraction: (data: LiveExtraction | null) => void;
}) {
  void _liveExtraction;
  const [state, setState] = useState<FetchState>('idle');
  const [liveData, setLiveData] = useState<LiveResult | null>(null);
  const [demoData, setDemoData] = useState<FetchedPrice[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState('');
  const [usingFallback, setUsingFallback] = useState(false);

  const fetchPrices = async () => {
    const trimmed = url.trim();
    if (!trimmed) {
      setError('Enter a retailer product-listing URL to fetch live prices.');
      setState('error');
      return;
    }
    if (!isUrlValid(trimmed)) {
      setError('That does not look like a valid http:// or https:// URL.');
      setState('error');
      return;
    }

    setState('loading');
    setError(null);
    setLiveData(null);
    setDemoData(null);
    setUsingFallback(false);

    const endpoint = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tinyfish-extract`;
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ url: trimmed }),
      });

      // 503 = API key not configured. Demo fallback is appropriate here.
      if (res.status === 503) {
        const demo = await simulateFetch();
        setDemoData(demo);
        setUsingFallback(true);
        setState('success');
        return;
      }

      // Any other non-OK response is a live-request failure. Show the error
      // prominently — do NOT silently replace it with demo data.
      if (!res.ok) {
        let msg = `Live request failed (HTTP ${res.status}).`;
        try {
          const body = await res.json();
          if (body?.error) msg = body.error;
        } catch {
          // response wasn't JSON — keep the default message
        }
        setError(msg);
        setState('error');
        return;
      }

      const body = await res.json();
      if (!body || body.ok !== true || !Array.isArray(body.products)) {
        setError('Unexpected response from the server.');
        setState('error');
        return;
      }

      // Live request succeeded — filter by search intent and save to app state.
      const rawProducts = body.products as LiveProduct[];
      const intent = deriveSearchIntent(trimmed);
      const filtered = filterByIntent(rawProducts, intent);

      // Enrich products with retailer name from source URL and timestamp.
      const enriched: LiveProduct[] = filtered.map((p) => ({
        ...p,
        retailer: p.retailer || deriveRetailerName(body.sourceUrl ?? trimmed),
        extractedAt: body.fetchedAt ?? new Date().toISOString(),
      }));

      setLiveData({
        products: enriched,
        sourceUrl: body.sourceUrl ?? trimmed,
        fetchedAt: body.fetchedAt ?? new Date().toISOString(),
        filtered: enriched,
        intent,
      });

      // Save to app-level state so Compare and Best Deal pages can use it.
      setLiveExtraction({
        products: enriched,
        sourceUrl: body.sourceUrl ?? trimmed,
        fetchedAt: body.fetchedAt ?? new Date().toISOString(),
        searchIntent: intent,
      });
      setState('success');
    } catch (e) {
      // Network failure reaching our edge function — show the error, don't
      // silently swap to demo.
      setError(e instanceof Error ? e.message : 'Network error reaching the server.');
      setState('error');
    }
  };

  const renderLive = (data: LiveResult) => {
    const pricedCount = data.products.filter((p) => computePricePerUnit(p) !== null).length;
    return (
    <Card className="p-0 overflow-hidden animate-fadeIn ring-1 ring-neon-spring/30 shadow-glowSoft">
      <div className="flex items-center justify-between p-4 border-b border-neon-dark/60">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-neon-green" />
          <span className="font-bold text-neon-ink">Live supplier prices</span>
          <Badge tone="spring">LIVE</Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={fetchPrices}>
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>
      {data.intent && (
        <div className="px-4 py-2 bg-neon-spring/5 text-[11px] text-neon-ink border-b border-neon-spring/20 flex items-center gap-1.5">
          <Filter className="h-3 w-3 text-neon-green" />
          Filtered for <strong className="text-neon-green">{data.intent}</strong> — {data.products.length} matching product{data.products.length !== 1 ? 's' : ''}
        </div>
      )}
      {data.products.length === 0 ? (
        <div className="p-8 text-center text-sm text-neon-ash">
          TinyFish visited the page but found no products matching your search.
          <br />
          Try a direct product-listing or search-results URL.
        </div>
      ) : (
        <ul className="divide-y divide-neon-dark/60">
          {data.products.map((row, i) => (
            <li key={`${row.name}-${i}`} className="flex items-center justify-between p-4 hover:bg-neon-dark/20 transition-colors">
              <div className="min-w-0">
                <div className="font-semibold text-neon-ink text-sm truncate">{row.name}</div>
                <div className="text-xs text-neon-ash flex flex-wrap gap-x-2">
                  {row.retailer && <span>{row.retailer}</span>}
                  {row.packSize && <span>· {row.packSize}</span>}
                  {row.discount && <span className="text-neon-green">· {row.discount}</span>}
                </div>
                {row.sourceUrl && (
                  <a
                    href={row.sourceUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-[11px] text-neon-ash hover:text-neon-green truncate inline-block max-w-full"
                  >
                    {row.sourceUrl}
                  </a>
                )}
              </div>
              <div className="text-right shrink-0 ml-3">
                <div className="font-extrabold text-neon-green">{row.displayPrice || '—'}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="p-3 bg-neon-spring/5 text-[11px] text-neon-ink text-center border-t border-neon-spring/20">
        Extracted live from <span className="font-semibold text-neon-green">{data.sourceUrl}</span> via TinyFish.
        {pricedCount > 0 && (
          <span className="ml-1">· {pricedCount} product{pricedCount !== 1 ? 's' : ''} ready for comparison.</span>
        )}
      </div>
      {data.products.length > 0 && (
        <div className="p-3 border-t border-neon-dark/60 flex items-center justify-center gap-2 text-xs text-neon-ash">
          <CheckCircle2 className="h-3.5 w-3.5 text-neon-green" />
          Saved to comparison engine.
          <span className="font-semibold text-neon-green hover:text-neon-greenDim inline-flex items-center gap-0.5">
            View on Compare page <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      )}
    </Card>
  );
  }

  const renderDemo = (data: FetchedPrice[], notice?: string) => (
    <Card className="p-0 overflow-hidden animate-fadeIn ring-1 ring-neon-green/30">
      <div className="flex items-center justify-between p-4 border-b border-neon-dark/60">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-neon-ash" />
          <span className="font-bold text-neon-ink">Demo price stream</span>
          <Badge tone="green">DEMO</Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={fetchPrices}>
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>
      {notice && (
        <div className="px-4 py-2 bg-neon-green/10 text-[11px] text-neon-ink border-b border-neon-green/30">
          Live prices unavailable — showing demo fallback. {notice}
        </div>
      )}
      <ul className="divide-y divide-neon-dark/60">
        {data.map((row) => (
          <li key={`${row.productId}-${row.retailer}`} className="flex items-center justify-between p-4 hover:bg-neon-dark/20 transition-colors">
            <div>
              <div className="font-semibold text-neon-ink text-sm">{row.productName}</div>
              <div className="text-xs text-neon-ash">
                {row.retailer} · updated {row.fetchedAt}
              </div>
            </div>
            <div className="text-right">
              <div className="font-extrabold text-neon-green">₹{row.price.toFixed(0)}</div>
              {row.discountPct > 0 && (
                <div className="text-[11px] text-neon-green">−{row.discountPct}%</div>
              )}
            </div>
          </li>
        ))}
      </ul>
      <div className="p-3 bg-neon-green/10 text-[11px] text-neon-ink text-center">
        These are randomly jittered demo values — not real supplier prices.
      </div>
    </Card>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
      <SectionTitle
        eyebrow="TinyFish integration"
        title="Fetch live supplier prices"
        subtitle="Paste a retailer product-listing URL and TinyFish will extract the products, pack sizes, displayed prices and discounts shown on the page."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card className="p-5">
            <div className="flex items-center gap-2">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-neon-spring/10 text-neon-green shadow-glowSoft">
                <Fish className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-display font-semibold text-neon-ink">TinyFish</h3>
                <p className="text-xs text-neon-ash">Price extraction API</p>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-neon-dark/30 ring-1 ring-neon-dark/60 p-3 text-xs text-neon-ink inline-flex items-start gap-2">
              <Info className="h-4 w-4 shrink-0 mt-0.5 text-neon-green" />
              <span>
                The API key is stored server-side and never exposed to the browser. If live
                fetching is unavailable, a clearly labelled demo fallback is shown.
              </span>
            </div>

            <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.14em] text-neon-ash">
              Retailer URL
            </label>
            <div className="relative mt-2">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neon-ash" />
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example-retailer.com/products"
                className="w-full h-10 pl-9 pr-3 rounded-xl bg-neon-cherry ring-1 ring-inset ring-neon-smoke text-sm text-neon-ink placeholder:text-neon-ash focus:outline-none focus:ring-2 focus:ring-neon-spring/50 focus:bg-neon-dark/20 transition-all"
              />
            </div>

            <Button
              variant="primary"
              size="lg"
              className="mt-3 w-full"
              onClick={fetchPrices}
              disabled={state === 'loading'}
            >
              {state === 'loading' ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" /> Fetching…
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" /> Fetch live supplier prices
                </>
              )}
            </Button>

            <div className="mt-4 space-y-2 text-xs text-neon-ash">
              <div className="flex items-center gap-2">
                <Radio className="h-3.5 w-3.5 text-neon-green" /> Extracts products from the page
              </div>
              <div className="flex items-center gap-2">
                <RefreshCw className="h-3.5 w-3.5 text-neon-green" /> Returns names, pack sizes, prices, discounts
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5 text-neon-green" /> Falls back to demo on error
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2">
          {state === 'idle' && (
            <Card className="p-10 text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-neon-dark/40 text-neon-green shadow-glowSoft">
                <Zap className="h-7 w-7" />
              </span>
              <h3 className="mt-4 font-display font-semibold text-neon-ink">Ready when you are</h3>
              <p className="mt-1 text-sm text-neon-ash">
                Paste a retailer URL and hit <strong className="text-neon-green">Fetch live supplier prices</strong>.
              </p>
            </Card>
          )}

          {state === 'loading' && (
            <Card className="p-6">
              <div className="flex items-center gap-3 text-neon-ink">
                <RefreshCw className="h-5 w-5 animate-spin text-neon-green" />
                <div>
                  <div className="font-bold">Contacting TinyFish…</div>
                  <div className="text-sm text-neon-ash">Extracting products from the retailer page.</div>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-12 rounded-xl bg-neon-dark/40 animate-pulseSoft" style={{ animationDelay: `${i * 120}ms` }} />
                ))}
              </div>
            </Card>
          )}

          {state === 'error' && (
            <Card className="p-6 ring-2 ring-red-300">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-red-50 text-red-600 shrink-0">
                  <AlertTriangle className="h-5 w-5" />
                </span>
                <div className="flex-1">
                  <h3 className="font-display font-semibold text-neon-ink">Couldn't fetch prices</h3>
                  <p className="mt-1 text-sm text-neon-ash">{error}</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={fetchPrices}>
                    <RefreshCw className="h-4 w-4" /> Try again
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {state === 'success' && liveData && !usingFallback && renderLive(liveData)}
          {state === 'success' && demoData && usingFallback && renderDemo(demoData, error ?? undefined)}
        </div>
      </div>
    </div>
  );
}
