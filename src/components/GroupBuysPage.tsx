import { useEffect, useState } from 'react';
import { Users, Clock, TrendingDown, Plus, ArrowRight, Package, RefreshCw } from 'lucide-react';
import {
  fetchCampaigns,
  formatRemaining,
  formatDeadline,
  type CampaignWithCommitments,
} from '@/lib/groupBuy';
import { Badge, Button, Card, SectionTitle } from './ui';
import { SmartImage } from './SmartImage';
import type { PageId } from './Header';

export function GroupBuysPage({
  society,
  residentName,
  setPage,
  onSelectCampaign,
}: {
  society: string;
  residentName: string;
  setPage: (p: PageId) => void;
  onSelectCampaign: (id: string) => void;
}) {
  const [campaigns, setCampaigns] = useState<CampaignWithCommitments[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCampaigns(society, residentName);
      setCampaigns(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [society]);

  const openCampaigns = campaigns.filter(
    (c) => c.derivedStatus === 'open' || c.derivedStatus === 'closing_soon' || c.derivedStatus === 'target_reached'
  );
  const closedCampaigns = campaigns.filter(
    (c) => c.derivedStatus === 'closed' || c.derivedStatus === 'cancelled'
  );

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <SectionTitle
          eyebrow="Group savings"
          title="Group buy campaigns"
          subtitle="Join neighbours to combine demand and unlock supplier-approved bulk pricing. Commit at any time before the deadline."
        />
        <div className="flex gap-2">
          <Button variant="outline" size="md" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button variant="primary" size="md" onClick={() => setPage('createcampaign')}>
            <Plus className="h-4 w-4" /> Start campaign
          </Button>
        </div>
      </div>

      {loading && (
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

      {error && (
        <Card className="p-6 ring-2 ring-red-300">
          <p className="text-sm text-red-600">{error}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={load}>Try again</Button>
        </Card>
      )}

      {!loading && !error && campaigns.length === 0 && (
        <Card className="p-10 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-neon-dark/40 text-neon-green shadow-glowSoft">
            <Users className="h-7 w-7" />
          </span>
          <h3 className="mt-4 font-display font-semibold text-neon-ink">No campaigns yet</h3>
          <p className="mt-1 text-sm text-neon-ash max-w-md mx-auto">
            Start the first group buy for your society. Pick a product, set a target quantity and
            deadline, and neighbours can join at their convenience.
          </p>
          <Button variant="primary" className="mt-5" onClick={() => setPage('createcampaign')}>
            <Plus className="h-4 w-4" /> Start a campaign
          </Button>
        </Card>
      )}

      {!loading && !error && openCampaigns.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {openCampaigns.map((c) => (
            <CampaignCard key={c.id} campaign={c} onClick={() => onSelectCampaign(c.id)} />
          ))}
        </div>
      )}

      {!loading && !error && closedCampaigns.length > 0 && (
        <div className="mt-8">
          <h3 className="font-display text-lg font-semibold text-neon-ink mb-3">Completed campaigns</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {closedCampaigns.map((c) => (
              <CampaignCard key={c.id} campaign={c} onClick={() => onSelectCampaign(c.id)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

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

function CampaignCard({
  campaign,
  onClick,
}: {
  campaign: CampaignWithCommitments;
  onClick: () => void;
}) {
  const canJoin = campaign.derivedStatus === 'open' || campaign.derivedStatus === 'closing_soon' || campaign.derivedStatus === 'target_reached';
  return (
    <Card
      className="overflow-hidden cursor-pointer hover:shadow-glowSoft hover:ring-neon-spring/30 transition-all"
      // onClick handled by button inside
    >
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
              {campaign.myCommitment ? 'Manage' : 'Join'} <ArrowRight className="h-3.5 w-3.5" />
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
