import { useEffect, useState } from 'react';
import {
  Users,
  Clock,
  TrendingDown,
  ArrowLeft,
  Minus,
  Plus,
  Check,
  AlertTriangle,
  Package,
  Info,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import {
  fetchCampaign,
  joinCampaign,
  updateCommitment,
  withdrawCommitment,
  formatRemaining,
  formatDeadline,
  deriveStatus,
  type CampaignWithCommitments,
} from '@/lib/groupBuy';
import { Badge, Button, Card, SectionTitle } from './ui';
import { SmartImage } from './SmartImage';

export function CampaignDetailPage({
  campaignId,
  residentName,
  onBack,
}: {
  campaignId: string;
  residentName: string;
  onBack: () => void;
}) {
  const [campaign, setCampaign] = useState<CampaignWithCommitments | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCampaign(campaignId, residentName);
      setCampaign(data);
      if (data?.myCommitment) setQty(data.myCommitment.qty);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load campaign');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId, residentName]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6">
        <Card className="p-8 animate-pulseSoft">
          <div className="h-48 rounded-xl bg-neon-dark/40 mb-4" />
          <div className="h-6 rounded bg-neon-dark/40 mb-2" />
          <div className="h-4 rounded bg-neon-dark/30 w-2/3" />
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6">
        <Button variant="ghost" size="sm" onClick={onBack} className="mb-4">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Card className="p-6 ring-2 ring-red-300">
          <p className="text-sm text-red-600">{error}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={load}>Try again</Button>
        </Card>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6">
        <Button variant="ghost" size="sm" onClick={onBack} className="mb-4">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Card className="p-8 text-center">
          <p className="text-neon-ash">Campaign not found.</p>
        </Card>
      </div>
    );
  }

  const canJoin =
    (campaign.derivedStatus === 'open' ||
    campaign.derivedStatus === 'closing_soon' ||
    campaign.derivedStatus === 'target_reached') && residentName.trim() !== '';
  const hasCommitment = !!campaign.myCommitment;
  const targetReached = campaign.total_committed >= campaign.min_qty;
  const deadlinePassed = campaign.derivedStatus === 'closed';
  const nameMissing = residentName.trim() === '';

  const handleJoin = async () => {
    setActionLoading(true);
    setActionMsg(null);
    try {
      await joinCampaign(campaign.id, residentName, qty);
      setActionMsg(`Committed ${qty} unit${qty > 1 ? 's' : ''} to this campaign.`);
      setShowConfirm(false);
      await load();
    } catch (e) {
      setActionMsg(e instanceof Error ? e.message : 'Failed to join');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!hasCommitment) return;
    setActionLoading(true);
    setActionMsg(null);
    try {
      await updateCommitment(campaign.id, residentName, qty);
      setActionMsg(`Updated commitment to ${qty} unit${qty > 1 ? 's' : ''}.`);
      await load();
    } catch (e) {
      setActionMsg(e instanceof Error ? e.message : 'Failed to update');
    } finally {
      setActionLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!hasCommitment) return;
    setActionLoading(true);
    setActionMsg(null);
    try {
      await withdrawCommitment(campaign.id, residentName);
      setActionMsg('Withdrawn from campaign.');
      await load();
    } catch (e) {
      setActionMsg(e instanceof Error ? e.message : 'Failed to withdraw');
    } finally {
      setActionLoading(false);
    }
  };

  const mySavings = campaign.perUnitSavings * qty;

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6">
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to campaigns
      </Button>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: product + campaign info */}
        <div>
          <Card className="overflow-hidden">
            <div className="relative aspect-[16/10] overflow-hidden bg-neon-cherry">
              <SmartImage
                src={campaign.product_image}
                alt={campaign.product_name}
                fallbackLabel={campaign.product_name}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="p-5">
              <div className="flex items-center gap-2 mb-2">
                {campaign.derivedStatus === 'open' && <Badge tone="spring">OPEN</Badge>}
                {campaign.derivedStatus === 'closing_soon' && <Badge tone="green">CLOSING SOON</Badge>}
                {campaign.derivedStatus === 'target_reached' && <Badge tone="emerald">TARGET REACHED</Badge>}
                {campaign.derivedStatus === 'closed' && <Badge tone="muted">CLOSED</Badge>}
                {campaign.derivedStatus === 'cancelled' && <Badge tone="red">CANCELLED</Badge>}
                {campaign.bulk_price_confirmed ? (
                  <Badge tone="emerald">VERIFIED BULK PRICE</Badge>
                ) : (
                  <Badge tone="muted">ESTIMATED TARGET</Badge>
                )}
              </div>
              <h2 className="font-display text-xl font-semibold text-neon-ink">{campaign.product_name}</h2>
              <p className="text-sm text-neon-ash">{campaign.product_pack_size}</p>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <PriceBox label="Individual price" value={`₹${+campaign.individual_price}`} sub="per unit" />
                <PriceBox
                  label="Bulk price"
                  value={`₹${+campaign.bulk_price}`}
                  sub={campaign.bulk_price_confirmed ? 'supplier-confirmed' : 'estimated target'}
                  highlight
                />
              </div>

              <div className="mt-4 rounded-xl bg-neon-dark/30 ring-1 ring-neon-dark/60 p-3 text-xs text-neon-ink inline-flex items-start gap-2">
                <Info className="h-4 w-4 shrink-0 mt-0.5 text-neon-green" />
                <span>
                  {campaign.bulk_price_confirmed
                    ? 'The bulk price is supplier-confirmed. It applies only if the minimum quantity is reached before the deadline.'
                    : 'The bulk price is an estimated target, not yet confirmed by the supplier. Final pricing will be confirmed when the campaign closes.'}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right: progress + join */}
        <div className="space-y-4">
          {/* Progress */}
          <Card className="p-5">
            <h3 className="font-display font-semibold text-neon-ink mb-3">Campaign progress</h3>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-neon-ash inline-flex items-center gap-1">
                <Package className="h-4 w-4" /> {campaign.total_committed} committed
              </span>
              <span className="text-neon-ash">Target: {campaign.min_qty}</span>
            </div>
            <div className="h-3 rounded-full bg-neon-dark/60 overflow-hidden">
              <div
                className="h-full rounded-full bg-neon-spring transition-all duration-500"
                style={{ width: `${campaign.progressPct}%`, boxShadow: '0 0 10px rgba(0,255,65,0.4)' }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-neon-ash">
              <span className="inline-flex items-center gap-1">
                <Users className="h-3 w-3" /> {campaign.participant_count} participants
              </span>
              <span>{Math.round(campaign.progressPct)}% of target</span>
            </div>

            <div className="mt-4 space-y-2 text-sm">
              <Row label="Deadline" value={formatDeadline(campaign.deadline)} />
              <Row label="Time remaining" value={formatRemaining(campaign.remainingMs)} />
              <Row label="Per-unit saving" value={<span className="text-neon-green font-bold">₹{campaign.perUnitSavings}</span>} />
              <Row label="Est. total savings" value={<span className="text-neon-green font-bold">₹{campaign.estTotalSavings}</span>} />
            </div>

            {targetReached && !deadlinePassed && (
              <div className="mt-4 rounded-xl bg-neon-spring/10 ring-1 ring-neon-spring/30 p-3 flex items-center gap-2">
                <Check className="h-4 w-4 text-neon-green" />
                <p className="text-xs text-neon-ink">Target reached! The bulk price is locked in for all participants.</p>
              </div>
            )}
          </Card>

          {/* Join / manage */}
          <Card className="p-5">
            <h3 className="font-display font-semibold text-neon-ink mb-3">
              {hasCommitment ? 'Your commitment' : 'Join this campaign'}
            </h3>

            {hasCommitment && (
              <div className="mb-4 rounded-xl bg-neon-spring/5 ring-1 ring-neon-spring/20 p-3">
                <p className="text-sm text-neon-ink">
                  You committed <span className="font-bold text-neon-green">{campaign.myCommitment!.qty}</span> unit(s).
                </p>
                <p className="text-xs text-neon-ash mt-1">
                  Your estimated saving: <span className="text-neon-green font-bold">₹{mySavings}</span>
                </p>
              </div>
            )}

            {nameMissing && !deadlinePassed && (
              <div className="mb-4 rounded-xl bg-amber-50 ring-1 ring-amber-200 p-3 text-xs text-amber-400 inline-flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Enter your name in the top bar to join or manage a campaign.
              </div>
            )}

            {canJoin ? (
              <>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neon-ash mb-2">
                  Quantity (units)
                </label>
                <div className="flex items-center gap-3">
                  <div className="inline-flex items-center rounded-xl bg-neon-dark/60 ring-1 ring-neon-smoke">
                    <button
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      className="grid h-11 w-11 place-items-center rounded-l-xl hover:bg-neon-dark/80 text-neon-ink"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="min-w-[3rem] text-center text-lg font-bold text-neon-ink">{qty}</span>
                    <button
                      onClick={() => setQty((q) => q + 1)}
                      className="grid h-11 w-11 place-items-center rounded-r-xl hover:bg-neon-dark/80 text-neon-ink"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="text-sm text-neon-ash">
                    <div>Cost: <span className="font-bold text-neon-ink">₹{(+campaign.bulk_price * qty).toFixed(0)}</span></div>
                    <div>Save: <span className="text-neon-green font-bold">₹{(campaign.perUnitSavings * qty).toFixed(0)}</span></div>
                  </div>
                </div>

                {showConfirm && !hasCommitment ? (
                  <div className="mt-4 rounded-xl bg-neon-dark/40 ring-1 ring-neon-spring/30 p-4">
                    <p className="text-sm text-neon-ink mb-3">
                      Confirm: commit <span className="font-bold text-neon-green">{qty}</span> unit(s) of{' '}
                      <span className="font-bold">{campaign.product_name}</span> at{' '}
                      <span className="font-bold text-neon-green">₹{+campaign.bulk_price}</span>/unit.
                      You can edit or withdraw before the deadline.
                    </p>
                    <div className="flex gap-2">
                      <Button variant="primary" size="sm" onClick={handleJoin} disabled={actionLoading}>
                        {actionLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        Confirm
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setShowConfirm(false)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {!hasCommitment ? (
                      <Button variant="primary" onClick={() => setShowConfirm(true)} disabled={actionLoading}>
                        <Check className="h-4 w-4" /> Join campaign
                      </Button>
                    ) : (
                      <>
                        <Button variant="primary" onClick={handleUpdate} disabled={actionLoading}>
                          {actionLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                          Update quantity
                        </Button>
                        <Button variant="outline" onClick={handleWithdraw} disabled={actionLoading}>
                          <Trash2 className="h-4 w-4" /> Withdraw
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </>
            ) : deadlinePassed ? (
              <div className="rounded-xl bg-neon-dark/30 ring-1 ring-neon-smoke p-4">
                <p className="text-sm text-neon-ash inline-flex items-center gap-2">
                  <Clock className="h-4 w-4" /> This campaign has closed. New commitments are no longer accepted.
                </p>
                {targetReached ? (
                  <p className="mt-2 text-sm text-neon-green inline-flex items-center gap-1.5">
                    <Check className="h-4 w-4" /> Target was reached — bulk price confirmed for participants.
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-neon-ash inline-flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4" /> Target was not reached. Participants can purchase individually instead.
                  </p>
                )}
              </div>
            ) : (
              <div className="rounded-xl bg-neon-dark/30 ring-1 ring-neon-smoke p-4">
                <p className="text-sm text-neon-ash">This campaign is no longer accepting commitments.</p>
              </div>
            )}

            {actionMsg && (
              <div className="mt-3 text-xs text-neon-green bg-neon-spring/5 rounded-lg px-3 py-2">
                {actionMsg}
              </div>
            )}
          </Card>

          {/* Rules */}
          <Card className="p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neon-green mb-2">Campaign rules</h4>
            <ul className="space-y-1.5 text-xs text-neon-ash">
              <li>· You can edit or withdraw your commitment anytime before the deadline.</li>
              <li>· The bulk price applies only if the minimum quantity is reached.</li>
              <li>· If the target is missed, you can still buy at the individual price.</li>
              <li>· No payment is charged until the campaign closes successfully.</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

function PriceBox({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub: string;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-xl p-3 ring-1 ${highlight ? 'bg-neon-spring/5 ring-neon-spring/30' : 'bg-neon-dark/30 ring-neon-smoke'}`}>
      <div className="text-[10px] uppercase tracking-wider text-neon-ash">{label}</div>
      <div className={`mt-0.5 font-display text-xl font-bold ${highlight ? 'text-neon-green' : 'text-neon-ink'}`}>
        {value}
      </div>
      <div className="text-[10px] text-neon-ash">{sub}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-neon-ash">{label}</span>
      <span className="font-semibold text-neon-ink">{value}</span>
    </div>
  );
}
