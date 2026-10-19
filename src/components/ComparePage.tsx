import { useMemo } from 'react';
import { Truck, Tag, TrendingDown, Award, Info, ArrowRight, Zap, Fish } from 'lucide-react';
import {
  PRODUCTS,
  RETAILER_LIST,
  effectivePrice,
  basketItemsTotal,
} from '@/data/catalog';
import {
  type LiveExtraction,
  compareLiveProducts,
} from '@/data/liveProducts';
import { Button, Card, Badge, SectionTitle } from './ui';
import { SmartImage } from './SmartImage';
import type { PageId } from './Header';

export function ComparePage({
  basket,
  setPage,
  liveExtraction,
}: {
  basket: Record<string, number>;
  setPage: (p: PageId) => void;
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
      return { retailer: r, totals, availableCount, missing: items.length - availableCount };
    }).sort((a, b) => a.totals.total - b.totals.total);
  }, [items]);

  const cheapest = perRetailer[0];
  const dearest = perRetailer[perRetailer.length - 1];

  const liveComparison = useMemo(() => {
    if (!liveExtraction || liveExtraction.products.length === 0) return null;
    return compareLiveProducts(liveExtraction.products);
  }, [liveExtraction]);

  const hasLiveData = liveComparison !== null && liveComparison.rows.length > 0;

  if (items.length === 0 && !hasLiveData) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
        <Card className="p-10 text-center">
          <h2 className="font-display text-xl font-semibold text-neon-ink">Nothing to compare yet</h2>
          <p className="mt-1 text-sm text-neon-ash">
            Add a few products to your basket, then come back to see the side-by-side comparison.
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

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
      <SectionTitle
        eyebrow="Supplier comparison"
        title={hasLiveData ? 'Live price comparison' : 'Compare suppliers for your basket'}
        subtitle={
          hasLiveData
            ? `Real prices extracted via TinyFish${liveExtraction?.searchIntent ? ` for "${liveExtraction.searchIntent}"` : ''}. Normalized to price per kg/L for fair comparison.`
            : 'Equivalent products, quantities, discounts and delivery fees — all compared fairly.'
        }
      />

      {/* LIVE comparison section */}
      {hasLiveData && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Fish className="h-5 w-5 text-neon-green" />
            <h3 className="font-display text-lg font-semibold text-neon-ink">Live-extracted prices</h3>
            <Badge tone="spring">LIVE</Badge>
          </div>
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
                </tr>
              </thead>
              <tbody className="divide-y divide-neon-dark/60">
                {liveComparison!.rows.map((row, i) => (
                  <tr
                    key={`${row.product.name}-${i}`}
                    className={row.isCheapest ? 'bg-neon-spring/5 hover:bg-neon-spring/10' : 'hover:bg-neon-dark/20'}
                  >
                    <td className="px-4 py-3">
                      <div className="font-semibold text-neon-ink leading-tight">{row.product.name}</div>
                      {row.product.sourceUrl && (
                        <a
                          href={row.product.sourceUrl}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="text-[11px] text-neon-ash hover:text-neon-green"
                        >
                          source page
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-3 text-neon-ink">{row.product.retailer || '—'}</td>
                    <td className="px-4 py-3 text-center text-neon-ash">{row.product.packSize || '—'}</td>
                    <td className="px-4 py-3 text-center font-bold text-neon-ink">{row.product.displayPrice || '—'}</td>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {liveComparison!.cheapest && liveComparison!.dearest && liveComparison!.savings > 0 && (
            <div className="mt-4 rounded-2xl bg-neon-spring/5 ring-1 ring-neon-spring/20 p-4 flex items-center gap-3">
              <Award className="h-5 w-5 text-neon-green shrink-0" />
              <p className="text-sm text-neon-ink">
                Cheapest: <span className="font-bold">{liveComparison!.cheapest.product.name}</span> at{' '}
                <span className="font-bold text-neon-green">₹{liveComparison!.cheapest.pricePerKgOrL.toFixed(0)}/kg</span>
                {' — '}
                you save <span className="font-bold text-neon-green">₹{liveComparison!.savings.toFixed(0)}/kg</span>
                {' '}({liveComparison!.savingsPct.toFixed(0)}%) versus the priciest option.
              </p>
              <Button size="sm" variant="terracotta" className="ml-auto shrink-0" onClick={() => setPage('bestdeal')}>
                View best deal
              </Button>
            </div>
          )}
          <p className="mt-3 text-xs text-neon-ash inline-flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5" /> Live data extracted via TinyFish. Pack sizes normalized to price per kg or litre for fair comparison.
          </p>
        </div>
      )}

      {/* Basket comparison — DEMO data */}
      {items.length > 0 && (
        <>
        <div className={`flex items-center gap-2 mb-3 ${hasLiveData ? 'mt-6' : ''}`}>
          <h3 className="font-display text-lg font-semibold text-neon-ink">Basket comparison</h3>
          <Badge tone="green">DEMO</Badge>
        </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {perRetailer.map(({ retailer, totals, availableCount, missing }, idx) => {
          const isBest = idx === 0 && totals.total > 0;
          return (
            <Card
              key={retailer.id}
              className={`p-5 relative overflow-hidden ${
                isBest ? 'ring-2 ring-neon-spring/50 shadow-glowSoft' : ''
              }`}
            >
              {isBest && (
                <div className="absolute right-0 top-0 rounded-bl-xl bg-neon-spring px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-neon-black">
                  Best deal
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ background: retailer.color }} />
                <h3 className="font-display font-semibold text-neon-ink">{retailer.name}</h3>
              </div>
              <p className="text-xs text-neon-ash mt-0.5">{retailer.tagline}</p>

              <div className="mt-4 space-y-1.5 text-sm">
                <Row label="Items available" value={`${availableCount}/${items.length}`} />
                {missing > 0 && <Row label="Missing" value={<span className="text-red-600">{missing}</span>} />}
                <Row label="Subtotal" value={`₹${totals.subtotal.toFixed(0)}`} />
                <Row
                  label="Delivery fee"
                  value={totals.deliveryFee === 0 ? 'FREE' : `₹${totals.deliveryFee}`}
                />
                <Row label="Product savings" value={<span className="text-neon-green">₹{totals.savings.toFixed(0)}</span>} />
              </div>
              <div className="my-3 h-px bg-neon-dark/60" />
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-semibold text-neon-ash">Total</span>
                <span className="text-2xl font-extrabold text-neon-green">
                  ₹{totals.total.toFixed(0)}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-neon-ash">
                <span className="inline-flex items-center gap-1"><Truck className="h-3.5 w-3.5" /> {retailer.etaMins}</span>
                <span>★ {retailer.rating}</span>
              </div>
            </Card>
          );
        })}
      </div>

      {cheapest && dearest && cheapest.totals.total > 0 && (
        <div className="mt-4 rounded-2xl bg-neon-green/10 ring-1 ring-neon-green/30 p-4 flex items-center gap-3">
          <Award className="h-5 w-5 text-neon-green shrink-0" />
          <p className="text-sm text-neon-ink">
            <span className="font-bold">{cheapest.retailer.name}</span> is cheapest at{' '}
            <span className="font-bold">₹{cheapest.totals.total.toFixed(0)}</span> — you save{' '}
            <span className="font-bold text-neon-green">
              ₹{(dearest.totals.total - cheapest.totals.total).toFixed(0)}
            </span>{' '}
            versus {dearest.retailer.name}.
          </p>
          <Button size="sm" variant="terracotta" className="ml-auto shrink-0" onClick={() => setPage('bestdeal')}>
            View best deal
          </Button>
        </div>
      )}

      {/* Detailed table */}
      <div className="mt-8">
        <h3 className="font-display text-lg font-semibold text-neon-ink mb-3">Per-product breakdown</h3>
        <div className="overflow-x-auto rounded-2xl ring-1 ring-neon-dark/60 shadow-soft bg-neon-panel">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neon-cherry text-left text-xs uppercase tracking-wider text-neon-ash">
                <th className="px-4 py-3 font-bold">Product</th>
                {RETAILER_LIST.map((r) => (
                  <th key={r.id} className="px-4 py-3 font-bold text-center">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ background: r.color }} />
                      {r.name}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neon-dark/60">
              {items.map(({ product, qty }) => (
                <tr key={product.id} className="hover:bg-neon-dark/20">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <SmartImage src={product.image} alt="" fallbackLabel={product.name} className="h-9 w-9 rounded-lg object-cover" />
                      <div>
                        <div className="font-semibold text-neon-ink leading-tight">{product.name}</div>
                        <div className="text-xs text-neon-ash">
                          {product.packSize} × {qty}
                        </div>
                      </div>
                    </div>
                  </td>
                  {RETAILER_LIST.map((r) => {
                    const pp = product.prices[r.id];
                    if (!pp || !pp.inStock) {
                      return (
                        <td key={r.id} className="px-4 py-3 text-center text-neon-ash">—</td>
                      );
                    }
                    const eff = effectivePrice(pp);
                    const line = eff * qty;
                    return (
                      <td key={r.id} className="px-4 py-3 text-center">
                        <div className="font-bold text-neon-ink">₹{line.toFixed(0)}</div>
                        <div className="text-[11px] text-neon-ash">
                          ₹{pp.price} {pp.discountPct > 0 && <span className="text-neon-green">−{pp.discountPct}%</span>}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
              {/* totals row */}
              <tr className="bg-neon-cherry font-bold">
                <td className="px-4 py-3 text-neon-ink">Subtotal</td>
                {RETAILER_LIST.map((r) => {
                  const t = basketItemsTotal(
                    items.map((i) => ({ productId: i.product.id, qty: i.qty })),
                    r.id
                  );
                  return <td key={r.id} className="px-4 py-3 text-center text-neon-ink">₹{t.subtotal.toFixed(0)}</td>;
                })}
              </tr>
              <tr className="bg-neon-dark/20 text-sm">
                <td className="px-4 py-2 text-neon-ash">
                  <span className="inline-flex items-center gap-1.5"><Truck className="h-3.5 w-3.5" /> Delivery</span>
                </td>
                {RETAILER_LIST.map((r) => {
                  const t = basketItemsTotal(
                    items.map((i) => ({ productId: i.product.id, qty: i.qty })),
                    r.id
                  );
                  return (
                    <td key={r.id} className="px-4 py-2 text-center text-neon-ink">
                      {t.deliveryFee === 0 ? <Badge tone="spring">FREE</Badge> : `₹${t.deliveryFee}`}
                    </td>
                  );
                })}
              </tr>
              <tr className="bg-neon-cherry text-neon-green font-bold">
                <td className="px-4 py-3">Final total</td>
                {perRetailer
                  .slice()
                  .sort((a, b) => RETAILER_LIST.findIndex((r) => r.id === a.retailer.id) - RETAILER_LIST.findIndex((r) => r.id === b.retailer.id))
                  .map(({ retailer, totals }) => (
                    <td key={retailer.id} className="px-4 py-3 text-center">
                      ₹{totals.total.toFixed(0)}
                    </td>
                  ))}
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-neon-ash inline-flex items-center gap-1.5">
          <Info className="h-3.5 w-3.5" /> Comparison uses identical products and quantities across suppliers. Demo prices.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Badge tone="muted"><Tag className="h-3 w-3" /> Discounts applied</Badge>
        <Badge tone="muted"><Truck className="h-3 w-3" /> Delivery fees included</Badge>
        <Badge tone="muted"><TrendingDown className="h-3 w-3" /> Fair per-unit comparison</Badge>
      </div>
        </>
      )}
    </div>
  );
}

function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-neon-ash">{label}</span>
      <span className="font-semibold text-neon-ink">{value}</span>
    </div>
  );
}
