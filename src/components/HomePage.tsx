import { useEffect, useState } from 'react';
import {
  Search,
  ShoppingBasket,
  ArrowRight,
  Users,
  TrendingDown,
  Sparkles,
  MapPin,
  Wheat,
  Pizza,
  Milk,
  Droplet,
  Candy,
  Soup,
  Cookie,
  Carrot,
  Building2,
  PiggyBank,
  Handshake,
  Zap,
  Fish,
  Clock,
  Package,
  CheckCircle2,
  PackageCheck,
  Plus,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { CATEGORIES, RETAILER_LIST, basketItemsTotal, type BasketItem } from '@/data/catalog';
import type { CategoryId } from '@/data/catalog';
import type { PageId } from './Header';
import { Button, Badge, Card } from './ui';
import { LogoMark } from './Logo';
import { SmartImage } from './SmartImage';
import {
  fetchCampaigns,
  formatRemaining,
  formatDeadline,
  type CampaignWithCommitments,
} from '@/lib/groupBuy';

const ICON_MAP: Record<string, typeof Search> = {
  Wheat,
  Pizza,
  Milk,
  Droplet,
  Candy,
  Soup,
  Cookie,
  Carrot,
};

function statusBadge(status: CampaignWithCommitments['derivedStatus']) {
  switch (status) {
    case 'open':
      return <Badge tone="spring">OPEN</Badge>;
    case 'closing_soon':
      return <Badge tone="green">CLOSING SOON</Badge>;
    case 'target_reached':
      return <Badge tone="emerald">TARGET REACHED</Badge>;
    case 'closed':
      return <Badge tone="muted">CLOSED</Badge>;
    case 'cancelled':
      return <Badge tone="red">CANCELLED</Badge>;
  }
}

export function HomePage({
  society,
  setSociety,
  societies,
  search,
  setSearch,
  setPage,
  basket,
  basketCount,
  families,
  onPickCategory,
  residentName,
  onSelectCampaign,
}: {
  society: string;
  setSociety: (s: string) => void;
  societies: readonly string[];
  search: string;
  setSearch: (s: string) => void;
  setPage: (p: PageId) => void;
  basket: Record<string, number>;
  basketCount: number;
  families: number;
  onPickCategory: (c: CategoryId) => void;
  residentName: string;
  onSelectCampaign: (id: string) => void;
}) {
  const basketItems: BasketItem[] = Object.entries(basket)
    .filter(([, q]) => q > 0)
    .map(([productId, qty]) => ({ productId, qty }));

  const perRetailerTotals = RETAILER_LIST.map((r) => ({
    retailer: r,
    totals: basketItemsTotal(basketItems, r.id),
  }));
  const bestTotal = perRetailerTotals.length
    ? Math.min(...perRetailerTotals.map((p) => p.totals.total))
    : 0;
  const worstTotal = perRetailerTotals.length
    ? Math.max(...perRetailerTotals.map((p) => p.totals.total))
    : 0;
  const combinedBasketValue = bestTotal;
  const potentialSavings = Math.max(0, worstTotal - bestTotal);
  const societySavings = potentialSavings * families;
  const demoFamilies = families || 12;

  // Fetch live campaigns for the "Open Group Buys" section
  const [campaigns, setCampaigns] = useState<CampaignWithCommitments[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setCampaignsLoading(true);
    void (async () => {
      try {
        const data = await fetchCampaigns(society, residentName);
        if (!cancelled) setCampaigns(data);
      } catch {
        if (!cancelled) setCampaigns([]);
      } finally {
        if (!cancelled) setCampaignsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [society, residentName]);

  const openCampaigns = campaigns.filter(
    (c) =>
      c.derivedStatus === 'open' ||
      c.derivedStatus === 'closing_soon' ||
      c.derivedStatus === 'target_reached'
  );

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      {/* ===== HERO — Group buying is the primary feature ===== */}
      <section className="relative overflow-hidden rounded-[2rem] bg-neon-soft ring-1 ring-neon-dark shadow-card animate-fadeIn fresh-glow-bg">
        <div className="absolute inset-0 fresh-grid opacity-60 pointer-events-none" />
        <div className="absolute -top-24 -right-16 h-72 w-72 rounded-full bg-neon-spring/12 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-neon-green/10 blur-3xl pointer-events-none" />

        <div className="relative grid gap-8 p-7 sm:p-10 lg:p-12 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-neon-green/20 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-neon-green ring-1 ring-inset ring-neon-green/40">
              <Users className="h-3.5 w-3.5" /> Community group buying
            </span>
            <h1 className="mt-5 font-display text-[36px] sm:text-[48px] lg:text-[56px] font-semibold tracking-tight leading-[1.02] text-neon-ink">
              Buy Together.<br />
              <span className="text-neon-green" style={{ textShadow: '0 0 24px rgba(0,255,65,0.35)' }}>
                Save Together.
              </span>
            </h1>
            <p className="mt-5 max-w-lg text-[15px] sm:text-base text-neon-ash leading-relaxed">
              Join your neighbours to combine purchasing power and unlock supplier-approved bulk
              pricing. Order at your own convenience — no need for everyone to be online at the
              same time. Commitments accumulate until the campaign deadline.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Button
                variant="primary"
                size="lg"
                onClick={() => setPage('groupbuys')}
                className="text-base px-7"
              >
                <Users className="h-5 w-5" /> Explore Group Orders
              </Button>
              <Button variant="outline" size="lg" onClick={() => setPage('createcampaign')}>
                <Plus className="h-5 w-5" /> Start a campaign
              </Button>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-neon-ash">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-neon-green" /> Order anytime before deadline
              </span>
              <span className="inline-flex items-center gap-1.5">
                <TrendingDown className="h-3.5 w-3.5 text-neon-green" /> Bulk prices when target is reached
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Handshake className="h-3.5 w-3.5 text-neon-green" /> No simultaneous coordination needed
              </span>
            </div>
          </div>

          {/* society selector card */}
          <div className="lg:justify-self-end w-full max-w-md">
            <div className="rounded-2xl bg-neon-panel p-5 ring-1 ring-inset ring-neon-dark/60 shadow-soft">
              <div className="flex items-center gap-2 text-neon-ash">
                <Building2 className="h-4 w-4 text-neon-green" />
                <label className="text-xs font-semibold uppercase tracking-[0.16em]">
                  Your society
                </label>
              </div>
              <div className="relative mt-3">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neon-green" />
                <select
                  value={society}
                  onChange={(e) => setSociety(e.target.value)}
                  className="w-full h-12 pl-10 pr-4 rounded-xl bg-neon-cherry text-neon-ink text-base font-semibold ring-1 ring-inset ring-neon-smoke appearance-none cursor-pointer hover:bg-neon-dark/30 transition-colors"
                >
                  {societies.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mt-4 rounded-xl bg-neon-spring/5 ring-1 ring-neon-spring/20 p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neon-ash">Active campaigns</span>
                  <span className="font-bold text-neon-green">{openCampaigns.length}</span>
                </div>
                <div className="mt-1.5 flex items-center justify-between text-xs">
                  <span className="text-neon-ash">Total participants</span>
                  <span className="font-bold text-neon-ink">
                    {openCampaigns.reduce((s, c) => s + c.participant_count, 0)}
                  </span>
                </div>
              </div>
              {basketCount > 0 && (
                <button
                  onClick={() => setPage('basket')}
                  className="mt-4 flex w-full items-center justify-between rounded-xl bg-neon-dark/40 px-4 py-3 text-sm font-medium text-neon-ash hover:bg-neon-dark/60 transition-all"
                >
                  <span className="inline-flex items-center gap-2">
                    <ShoppingBasket className="h-4 w-4" /> {basketCount} item{basketCount > 1 ? 's' : ''} in basket
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ===== OPEN GROUP BUYS — live campaign cards ===== */}
      <section className="mt-10">
        <div className="flex items-end justify-between mb-5">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-neon-green">
              Open group buys in {society}
            </div>
            <h2 className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-neon-ink">
              Active campaigns
            </h2>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="md" onClick={() => setPage('groupbuys')}>
              View all <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {campaignsLoading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="p-5 animate-pulseSoft">
                <div className="h-32 rounded-xl bg-neon-dark/40 mb-3" />
                <div className="h-4 rounded bg-neon-dark/40 mb-2" />
                <div className="h-3 rounded bg-neon-dark/30 w-2/3" />
                <div className="mt-4 h-3 rounded-full bg-neon-dark/40" />
              </Card>
            ))}
          </div>
        )}

        {!campaignsLoading && openCampaigns.length === 0 && (
          <Card className="p-8 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-neon-green/15 text-neon-green ring-1 ring-neon-green/30">
              <Users className="h-7 w-7" />
            </span>
            <h3 className="mt-4 font-display font-semibold text-neon-ink">No active campaigns yet</h3>
            <p className="mt-1 text-sm text-neon-ash max-w-md mx-auto">
              Be the first in your society to start a group buy. Pick a product, set a target
              quantity and deadline, and neighbours can join at their convenience.
            </p>
            <Button variant="primary" className="mt-5" onClick={() => setPage('createcampaign')}>
              <Plus className="h-4 w-4" /> Start a campaign
            </Button>
          </Card>
        )}

        {!campaignsLoading && openCampaigns.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {openCampaigns.slice(0, 6).map((c) => (
              <HomeCampaignCard key={c.id} campaign={c} onClick={() => onSelectCampaign(c.id)} />
            ))}
          </div>
        )}
      </section>

      {/* ===== HOW GROUP BUYING WORKS ===== */}
      <section className="mt-12">
        <div className="rounded-[1.75rem] bg-neon-dark/30 ring-1 ring-neon-green/30 p-6 sm:p-8 lg:p-10 relative overflow-hidden">
          <div className="absolute -top-16 -right-10 h-48 w-48 rounded-full bg-neon-spring/6 blur-3xl pointer-events-none" />
          <div className="relative">
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-neon-green">
              How group buying works
            </div>
            <h2 className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-neon-ink">
              Four simple steps to bulk savings
            </h2>
            <p className="mt-2 text-sm text-neon-ash max-w-2xl">
              No need for everyone to order at the same time. Each resident commits independently —
              demand accumulates until the deadline.
            </p>

            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <StepCard
                num={1}
                icon={<Search className="h-5 w-5" />}
                title="Choose a campaign"
                body="Browse open group buys in your society and pick one that matches what you need."
              />
              <StepCard
                num={2}
                icon={<PackageCheck className="h-5 w-5" />}
                title="Commit your quantity"
                body="Select how many units you want and confirm. Do this anytime before the deadline."
              />
              <StepCard
                num={3}
                icon={<Users className="h-5 w-5" />}
                title="Neighbourhood orders accumulate"
                body="Each resident's commitment adds to the total. Track progress in real time."
              />
              <StepCard
                num={4}
                icon={<TrendingDown className="h-5 w-5" />}
                title="Reach the threshold"
                body="If the supplier's minimum quantity is met, the confirmed bulk price applies to all participants."
              />
            </div>

            <div className="mt-6 rounded-xl bg-neon-spring/8 ring-1 ring-neon-spring/25 p-4 flex items-center gap-3">
              <Clock className="h-5 w-5 text-neon-green shrink-0" />
              <p className="text-sm text-neon-ink">
                <span className="font-bold text-neon-green">Key differentiator:</span> No need for
                everyone to order at the same time. Join whenever it's convenient — the campaign
                stays open until the deadline.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== QUICK ORDER — secondary, demoted ===== */}
      <section className="mt-10">
        <div className="rounded-2xl bg-neon-panel ring-1 ring-neon-dark/60 p-5 sm:p-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-neon-dark/40 text-neon-ash shrink-0">
                <ShoppingBasket className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-display font-semibold text-neon-ink">
                  Need groceries right now?
                </h3>
                <p className="mt-1 text-sm text-neon-ash max-w-lg leading-relaxed">
                  Order individually at current retailer prices — no waiting for a group, no minimum
                  quantity. This is a standalone purchase, not a bulk-price guarantee.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage('catalogue')}
                className="text-sm font-medium text-neon-ash hover:text-neon-ink underline underline-offset-4 decoration-neon-smoke hover:decoration-neon-ash transition-colors"
              >
                Browse the catalogue
              </button>
              <Button variant="outline" size="sm" onClick={() => setPage('catalogue')}>
                <ShoppingBasket className="h-3.5 w-3.5" /> Quick Order
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SEARCH ===== */}
      <section className="mt-9">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neon-ash" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setPage('catalogue')}
            placeholder="Search for rice, atta, milk, oil…"
            className="w-full h-14 pl-12 pr-4 rounded-2xl bg-neon-panel ring-1 ring-inset ring-neon-smoke shadow-soft text-base text-neon-ink placeholder:text-neon-ash focus:outline-none focus:ring-2 focus:ring-neon-spring/50 transition-all"
          />
        </div>
      </section>

      {/* ===== CATEGORIES ===== */}
      <section className="mt-8">
        <div className="flex items-end justify-between mb-4">
          <h2 className="font-display text-xl font-semibold tracking-tight text-neon-ink">
            Shop by category
          </h2>
          <button
            onClick={() => setPage('catalogue')}
            className="text-sm font-semibold text-neon-green hover:text-neon-greenDim inline-flex items-center gap-1"
          >
            View all <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {CATEGORIES.map((c) => {
            const Icon = ICON_MAP[c.icon] ?? Search;
            return (
              <button
                key={c.id}
                onClick={() => onPickCategory(c.id)}
                className="group flex flex-col items-center gap-2.5 rounded-2xl bg-neon-panel p-4 ring-1 ring-neon-dark/60 shadow-soft hover:shadow-glowSoft hover:-translate-y-0.5 hover:ring-neon-spring/40 transition-all"
              >
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-neon-dark/40 text-neon-green group-hover:bg-neon-dark/60 group-hover:shadow-glowSoft transition-all">
                  <Icon className="h-6 w-6" />
                </span>
                <span className="text-xs font-semibold text-neon-ink text-center leading-tight">
                  {c.label}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ===== SOCIETY DASHBOARD ===== */}
      <section className="mt-10">
        <div className="flex items-end justify-between mb-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-neon-green">
              Our society saves together
            </div>
            <h2 className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-neon-ink">
              The community dashboard
            </h2>
          </div>
          <Badge tone="muted">Demo data</Badge>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DashStat
            icon={<Users className="h-5 w-5" />}
            label="Participating families"
            value={`${demoFamilies}`}
            sub="in your society"
            tone="spring"
          />
          <DashStat
            icon={<ShoppingBasket className="h-5 w-5" />}
            label="Combined basket value"
            value={`₹${(combinedBasketValue * demoFamilies).toFixed(0)}`}
            sub={`${basketCount} item${basketCount === 1 ? '' : 's'} × ${demoFamilies} families`}
            tone="panel"
          />
          <DashStat
            icon={<TrendingDown className="h-5 w-5" />}
            label="Potential savings"
            value={`₹${societySavings.toFixed(0)}`}
            sub={`₹${potentialSavings.toFixed(0)} per basket vs priciest`}
            tone="green"
          />
          <DashStat
            icon={<PiggyBank className="h-5 w-5" />}
            label="Per-family saving"
            value={`₹${potentialSavings.toFixed(0)}`}
            sub="on the same basket"
            tone="spring"
          />
        </div>
        {basketCount === 0 && (
          <p className="mt-3 text-xs text-neon-ash">
            Add products to the basket to see live dashboard figures update. Numbers shown assume
            every participating family buys the same basket.
          </p>
        )}
      </section>

      {/* ===== LIVE EXTRACTION CTA ===== */}
      <section className="mt-10">
        <div className="relative overflow-hidden rounded-2xl bg-neon-panel ring-1 ring-neon-dark p-6 sm:p-8 fresh-glow-bg">
          <div className="absolute -top-10 -left-10 h-40 w-40 rounded-full bg-neon-spring/8 blur-3xl pointer-events-none" />
          <div className="relative flex flex-wrap items-center gap-4">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-neon-dark/40 text-neon-green shadow-glowSoft">
              <Fish className="h-6 w-6" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-display text-lg font-semibold text-neon-ink">Live price extraction</h3>
                <Badge tone="spring">TinyFish</Badge>
              </div>
              <p className="mt-1 text-sm text-neon-ash">
                Fetch real supplier prices from any retailer URL. Compare across all stores with verified live data.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="soft" size="md" onClick={() => setPage('tinyfish')}>
                <Zap className="h-4 w-4" /> Try it
              </Button>
              <Button variant="outline" size="md" onClick={() => setPage('multicompare')}>
                Multi-retailer <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-10 flex items-center justify-center gap-2 text-xs text-neon-ash">
        <LogoMark size={18} />
        <span>All prices shown are demo sample data · TinyFish live-price integration is in demo mode</span>
      </div>
    </div>
  );
}

// --- HomeCampaignCard: compact campaign card for the homepage ---
function HomeCampaignCard({
  campaign,
  onClick,
}: {
  campaign: CampaignWithCommitments;
  onClick: () => void;
}) {
  const canJoin =
    campaign.derivedStatus === 'open' ||
    campaign.derivedStatus === 'closing_soon' ||
    campaign.derivedStatus === 'target_reached';
  const hasSavings = campaign.perUnitSavings > 0;

  return (
    <Card className="overflow-hidden cursor-pointer hover:shadow-glowSoft hover:ring-neon-spring/30 transition-all">
      <div className="relative aspect-[16/9] overflow-hidden bg-neon-cherry" onClick={onClick}>
        <SmartImage
          src={campaign.product_image}
          alt={campaign.product_name}
          fallbackLabel={campaign.product_name}
          className="h-full w-full object-cover"
        />
        <div className="absolute left-2 top-2">{statusBadge(campaign.derivedStatus)}</div>
        {campaign.myCommitment && (
          <div className="absolute right-2 top-2">
            <Badge tone="emerald">JOINED · {campaign.myCommitment.qty}</Badge>
          </div>
        )}
      </div>
      <div className="p-4" onClick={onClick}>
        <h3 className="font-bold text-neon-ink text-sm leading-snug">{campaign.product_name}</h3>
        <p className="text-xs text-neon-ash mt-0.5">{campaign.product_pack_size}</p>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-display text-lg font-bold text-neon-green">
            ₹{+campaign.bulk_price}
          </span>
          <span className="text-xs text-neon-ash line-through">₹{+campaign.individual_price}</span>
          {campaign.bulk_price_confirmed ? (
            <Badge tone="emerald">VERIFIED</Badge>
          ) : (
            <Badge tone="muted">ESTIMATE</Badge>
          )}
        </div>

        {!hasSavings && (
          <p className="mt-1.5 text-[11px] text-neon-ash italic">
            Bulk price not yet confirmed below individual price.
          </p>
        )}

        {/* Progress bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-neon-ash mb-1">
            <span className="inline-flex items-center gap-1">
              <Package className="h-3 w-3" /> {campaign.total_committed} / {campaign.min_qty} units
            </span>
            <span>{Math.round(campaign.progressPct)}%</span>
          </div>
          <div className="h-2 rounded-full bg-neon-dark/60 overflow-hidden">
            <div
              className="h-full rounded-full bg-neon-spring transition-all duration-500"
              style={{
                width: `${campaign.progressPct}%`,
                boxShadow: '0 0 8px rgba(0,255,65,0.4)',
              }}
            />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-neon-ash">
          <span className="inline-flex items-center gap-1">
            <Users className="h-3 w-3" /> {campaign.participant_count} joined
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" /> {formatRemaining(campaign.remainingMs)}
          </span>
        </div>

        <div className="mt-3 pt-3 border-t border-neon-dark/60 flex items-center justify-between">
          <span className="text-[11px] text-neon-ash">{formatDeadline(campaign.deadline)}</span>
          {canJoin ? (
            <Button size="sm" variant={campaign.myCommitment ? 'outline' : 'primary'} onClick={onClick}>
              {campaign.myCommitment ? 'Manage' : 'Join Group'} <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={onClick}>
              View details <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

// --- StepCard for "How it works" ---
function StepCard({
  num,
  icon,
  title,
  body,
}: {
  num: number;
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="relative rounded-2xl bg-neon-panel p-5 ring-1 ring-neon-dark/60 shadow-soft">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-neon-green/20 text-neon-green ring-1 ring-neon-green/40 text-sm font-bold">
          {num}
        </span>
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-neon-dark/40 text-neon-green">
          {icon}
        </span>
      </div>
      <h4 className="mt-3 font-display font-semibold text-neon-ink text-sm">{title}</h4>
      <p className="mt-1.5 text-xs text-neon-ash leading-relaxed">{body}</p>
    </div>
  );
}

function DashStat({
  icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  tone: 'spring' | 'panel' | 'green';
}) {
  const toneStyles: Record<string, string> = {
    spring: 'bg-neon-spring/10 text-neon-green ring-neon-spring/30',
    panel: 'bg-neon-dark/40 text-neon-ink ring-neon-smoke',
    green: 'bg-neon-green/15 text-neon-greenDim ring-neon-green/40',
  };
  return (
    <div className="rounded-2xl bg-neon-panel p-5 ring-1 ring-neon-dark/60 shadow-soft hover:shadow-glowSoft transition-all">
      <span
        className={`grid h-10 w-10 place-items-center rounded-xl ring-1 ring-inset ${toneStyles[tone]}`}
      >
        {icon}
      </span>
      <div className="mt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-neon-ash">
        {label}
      </div>
      <div className="mt-1 font-display text-2xl font-semibold tracking-tight text-neon-ink">
        {value}
      </div>
      <div className="mt-0.5 text-xs text-neon-ash">{sub}</div>
    </div>
  );
}
