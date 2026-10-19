import { useEffect, useMemo, useState } from 'react';
import { Search, SlidersHorizontal, PackageX, Users, ArrowRight, Info, CheckCircle2 } from 'lucide-react';
import { CATEGORIES, PRODUCTS, type CategoryId, type RetailerId } from '@/data/catalog';
import { fetchCampaigns, type CampaignWithCommitments } from '@/lib/groupBuy';
import { ProductCard } from './ProductCard';
import { Badge, Button } from './ui';
import type { PageId } from './Header';

export function CataloguePage({
  search,
  setSearch,
  activeCategory,
  setActiveCategory,
  basket,
  onAdd,
  onInc,
  onDec,
  preferredRetailer,
  society,
  residentName,
  onSelectCampaign,
  setPage,
}: {
  search: string;
  setSearch: (s: string) => void;
  activeCategory: CategoryId | 'all';
  setActiveCategory: (c: CategoryId | 'all') => void;
  basket: Record<string, number>;
  onAdd: (productId: string, retailerId: RetailerId) => void;
  onInc: (productId: string) => void;
  onDec: (productId: string) => void;
  preferredRetailer: RetailerId;
  society: string;
  residentName: string;
  onSelectCampaign: (id: string) => void;
  setPage: (p: PageId) => void;
}) {
  const [sort, setSort] = useState<'popularity' | 'price-low' | 'discount'>('popularity');
  const [campaigns, setCampaigns] = useState<CampaignWithCommitments[]>([]);

  useEffect(() => {
    void (async () => {
      try {
        const data = await fetchCampaigns(society, residentName);
        setCampaigns(data);
      } catch {
        setCampaigns([]);
      }
    })();
  }, [society, residentName]);

  const activeCampaignsByProduct = useMemo(() => {
    const map = new Map<string, CampaignWithCommitments>();
    for (const c of campaigns) {
      if (c.derivedStatus === 'closed' || c.derivedStatus === 'cancelled') continue;
      const existing = map.get(c.product_id);
      if (!existing || c.total_committed > existing.total_committed) {
        map.set(c.product_id, c);
      }
    }
    return map;
  }, [campaigns]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = PRODUCTS.filter((p) => {
      const matchCat = activeCategory === 'all' || p.category === activeCategory;
      const matchQ = !q || p.name.toLowerCase().includes(q) || p.packSize.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
    if (sort === 'price-low') {
      list = [...list].sort(
        (a, b) =>
          Math.min(...Object.values(a.prices).map((pp) => pp.price * (1 - pp.discountPct / 100))) -
          Math.min(...Object.values(b.prices).map((pp) => pp.price * (1 - pp.discountPct / 100)))
      );
    } else if (sort === 'discount') {
      list = [...list].sort(
        (a, b) => Math.max(...Object.values(b.prices).map((pp) => pp.discountPct)) -
        Math.max(...Object.values(a.prices).map((pp) => pp.discountPct))
      );
    }
    return list;
  }, [search, activeCategory, sort]);

  const productsWithCampaigns = filtered.filter((p) => activeCampaignsByProduct.has(p.id));

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-neon-ink">Grocery catalogue</h1>
          <p className="text-sm text-neon-ash mt-0.5">
            {filtered.length} product{filtered.length !== 1 ? 's' : ''} · Demo prices
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-neon-ash" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="h-10 rounded-xl bg-neon-panel ring-1 ring-inset ring-neon-smoke px-3 text-sm font-medium text-neon-ink hover:bg-neon-dark/30 cursor-pointer transition-colors"
          >
            <option value="popularity">Sort: Popularity</option>
            <option value="price-low">Price: Low to High</option>
            <option value="discount">Biggest discount</option>
          </select>
        </div>
      </div>

      {/* Group buy matches banner */}
      {productsWithCampaigns.length > 0 && (
        <div className="mt-4 rounded-xl bg-neon-green/15 ring-1 ring-neon-green/40 p-4 flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-neon-green shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-neon-ink">
              <span className="font-bold text-neon-green">{productsWithCampaigns.length} group buy{productsWithCampaigns.length !== 1 ? 's' : ''} available</span>
              {' '}for products in this view.
            </p>
            <p className="text-xs text-neon-ash mt-0.5">
              Join a campaign to combine demand with neighbours and unlock bulk pricing. Look for the
              green <span className="font-semibold text-neon-green">Join Group Buy</span> badge on matching products.
            </p>
            <Button variant="primary" size="sm" className="mt-2" onClick={() => setPage('groupbuys')}>
              <Users className="h-3.5 w-3.5" /> View all campaigns <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Quick Order — secondary note */}
      <div className="mt-4 rounded-lg bg-neon-dark/30 ring-1 ring-neon-smoke px-3 py-2 flex items-center gap-2">
        <Info className="h-3.5 w-3.5 text-neon-ash shrink-0" />
        <p className="text-xs text-neon-ash">
          Individual Quick Order: add to basket at current retailer prices. No bulk-price guarantee.
        </p>
      </div>

      {/* local search */}
      <div className="relative mt-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neon-ash" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products…"
          className="w-full h-11 pl-10 pr-3 rounded-xl bg-neon-panel ring-1 ring-inset ring-neon-smoke text-sm text-neon-ink placeholder:text-neon-ash focus:outline-none focus:ring-2 focus:ring-neon-spring/50 transition-all"
        />
      </div>

      {/* category chips */}
      <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar pb-1">
        <Chip active={activeCategory === 'all'} onClick={() => setActiveCategory('all')}>
          All
        </Chip>
        {CATEGORIES.map((c) => (
          <Chip
            key={c.id}
            active={activeCategory === c.id}
            onClick={() => setActiveCategory(c.id)}
          >
            {c.label}
          </Chip>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-16 flex flex-col items-center text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-neon-panel text-neon-ash ring-1 ring-neon-dark/60">
            <PackageX className="h-7 w-7" />
          </span>
          <h3 className="mt-4 font-display font-semibold text-neon-ink">No products found</h3>
          <p className="mt-1 text-sm text-neon-ash">Try a different search or category.</p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {filtered.map((p) => {
            const campaign = activeCampaignsByProduct.get(p.id);
            return (
              <div key={p.id}>
                {campaign && (
                  <button
                    onClick={() => onSelectCampaign(campaign.id)}
                    className="mb-2 w-full rounded-lg bg-neon-spring/10 ring-1 ring-neon-spring/40 px-2.5 py-2 text-[11px] font-bold text-neon-green hover:bg-neon-spring/20 transition-all inline-flex items-center gap-1.5 shadow-glowSoft"
                  >
                    <Users className="h-3.5 w-3.5" />
                    Join Group Buy · ₹{+campaign.bulk_price}/unit
                    {campaign.bulk_price_confirmed ? (
                      <span className="inline-flex items-center gap-0.5 text-[9px] text-neon-green/80">· VERIFIED</span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 text-[9px] text-neon-ash">· EST.</span>
                    )}
                    <ArrowRight className="h-3 w-3 ml-auto" />
                  </button>
                )}
                <ProductCard
                  product={p}
                  qty={basket[p.id] ?? 0}
                  onAdd={(r) => onAdd(p.id, r)}
                  onInc={() => onInc(p.id)}
                  onDec={() => onDec(p.id)}
                  preferredRetailer={preferredRetailer}
                />
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-8 flex items-center justify-center">
        <Badge tone="muted">Demo data — prices are illustrative</Badge>
      </div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-all ${
        active
          ? 'bg-neon-spring text-neon-black shadow-glowSoft'
          : 'bg-neon-panel text-neon-ash ring-1 ring-inset ring-neon-smoke hover:bg-neon-dark/30 hover:text-neon-ink'
      }`}
    >
      {children}
    </button>
  );
}
