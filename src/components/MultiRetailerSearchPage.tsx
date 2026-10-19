import { useState, useCallback, useRef, type Dispatch, type SetStateAction } from 'react';
import {
  Search,
  Zap,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
  Award,
  Fish,
  Store,
  Info,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import {
  ENABLED_RETAILERS,
  RETAILER_CONFIGS,
  RETAILER_TESTED_STATUS,
  buildRetailerSearchUrl,
  type RetailerConfig,
} from '@/data/retailers';
import {
  type LiveProduct,
  type MultiRetailerSearch,
  type RetailerResult,
  type RetailerFetchStatus,
  type ProductMatchGroup,
  groupEquivalentProducts,
  compareEquivalentProducts,
} from '@/data/liveProducts';
import { Button, Card, Badge, SectionTitle } from './ui';
import type { PageId } from './Header';

const EDGE_FUNCTION = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tinyfish-extract`;

function statusIcon(status: RetailerFetchStatus) {
  switch (status) {
    case 'pending':
      return <Clock className="h-4 w-4 text-neon-ash" />;
    case 'loading':
      return <Loader2 className="h-4 w-4 text-neon-green animate-spin" />;
    case 'success':
      return <CheckCircle2 className="h-4 w-4 text-neon-green" />;
    case 'failed':
      return <XCircle className="h-4 w-4 text-red-600" />;
    case 'timeout':
      return <Clock className="h-4 w-4 text-amber-600" />;
    case 'unavailable':
      return <AlertTriangle className="h-4 w-4 text-neon-ash" />;
  }
}

function statusLabel(status: RetailerFetchStatus): string {
  switch (status) {
    case 'pending':
      return 'Queued';
    case 'loading':
      return 'Extracting…';
    case 'success':
      return 'Live';
    case 'failed':
      return 'Failed';
    case 'timeout':
      return 'Timed out';
    case 'unavailable':
      return 'Unavailable';
  }
}

function statusBadgeTone(status: RetailerFetchStatus): 'spring' | 'green' | 'red' | 'muted' | 'emerald' {
  switch (status) {
    case 'pending':
      return 'muted';
    case 'loading':
      return 'green';
    case 'success':
      return 'emerald';
    case 'failed':
      return 'red';
    case 'timeout':
      return 'spring';
    case 'unavailable':
      return 'muted';
  }
}

async function fetchRetailer(
  config: RetailerConfig,
  query: string,
  signal: AbortSignal
): Promise<RetailerResult> {
  const searchUrl = buildRetailerSearchUrl(config, query);
  const base: RetailerResult = {
    retailerId: config.id,
    retailerName: config.name,
    status: 'loading',
    products: [],
    sourceUrl: searchUrl,
  };

  try {
    const res = await fetch(EDGE_FUNCTION, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ url: searchUrl }),
      signal,
    });

    if (!res.ok) {
      let msg = `HTTP ${res.status}`;
      try {
        const body = await res.json();
        if (body?.error) msg = body.error;
      } catch {
        // non-JSON response
      }
      return { ...base, status: 'failed', error: msg };
    }

    const body = await res.json();
    if (!body || body.ok !== true || !Array.isArray(body.products)) {
      return { ...base, status: 'failed', error: 'Unexpected response format' };
    }

    const products: LiveProduct[] = (body.products as LiveProduct[]).map((p) => ({
      ...p,
      retailer: p.retailer || config.name,
      sourceUrl: p.sourceUrl || searchUrl,
      extractedAt: body.fetchedAt ?? new Date().toISOString(),
    }));

    return {
      ...base,
      status: 'success',
      products,
      fetchedAt: body.fetchedAt ?? new Date().toISOString(),
    };
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      return { ...base, status: 'timeout', error: 'Request cancelled' };
    }
    return {
      ...base,
      status: 'failed',
      error: e instanceof Error ? e.message : 'Network error',
    };
  }
}

export function MultiRetailerSearchPage({
  multiSearch,
  setMultiSearch,
  setPage,
}: {
  multiSearch: MultiRetailerSearch | null;
  setMultiSearch: Dispatch<SetStateAction<MultiRetailerSearch | null>>;
  setPage: (p: PageId) => void;
}) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const runSearch = useCallback(async () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsSearching(true);
    const retailers = ENABLED_RETAILERS;
    const initialResults: RetailerResult[] = retailers.map((r) => ({
      retailerId: r.id,
      retailerName: r.name,
      status: 'pending' as const,
      products: [],
      sourceUrl: buildRetailerSearchUrl(r, trimmed),
    }));

    const search: MultiRetailerSearch = {
      query: trimmed,
      results: initialResults,
      startedAt: new Date().toISOString(),
    };
    setMultiSearch(search);

    const updates = retailers.map(async (config, idx) => {
      const result = await fetchRetailer(config, trimmed, controller.signal);
      setMultiSearch((prev) => {
        if (!prev || prev.query !== trimmed) return prev;
        const nextResults = [...prev.results];
        nextResults[idx] = result;
        const allDone = nextResults.every(
          (r) => r.status === 'success' || r.status === 'failed' || r.status === 'timeout'
        );
        return {
          ...prev,
          results: nextResults,
          completedAt: allDone ? new Date().toISOString() : prev.completedAt,
        };
      });
    });

    await Promise.allSettled(updates);
    setIsSearching(false);
  }, [query, setMultiSearch]);

  const allProducts: LiveProduct[] = multiSearch
    ? multiSearch.results.filter((r) => r.status === 'success').flatMap((r) => r.products)
    : [];

  const matchGroups = groupEquivalentProducts(allProducts);
  const groupsWithMultiple = matchGroups.filter((g) => g.products.length >= 1);

  const successCount = multiSearch?.results.filter((r) => r.status === 'success').length ?? 0;
  const failedCount = multiSearch?.results.filter(
    (r) => r.status === 'failed' || r.status === 'timeout'
  ).length ?? 0;
  const totalProducts = allProducts.length;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
      <SectionTitle
        eyebrow="Multi-retailer search"
        title="Compare across all retailers"
        subtitle="Search for a grocery item and we'll check every supported retailer simultaneously. Each retailer is extracted independently — one failure never blocks the others."
      />

      {/* Search bar */}
      <Card className="p-5 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neon-ash" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isSearching) runSearch();
              }}
              placeholder="e.g. Aashirvaad Atta 5 kg"
              className="w-full h-12 pl-9 pr-3 rounded-xl bg-neon-cherry ring-1 ring-inset ring-neon-smoke text-sm text-neon-ink placeholder:text-neon-ash focus:outline-none focus:ring-2 focus:ring-neon-spring/50 focus:bg-neon-dark/20 transition-all"
            />
          </div>
          <Button
            variant="primary"
            size="lg"
            onClick={runSearch}
            disabled={isSearching || !query.trim()}
          >
            {isSearching ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" /> Searching all retailers…
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" /> Search all retailers
              </>
            )}
          </Button>
        </div>

        {/* Retailer chips */}
        <div className="mt-4 flex flex-wrap gap-2">
          {RETAILER_CONFIGS.map((r) => (
            <span
              key={r.id}
              className="inline-flex items-center gap-1.5 rounded-full bg-neon-dark/40 ring-1 ring-neon-smoke px-2.5 py-1 text-xs font-medium text-neon-ink"
            >
              <span className="h-2 w-2 rounded-full" style={{ background: r.color }} />
              {r.name}
            </span>
          ))}
        </div>
      </Card>

      {/* Results */}
      {multiSearch && (
        <>
          {/* Per-retailer status grid */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Store className="h-5 w-5 text-neon-green" />
              <h3 className="font-display text-lg font-semibold text-neon-ink">Retailer status</h3>
              {isSearching ? (
                <Badge tone="green">Searching…</Badge>
              ) : (
                <Badge tone="emerald">{successCount} live</Badge>
              )}
              {failedCount > 0 && <Badge tone="red">{failedCount} failed</Badge>}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {multiSearch.results.map((r) => {
                const config = RETAILER_CONFIGS.find((c) => c.id === r.retailerId);
                return (
                  <Card
                    key={r.retailerId}
                    className={`p-4 ${r.status === 'success' ? 'ring-1 ring-neon-spring/40' : ''} ${
                      r.status === 'failed' || r.status === 'timeout' ? 'ring-1 ring-red-200' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="h-3 w-3 rounded-full shrink-0" style={{ background: config?.color ?? '#999' }} />
                      <span className="font-semibold text-sm text-neon-ink">{r.retailerName}</span>
                      <span className="ml-auto flex items-center gap-1.5">
                        {statusIcon(r.status)}
                        <Badge tone={statusBadgeTone(r.status)}>{statusLabel(r.status)}</Badge>
                      </span>
                    </div>
                    {r.status === 'success' && (
                      <p className="mt-2 text-xs text-neon-ash">
                        {r.products.length} product{r.products.length !== 1 ? 's' : ''} extracted
                      </p>
                    )}
                    {(r.status === 'failed' || r.status === 'timeout') && r.error && (
                      <p className="mt-2 text-xs text-red-600 truncate" title={r.error}>
                        {r.error}
                      </p>
                    )}
                    {r.status === 'pending' && (
                      <p className="mt-2 text-xs text-neon-ash">Waiting in queue…</p>
                    )}
                    {r.status === 'loading' && (
                      <p className="mt-2 text-xs text-neon-ash">TinyFish visiting page…</p>
                    )}
                    {(() => {
                      const tested = RETAILER_TESTED_STATUS[r.retailerId];
                      if (!tested || tested === 'untested') return null;
                      if (tested === 'verified') {
                        return (
                          <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-neon-green">
                            <CheckCircle2 className="h-3 w-3" /> Verified live extraction
                          </span>
                        );
                      }
                      return (
                          <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-medium text-amber-600">
                            <AlertTriangle className="h-3 w-3" /> May time out — {tested === 'blocked' ? 'requires login/location' : 'heavy JS rendering'}
                          </span>
                      );
                    })()}
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Comparison table */}
          {totalProducts > 0 ? (
            <MultiRetailerComparison
              groups={groupsWithMultiple}
              setPage={setPage}
              query={multiSearch.query}
            />
          ) : (
            !isSearching && (
              <Card className="p-8 text-center">
                <AlertTriangle className="h-8 w-8 text-neon-ash mx-auto" />
                <h3 className="mt-3 font-display font-semibold text-neon-ink">No products extracted</h3>
                <p className="mt-1 text-sm text-neon-ash">
                  None of the {ENABLED_RETAILERS.length} retailers returned extractable products for
                  "{multiSearch.query}". This usually means the pages require login, location
                  selection, or use JavaScript rendering that blocks automated extraction.
                </p>
              </Card>
            )
          )}
        </>
      )}

      {/* Empty state */}
      {!multiSearch && (
        <Card className="p-10 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-neon-dark/40 text-neon-green shadow-glowSoft">
            <Search className="h-7 w-7" />
          </span>
          <h3 className="mt-4 font-display font-semibold text-neon-ink">Search across all retailers</h3>
          <p className="mt-1 text-sm text-neon-ash max-w-md mx-auto">
            Enter a grocery product name above. We'll search every retailer in parallel and show you
            a side-by-side comparison with live prices, pack sizes, and per-kg rates.
          </p>
        </Card>
      )}
    </div>
  );
}

function MultiRetailerComparison({
  groups,
  setPage,
  query,
}: {
  groups: ProductMatchGroup[];
  setPage: (p: PageId) => void;
  query: string;
}) {
  const allComparisons = groups
    .map((g) => ({
      group: g,
      result: compareEquivalentProducts(g),
    }))
    .filter((c) => c.result.rows.length > 0);

  const overallCheapest = allComparisons
    .flatMap((c) => c.result.rows)
    .sort((a, b) => a.pricePerUnit.pricePerKgOrL - b.pricePerUnit.pricePerKgOrL)[0];

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Fish className="h-5 w-5 text-neon-green" />
        <h3 className="font-display text-lg font-semibold text-neon-ink">Live comparison</h3>
        <Badge tone="emerald">LIVE</Badge>
        <span className="text-xs text-neon-ash">for "{query}"</span>
      </div>

      {/* Overall cheapest callout */}
      {overallCheapest && (
        <Card className="p-5 mb-4 ring-1 ring-neon-spring/30 bg-gradient-to-br from-neon-spring/5 to-neon-cherry">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-neon-spring/10 text-neon-green shadow-glowSoft">
              <Award className="h-5 w-5" />
            </span>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-neon-green">
                Cheapest option found
              </div>
              <div className="font-display font-semibold text-neon-ink">
                {overallCheapest.product.name}
              </div>
              <div className="text-sm text-neon-ash">
                {overallCheapest.product.retailer} · {overallCheapest.product.packSize}
              </div>
            </div>
            <div className="ml-auto text-right">
              <div className="text-xs uppercase tracking-wider text-neon-ash">Per kg/L</div>
              <div className="font-display text-2xl font-bold text-neon-green">
                ₹{overallCheapest.pricePerUnit.pricePerKgOrL.toFixed(0)}
              </div>
            </div>
            <Button size="sm" variant="terracotta" className="ml-2 shrink-0" onClick={() => setPage('bestdeal')}>
              Best deal <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </Card>
      )}

      {/* Comparison table */}
      <div className="overflow-x-auto rounded-2xl ring-1 ring-neon-spring/30 shadow-glowSoft bg-neon-panel">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-neon-dark/40 text-left text-xs uppercase tracking-wider text-neon-ash">
              <th className="px-4 py-3 font-bold">Product</th>
              <th className="px-4 py-3 font-bold">Retailer</th>
              <th className="px-4 py-3 font-bold text-center">Pack size</th>
              <th className="px-4 py-3 font-bold text-center">Price</th>
              <th className="px-4 py-3 font-bold text-center">Disc.</th>
              <th className="px-4 py-3 font-bold text-center">₹/kg (or ₹/L)</th>
              <th className="px-4 py-3 font-bold text-center">Link</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neon-dark/60">
            {allComparisons.flatMap((c) =>
              c.result.rows.map((row, i) => (
                <tr
                  key={`${row.product.name}-${row.product.retailer}-${i}`}
                  className={row.isCheapest ? 'bg-neon-spring/5 hover:bg-neon-spring/10' : 'hover:bg-neon-dark/20'}
                >
                  <td className="px-4 py-3">
                    <div className="font-semibold text-neon-ink leading-tight">{row.product.name}</div>
                  </td>
                  <td className="px-4 py-3 text-neon-ink">{row.product.retailer || '—'}</td>
                  <td className="px-4 py-3 text-center text-neon-ash">{row.product.packSize || '—'}</td>
                  <td className="px-4 py-3 text-center font-bold text-neon-ink">
                    {row.product.displayPrice || '—'}
                  </td>
                  <td className="px-4 py-3 text-center text-neon-green">
                    {row.pricePerUnit.discountPct > 0 ? `−${row.pricePerUnit.discountPct}%` : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-extrabold ${row.isCheapest ? 'text-neon-green' : 'text-neon-ink'}`}>
                      ₹{row.pricePerUnit.pricePerKgOrL.toFixed(0)}
                    </span>
                    {row.isCheapest && (
                      <span className="ml-1.5 inline-flex items-center gap-0.5 text-[11px] font-bold text-neon-green">
                        <Award className="h-3 w-3" /> Cheapest
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {row.product.sourceUrl && (
                      <a
                        href={row.product.sourceUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-1 text-xs text-neon-green hover:text-neon-greenDim"
                      >
                        Open <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-neon-ash inline-flex items-center gap-1.5">
        <Info className="h-3.5 w-3.5" /> Each result comes from that retailer's own page via TinyFish.
        Products are matched by brand, variant, and pack size. Price per kg/L enables fair comparison
        across different pack sizes.
      </p>
    </div>
  );
}
