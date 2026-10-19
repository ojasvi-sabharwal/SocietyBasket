import { ShoppingBasket, Trash2, ArrowRight, Tag, Truck, TrendingDown } from 'lucide-react';
import {
  PRODUCTS,
  RETAILERS,
  RETAILER_LIST,
  type RetailerId,
  effectivePrice,
  basketItemsTotal,
} from '@/data/catalog';
import { Button, Card, Badge, SectionTitle } from './ui';
import { SmartImage } from './SmartImage';
import type { PageId } from './Header';

export function BasketPage({
  basket,
  onInc,
  onDec,
  onRemove,
  onClear,
  setPage,
  preferredRetailer,
  setPreferredRetailer,
}: {
  basket: Record<string, number>;
  onInc: (id: string) => void;
  onDec: (id: string) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  setPage: (p: PageId) => void;
  preferredRetailer: RetailerId;
  setPreferredRetailer: (r: RetailerId) => void;
}) {
  const items = Object.entries(basket)
    .filter(([, qty]) => qty > 0)
    .map(([id, qty]) => ({ product: PRODUCTS.find((p) => p.id === id)!, qty }));

  const totals = basketItemsTotal(
    items.map((i) => ({ productId: i.product.id, qty: i.qty })),
    preferredRetailer
  );

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
        <Card className="p-10 text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-neon-dark/40 text-neon-green shadow-glowSoft">
            <ShoppingBasket className="h-8 w-8" />
          </span>
          <h2 className="mt-4 font-display text-xl font-semibold text-neon-ink">Your basket is empty</h2>
          <p className="mt-1 text-sm text-neon-ash">
            Add groceries from the catalogue to start pooling your society order.
          </p>
          <div className="mt-5 flex justify-center">
            <Button variant="primary" onClick={() => setPage('catalogue')}>
              Browse catalogue <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const retailer = RETAILERS[preferredRetailer];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
      <SectionTitle
        eyebrow="Shared society basket"
        title="Your society basket"
        subtitle="Items pool together for the whole society. Switch suppliers to see your total change."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* items */}
        <div className="lg:col-span-2 space-y-3">
          {items.map(({ product, qty }) => {
            const pp = product.prices[preferredRetailer];
            const available = pp && pp.inStock;
            const eff = available ? effectivePrice(pp) : 0;
            return (
              <Card key={product.id} className="p-3 flex gap-3 items-center">
                <SmartImage
                  src={product.image}
                  alt={product.name}
                  fallbackLabel={product.name}
                  className="h-16 w-16 rounded-xl object-cover bg-neon-cherry shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-neon-ink text-sm truncate">{product.name}</h3>
                  <p className="text-xs text-neon-ash">{product.packSize}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-sm font-bold text-neon-green">
                      {available ? `₹${(eff * qty).toFixed(0)}` : '—'}
                    </span>
                    {available && pp.discountPct > 0 && (
                      <Badge tone="spring">
                        <Tag className="h-3 w-3" /> {pp.discountPct}% off
                      </Badge>
                    )}
                    {!available && <Badge tone="red">Not at {retailer.name}</Badge>}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <div className="inline-flex items-center rounded-lg bg-neon-cherry ring-1 ring-inset ring-neon-smoke">
                    <button
                      onClick={() => onDec(product.id)}
                      className="grid h-8 w-8 place-items-center rounded-l-lg hover:bg-neon-dark/40 text-neon-ink"
                      aria-label="Decrease"
                    >
                      −
                    </button>
                    <span className="min-w-[2rem] text-center text-sm font-bold text-neon-green">{qty}</span>
                    <button
                      onClick={() => onInc(product.id)}
                      className="grid h-8 w-8 place-items-center rounded-r-lg hover:bg-neon-dark/40 text-neon-ink"
                      aria-label="Increase"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => onRemove(product.id)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </button>
                </div>
              </Card>
            );
          })}

          <div className="flex justify-between pt-2">
            <button
              onClick={onClear}
              className="text-sm font-semibold text-neon-ash hover:text-red-600 inline-flex items-center gap-1.5"
            >
              <Trash2 className="h-4 w-4" /> Clear basket
            </button>
            <Button variant="outline" size="sm" onClick={() => setPage('compare')}>
              Compare all suppliers <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* summary */}
        <div className="lg:col-span-1">
          <Card className="p-5 sticky top-28">
            <h3 className="font-display font-semibold text-neon-ink">Order summary</h3>

            <label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-neon-ash">
              Fulfilment supplier
            </label>
            <div className="mt-2 space-y-2">
              {RETAILER_LIST.map((r) => {
                const t = basketItemsTotal(
                  items.map((i) => ({ productId: i.product.id, qty: i.qty })),
                  r.id
                );
                const selected = r.id === preferredRetailer;
                return (
                  <button
                    key={r.id}
                    onClick={() => setPreferredRetailer(r.id)}
                    className={`w-full flex items-center justify-between rounded-xl p-3 text-left transition-all ${
                      selected
                        ? 'bg-neon-dark/60 text-neon-green ring-2 ring-neon-spring/50 shadow-glowSoft'
                        : 'bg-neon-cherry ring-1 ring-inset ring-neon-smoke hover:bg-neon-dark/30 text-neon-ink'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ background: r.color }}
                      />
                      <span className="text-sm font-bold">{r.name}</span>
                    </span>
                    <span className="text-sm font-bold">₹{t.total.toFixed(0)}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 space-y-2 text-sm">
              <Row label="Subtotal" value={`₹${totals.subtotal.toFixed(0)}`} />
              <Row
                label={
                  <span className="inline-flex items-center gap-1.5">
                    <Truck className="h-3.5 w-3.5 text-neon-ash" /> Delivery fee
                    {totals.deliveryFee === 0 && <Badge tone="spring">FREE</Badge>}
                  </span>
                }
                value={totals.deliveryFee === 0 ? '₹0' : `₹${totals.deliveryFee}`}
              />
              <Row
                label={<span className="inline-flex items-center gap-1.5 text-neon-green"><TrendingDown className="h-3.5 w-3.5" /> Product savings</span>}
                value={<span className="text-neon-green font-bold">−₹{totals.savings.toFixed(0)}</span>}
              />
              <div className="my-3 h-px bg-neon-dark/60" />
              <div className="flex items-center justify-between">
                <span className="font-bold text-neon-ink">Total</span>
                <span className="text-xl font-extrabold text-neon-green">
                  ₹{totals.total.toFixed(0)}
                </span>
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              className="mt-5 w-full"
              onClick={() => setPage('bestdeal')}
            >
              See best deal <ArrowRight className="h-4 w-4" />
            </Button>
            <p className="mt-3 text-center text-[11px] text-neon-ash">
              No checkout or payment — demo only.
            </p>
          </Card>
        </div>
      </div>
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
