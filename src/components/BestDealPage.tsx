import { useMemo } from 'react';
import { Award, TrendingDown, Users, Check, ArrowRight, Info, Zap, Fish } from 'lucide-react';
import {
  PRODUCTS,
  RETAILERS,
  RETAILER_LIST,
  basketItemsTotal,
} from '@/data/catalog';
import {
  type LiveExtraction,
  compareLiveProducts,
} from '@/data/liveProducts';
import { Button, Card, Badge, SectionTitle } from './ui';
import type { PageId } from './Header';

export function BestDealPage({
  basket,
  setPage,
  families,
  setFamilies,
  liveExtraction,
}: {
  basket: Record<string, number>;
  setPage: (p: PageId) => void;
  families: number;
  setFamilies: (n: number) => void;
  liveExtraction: LiveExtraction | null;
}) {
  const items = Object.entries(basket)
    .filter(([, qty]) => qty > 0)
    .map(([id, qty]) => ({ product: PRODUCTS.find((p) => p.id === id)!, qty }));

  const perRetailer = useMemo(() => {
    return RETAILER_LIST.map((r) => {
      const totals = basketItemsTotal(
        items.map((i) => ({ productId: i.product.id, qty: i.qty })),
        r.id
      );
      const availableCount = items.filter((i) => {
        const pp = i.product.prices[r.id];
        return pp && pp.inStock;
      }).length;
      return { retailer: r, totals, availableCount };
    });
  }, [items]);

  const sorted = [...perRetailer].sort((a, b) => a.totals.total - b.totals.total);
  const best = sorted[0] ?? null;
  const worst = sorted[sorted.length - 1] ?? null;

  const liveComparison = useMemo(() => {
    if (!liveExtraction || liveExtraction.products.length === 0) return null;
    return compareLiveProducts(liveExtraction.products);
  }, [liveExtraction]);

  const hasLiveData = liveComparison !== null && liveComparison.rows.length > 0;

  // Extract live data to plain variables for clean JSX.
  const liveCheapest = liveComparison?.cheapest ?? null;
  const liveDearest = liveComparison?.dearest ?? null;
  const liveSavings = liveComparison?.savings ?? 0;
  const liveSavingsPct = liveComparison?.savingsPct ?? 0;
  const liveRowCount = liveComparison?.rows.length ?? 0;

  if (items.length === 0 && !hasLiveData) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
        <Card className="p-10 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-neon-dark/40 text-neon-green shadow-glowSoft">
            <Award className="h-7 w-7" />
          </span>
          <h2 className="mt-4 font-display text-xl font-semibold text-neon-ink">No recommendation yet</h2>
          <p className="mt-1 text-sm text-neon-ash">
            Add products to your basket or fetch live prices, and we'll recommend the cheapest supplier.
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <Button variant="primary" onClick={() => setPage('catalogue')}>
              Browse catalogue <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={() => setPage('tinyfish')}>
              <Zap className="h-4 w-4" /> Fetch live prices
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Basket-derived values — only meaningful when basket has items.
  const hasBasket = items.length > 0 && best && worst;
  const savingsVsWorst = hasBasket ? +(worst.totals.total - best.totals.total).toFixed(2) : 0;
  const savingsVsMRP = hasBasket ? best.totals.savings : 0;
  const perFamilySavings = +(savingsVsWorst / families).toFixed(2);
  const societySavings = +(savingsVsWorst * families).toFixed(2);
  const bestRetailer = hasBasket ? best.retailer : null;

  const reasons: string[] = [];
  if (hasBasket && bestRetailer) {
    if (best.totals.deliveryFee === 0) {
      reasons.push(
        `Free delivery (orders over ₹${bestRetailer.freeDeliveryOver}) knocked off ₹${RETAILERS[worst.retailer.id].deliveryFee} versus the priciest option.`
      );
    }
    if (best.totals.savings > 0) {
      reasons.push(`Product-level discounts save ₹${best.totals.savings.toFixed(0)} off MRP.`);
    }
    if (best.availableCount === items.length) {
      reasons.push(`All ${items.length} basket items are in stock — no substitution needed.`);
    } else {
      reasons.push(`${best.availableCount} of ${items.length} items in stock.`);
    }
    reasons.push(
      `Final total ₹${best.totals.total.toFixed(0)} beats ${worst.retailer.name} (₹${worst.totals.total.toFixed(0)}) by ₹${savingsVsWorst.toFixed(0)}.`
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
      <SectionTitle
        eyebrow={hasLiveData ? 'Live best deal' : 'Best deal recommendation'}
        title={hasLiveData ? 'Best live deal' : 'Our recommendation'}
        subtitle={
          hasLiveData
            ? `Real prices extracted via TinyFish${liveExtraction?.searchIntent ? ` for "${liveExtraction.searchIntent}"` : ''}. Cheapest option highlighted per kg/L.`
            : 'We pick the supplier with the lowest comparable total cost for your basket.'
        }
      />

      {/* LIVE best deal */}
      {hasLiveData && liveCheapest && (
        <Card className="overflow-hidden mb-8 ring-1 ring-neon-spring/30 shadow-glowSoft">
          <div className="bg-gradient-to-br from-neon-soft to-white p-6 sm:p-8 relative overflow-hidden fresh-glow-bg">
            <div className="relative flex flex-wrap items-center gap-4">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-neon-spring/30 text-neon-green shadow-soft">
                <Fish className="h-7 w-7" strokeWidth={2.5} />
              </span>
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.18em] text-neon-green">
                  Best live deal <Badge tone="spring">LIVE</Badge>
                </div>
                <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight text-neon-ink">
                  {liveCheapest.product.name}
                </h2>
                <p className="text-sm text-neon-ash">
                  {liveCheapest.product.retailer} · {liveCheapest.product.packSize}
                </p>
              </div>
              <div className="ml-auto text-right">
                <div className="text-xs uppercase tracking-wider text-neon-ash">Per kg</div>
                <div className="font-display text-3xl font-bold text-neon-green">
                  ₹{liveCheapest.pricePerKgOrL.toFixed(0)}
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 grid gap-6 sm:grid-cols-3">
            <Stat label="Best retailer" value={liveCheapest.product.retailer || '—'} />
            <Stat label="Total savings per kg" value={`₹${liveSavings.toFixed(0)}`} tone="spring" />
            <Stat label="Price difference" value={`${liveSavingsPct.toFixed(0)}% cheaper`} tone="spring" />
          </div>

          {liveDearest && (
            <div className="px-6 pb-6">
              <div className="rounded-2xl bg-neon-spring/5 ring-1 ring-neon-spring/20 p-4 flex items-center gap-3">
                <TrendingDown className="h-5 w-5 text-neon-green shrink-0" />
                <p className="text-sm text-neon-ink">
                  <span className="font-bold">{liveCheapest.product.retailer}</span> is{' '}
                  <span className="font-bold text-neon-green">₹{liveSavings.toFixed(0)}/kg</span> cheaper than{' '}
                  <span className="font-bold">{liveDearest.product.retailer}</span> ({liveSavingsPct.toFixed(0)}% savings).
                </p>
              </div>
            </div>
          )}

          <div className="border-t border-neon-dark/60 p-5 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-neon-ash">
              {liveRowCount} live product{liveRowCount !== 1 ? 's' : ''} compared.
            </div>
            <Button variant="outline" onClick={() => setPage('compare')}>
              View full comparison <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* DEMO best deal — basket-based */}
      {hasBasket && (
        <>
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-br from-neon-soft to-white p-6 sm:p-8 relative overflow-hidden fresh-glow-bg">
              <div className="relative flex flex-wrap items-center gap-4">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-neon-spring/30 text-neon-green shadow-soft">
                  <Award className="h-7 w-7" strokeWidth={2.5} />
                </span>
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.18em] text-neon-green">
                    Recommended supplier <Badge tone="green">DEMO</Badge>
                  </div>
                  <h2 className="mt-1 font-display text-3xl font-semibold tracking-tight text-neon-ink">{bestRetailer!.name}</h2>
                  <p className="text-sm text-neon-ash">{bestRetailer!.tagline}</p>
                </div>
                <div className="ml-auto text-right">
                  <div className="text-xs uppercase tracking-wider text-neon-ash">Final total</div>
                  <div className="font-display text-4xl font-bold text-neon-green">
                    ₹{best!.totals.total.toFixed(0)}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 grid gap-6 lg:grid-cols-2">
              <div>
                <h3 className="font-display font-semibold text-neon-ink mb-3">Why {bestRetailer!.name}?</h3>
                <ul className="space-y-2.5">
                  {reasons.map((r, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-neon-ink">
                      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-neon-spring/30 text-neon-green">
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl bg-neon-soft/60 ring-1 ring-neon-dark p-5">
                <div className="flex items-center gap-2 text-neon-green">
                  <TrendingDown className="h-5 w-5" />
                  <h3 className="font-display font-semibold text-neon-ink">Savings summary</h3>
                </div>

                <div className="mt-4 space-y-3">
                  <Stat label="Basket savings vs priciest supplier" value={`₹${savingsVsWorst.toFixed(0)}`} />
                  <Stat label="Product savings vs MRP" value={`₹${savingsVsMRP.toFixed(0)}`} tone="spring" />

                  <div className="my-2 h-px bg-neon-dark" />

                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-wider text-neon-green inline-flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" /> Participating families
                    </span>
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={500}
                        value={families}
                        onChange={(e) =>
                          setFamilies(Math.max(1, Math.min(500, Number(e.target.value) || 1)))
                        }
                        className="w-24 h-10 rounded-xl bg-white ring-1 ring-inset ring-neon-dark px-3 text-sm font-bold text-neon-ink focus:outline-none focus:ring-2 focus:ring-neon-green/40"
                      />
                      <span className="text-sm text-neon-green">families in your society</span>
                    </div>
                  </label>

                  <Stat label="Per-family savings" value={`₹${perFamilySavings.toFixed(0)}`} tone="big" />
                  <Stat label="Total society savings" value={`₹${societySavings.toFixed(0)}`} tone="big" />
                </div>
                <p className="mt-3 text-[11px] text-neon-ash inline-flex items-center gap-1.5">
                  <Info className="h-3 w-3" /> Assumes every family buys the same basket. Demo prices.
                </p>
              </div>
            </div>

            <div className="border-t border-neon-dark p-5 flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-neon-ash">
                Compare the full breakdown on the comparison page.
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setPage('compare')}>
                  View comparison
                </Button>
                <Button variant="terracotta" onClick={() => setPage('basket')}>
                  Review basket <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>

          <div className="mt-8">
            <h3 className="font-display text-lg font-semibold text-neon-ink mb-3">
              All suppliers ranked <Badge tone="green">DEMO</Badge>
            </h3>
            <div className="space-y-2">
              {sorted.map(({ retailer, totals, availableCount }, idx) => (
                <Card key={retailer.id} className="p-4 flex items-center gap-4">
                  <span
                    className={`grid h-8 w-8 place-items-center rounded-full text-sm font-bold ${
                      idx === 0 ? 'bg-neon-spring text-neon-ink shadow-soft' : 'bg-neon-soft text-neon-ash'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <span className="h-3 w-3 rounded-full" style={{ background: retailer.color }} />
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-neon-ink">{retailer.name}</div>
                    <div className="text-xs text-neon-ash">
                      {availableCount}/{items.length} items · delivery{' '}
                      {totals.deliveryFee === 0 ? 'free' : `₹${totals.deliveryFee}`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-extrabold text-neon-green">₹{totals.total.toFixed(0)}</div>
                    {idx === 0 ? (
                      <Badge tone="spring">Best</Badge>
                    ) : (
                      <span className="text-xs text-neon-ash">
                        +₹{(totals.total - best!.totals.total).toFixed(0)}
                      </span>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string;
  tone?: 'default' | 'spring' | 'big';
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-neon-ash">{label}</span>
      <span
        className={`font-extrabold ${
          tone === 'big'
            ? 'text-xl text-neon-green'
            : tone === 'spring'
              ? 'text-neon-green'
              : 'text-neon-ink'
        }`}
      >
        {value}
      </span>
    </div>
  );
}
