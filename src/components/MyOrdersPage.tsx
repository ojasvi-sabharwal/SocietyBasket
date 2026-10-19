import { useEffect, useState } from 'react';
import {
  ShoppingBasket,
  Users,
  Clock,
  ArrowRight,
  TrendingDown,
  Package,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { PRODUCTS, effectivePrice, type RetailerId } from '@/data/catalog';
import { fetchMyCommitments, formatRemaining, formatDeadline, type CampaignWithCommitments, type CommitmentRow } from '@/lib/groupBuy';
import { Badge, Button, Card, SectionTitle } from './ui';
import { SmartImage } from './SmartImage';
import type { PageId } from './Header';

export function MyOrdersPage({
  basket,
  residentName,
  society,
  setPage,
  preferredRetailer,
  onSelectCampaign,
}: {
  basket: Record<string, number>;
  residentName: string;
  society: string;
  setPage: (p: PageId) => void;
  preferredRetailer: RetailerId;
  onSelectCampaign: (id: string) => void;
}) {
  const [commitments, setCommitments] = useState<{ campaign: CampaignWithCommitments; commitment: CommitmentRow }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMyCommitments(residentName, society);
      setCommitments(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load commitments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [residentName, society]);

  const quickItems = Object.entries(basket)
    .filter(([, q]) => q > 0)
    .map(([id, qty]) => ({ product: PRODUCTS.find((p) => p.id === id)!, qty }));

  const quickTotal = quickItems.reduce((s, { product, qty }) => {
    const pp = product.prices[preferredRetailer];
    return pp?.inStock ? s + effectivePrice(pp) * qty : s;
  }, 0);

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6">
      <SectionTitle
        eyebrow="My orders"
        title="My Quick Orders & Group Buys"
        subtitle="Track your individual purchases and group-buy commitments in one place."
      />

      {/* Quick Orders */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <ShoppingBasket className="h-5 w-5 text-neon-green" />
          <h3 className="font-display text-lg font-semibold text-neon-ink">Quick Orders</h3>
          <Badge tone="spring">INDIVIDUAL</Badge>
        </div>

        {quickItems.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-sm text-neon-ash">No items in your basket yet.</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => setPage('catalogue')}>
              Browse catalogue <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="divide-y divide-neon-dark/60">
              {quickItems.map(({ product, qty }) => {
                const pp = product.prices[preferredRetailer];
                const eff = pp?.inStock ? effectivePrice(pp) : 0;
                return (
                  <div key={product.id} className="flex items-center gap-3 p-4">
                    <SmartImage
                      src={product.image}
                      alt={product.name}
                      fallbackLabel={product.name}
                      className="h-12 w-12 rounded-lg object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-neon-ink truncate">{product.name}</div>
                      <div className="text-xs text-neon-ash">{product.packSize} × {qty}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold text-neon-green">₹{(eff * qty).toFixed(0)}</div>
                      <div className="text-[11px] text-neon-ash">at {preferredRetailer}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="p-4 border-t border-neon-dark/60 flex items-center justify-between">
              <span className="text-sm text-neon-ash">Basket total</span>
              <span className="font-display text-xl font-bold text-neon-green">₹{quickTotal.toFixed(0)}</span>
            </div>
            <div className="p-4 border-t border-neon-dark/60 flex gap-2">
              <Button variant="primary" size="sm" onClick={() => setPage('basket')}>
                Review basket <ArrowRight className="h-3.5 w-3.5" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage('catalogue')}>
                Add more items
              </Button>
            </div>
          </Card>
        )}
        <p className="mt-2 text-xs text-neon-ash">
          Quick Orders are individual purchases at current retailer prices — no bulk-price guarantee.
        </p>
      </div>

      {/* Group Buy Commitments */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-5 w-5 text-neon-green" />
          <h3 className="font-display text-lg font-semibold text-neon-ink">Group Buy Commitments</h3>
          <Button variant="ghost" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {loading && (
          <Card className="p-6 animate-pulseSoft">
            <div className="h-16 rounded bg-neon-dark/40" />
          </Card>
        )}

        {error && (
          <Card className="p-4 ring-2 ring-red-300">
            <p className="text-sm text-red-600">{error}</p>
          </Card>
        )}

        {!loading && !error && commitments.length === 0 && (
          <Card className="p-6 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-neon-dark/40 text-neon-green">
              <Users className="h-6 w-6" />
            </span>
            <p className="mt-3 text-sm text-neon-ash">You haven't joined any group-buy campaigns yet.</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => setPage('groupbuys')}>
              Browse campaigns <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Card>
        )}

        {!loading && !error && commitments.length > 0 && (
          <div className="space-y-3">
            {commitments.map(({ campaign, commitment }) => {
              const targetReached = campaign.total_committed >= campaign.min_qty;
              const closed = campaign.derivedStatus === 'closed';
              const myCost = +campaign.bulk_price * commitment.qty;
              const mySavings = campaign.perUnitSavings * commitment.qty;
              return (
                <Card key={commitment.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <SmartImage
                      src={campaign.product_image}
                      alt={campaign.product_name}
                      fallbackLabel={campaign.product_name}
                      className="h-14 w-14 rounded-lg object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-neon-ink">{campaign.product_name}</span>
                        {closed && targetReached && <Badge tone="emerald">SUCCESS</Badge>}
                        {closed && !targetReached && <Badge tone="muted">MISSED</Badge>}
                        {campaign.derivedStatus === 'open' && <Badge tone="spring">OPEN</Badge>}
                        {campaign.derivedStatus === 'closing_soon' && <Badge tone="green">CLOSING SOON</Badge>}
                        {campaign.derivedStatus === 'target_reached' && <Badge tone="emerald">TARGET REACHED</Badge>}
                      </div>
                      <div className="text-xs text-neon-ash mt-0.5">{campaign.product_pack_size}</div>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neon-ash">
                        <span className="inline-flex items-center gap-1">
                          <Package className="h-3 w-3" /> You: {commitment.qty} unit(s)
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3 w-3" /> {campaign.participant_count} joined
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {formatRemaining(campaign.remainingMs)}
                        </span>
                        <span>{formatDeadline(campaign.deadline)}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold text-neon-green">₹{myCost.toFixed(0)}</div>
                      {mySavings > 0 && (
                        <div className="text-[11px] text-neon-green">save ₹{mySavings.toFixed(0)}</div>
                      )}
                    </div>
                  </div>

                  {/* Status / next steps */}
                  {closed ? (
                    <div className={`mt-3 rounded-xl p-3 text-xs ${targetReached ? 'bg-neon-spring/5 ring-1 ring-neon-spring/20' : 'bg-neon-dark/30 ring-1 ring-neon-smoke'}`}>
                      {targetReached ? (
                        <p className="text-neon-ink inline-flex items-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4 text-neon-green" />
                          Target reached — bulk price confirmed at ₹{+campaign.bulk_price}/unit.
                          Next step: complete your purchase with the supplier.
                        </p>
                      ) : (
                        <p className="text-neon-ash inline-flex items-center gap-1.5">
                          <AlertTriangle className="h-4 w-4" />
                          Target was not reached ({campaign.total_committed}/{campaign.min_qty} units).
                          You can purchase individually at ₹{+campaign.individual_price}/unit instead.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="mt-3 flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => onSelectCampaign(campaign.id)}>
                        Manage commitment <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
