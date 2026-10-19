import { useEffect, useState } from 'react';
import { useMemo } from 'react';
import { Plus, AlertTriangle, ArrowLeft, Check, Info, Search } from 'lucide-react';
import {
  PRODUCTS,
  RETAILER_LIST,
  RETAILERS,
  effectivePrice,
  type RetailerId,
} from '@/data/catalog';
import {
  createCampaign,
  findMatchingCampaign,
  type CampaignRow,
} from '@/lib/groupBuy';
import { Badge, Button, Card, SectionTitle } from './ui';
import { SmartImage } from './SmartImage';

export function CreateCampaignPage({
  society,
  residentName,
  onBack,
  onCreated,
}: {
  society: string;
  residentName: string;
  onBack: () => void;
  onCreated: (campaignId: string) => void;
}) {
  const [productId, setProductId] = useState('');
  const [retailerId, setRetailerId] = useState<RetailerId>('megastore');
  const [bulkPrice, setBulkPrice] = useState('');
  const [bulkPriceConfirmed, setBulkPriceConfirmed] = useState(false);
  const [minQty, setMinQty] = useState('10');
  const [deadlineDays, setDeadlineDays] = useState('3');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matchWarn, setMatchWarn] = useState<CampaignRow | null>(null);

  const product = useMemo(() => PRODUCTS.find((p) => p.id === productId) ?? null, [productId]);

  // Check for matching campaigns when product is selected
  useEffect(() => {
    if (!productId) {
      setMatchWarn(null);
      return;
    }
    void (async () => {
      try {
        const match = await findMatchingCampaign(productId, society);
        setMatchWarn(match);
      } catch {
        setMatchWarn(null);
      }
    })();
  }, [productId, society]);

  // Auto-suggest bulk price = 90% of effective individual price
  useEffect(() => {
    if (product && !bulkPrice) {
      const pp = product.prices[retailerId];
      if (pp && pp.inStock) {
        const eff = effectivePrice(pp);
        setBulkPrice((eff * 0.9).toFixed(0));
      }
    }
  }, [product, retailerId, bulkPrice]);

  const handleCreate = async () => {
    setError(null);
    if (!residentName.trim()) {
      setError('Enter your name in the top bar first so neighbours know who started this campaign.');
      return;
    }
    if (!product) {
      setError('Select a product first.');
      return;
    }
    const minQtyNum = parseInt(minQty, 10);
    const bulkPriceNum = parseFloat(bulkPrice);
    const daysNum = parseFloat(deadlineDays);
    if (!minQtyNum || minQtyNum < 1) {
      setError('Minimum quantity must be at least 1.');
      return;
    }
    if (!bulkPriceNum || bulkPriceNum <= 0) {
      setError('Enter a valid bulk price.');
      return;
    }
    if (!daysNum || daysNum < 0.1) {
      setError('Deadline must be at least a few hours from now.');
      return;
    }

    const deadline = new Date(Date.now() + daysNum * 24 * 60 * 60 * 1000).toISOString();

    setCreating(true);
    try {
      const campaign = await createCampaign({
        productId: product.id,
        society,
        retailerId,
        bulkPrice: bulkPriceNum,
        bulkPriceConfirmed,
        minQty: minQtyNum,
        deadline,
        creatorName: residentName,
      });
      onCreated(campaign.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create campaign');
    } finally {
      setCreating(false);
    }
  };

  const availableRetailers = product
    ? RETAILER_LIST.filter((r) => product.prices[r.id]?.inStock)
    : RETAILER_LIST;

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6">
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-4">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>
      <SectionTitle
        eyebrow="Start a group buy"
        title="Create a campaign"
        subtitle="Pick a product and set a bulk-price target. Neighbours can join at any time before the deadline."
      />

      <Card className="p-5 space-y-5">
        {/* Product search */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-neon-ash mb-2">
            Product
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neon-ash" />
            <select
              value={productId}
              onChange={(e) => {
                setProductId(e.target.value);
                setBulkPrice('');
              }}
              className="w-full h-11 pl-9 pr-3 rounded-xl bg-neon-cherry ring-1 ring-inset ring-neon-smoke text-sm text-neon-ink focus:outline-none focus:ring-2 focus:ring-neon-spring/50 cursor-pointer"
            >
              <option value="">Select a product…</option>
              {PRODUCTS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · {p.packSize}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Matching campaign warning */}
        {matchWarn && (
          <div className="rounded-xl bg-neon-spring/5 ring-1 ring-neon-spring/30 p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-neon-green shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-neon-ink">
                A campaign already exists for <strong>{matchWarn.product_name}</strong> in your society.
              </p>
              <p className="text-xs text-neon-ash mt-1">
                Join the existing campaign instead of creating a duplicate.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => onCreated(matchWarn.id)}
              >
                View existing campaign
              </Button>
            </div>
          </div>
        )}

        {/* Product preview */}
        {product && (
          <div className="flex items-center gap-3 rounded-xl bg-neon-dark/30 ring-1 ring-neon-smoke p-3">
            <SmartImage
              src={product.image}
              alt={product.name}
              fallbackLabel={product.name}
              className="h-14 w-14 rounded-lg object-cover"
            />
            <div>
              <div className="font-bold text-neon-ink text-sm">{product.name}</div>
              <div className="text-xs text-neon-ash">{product.packSize}</div>
            </div>
          </div>
        )}

        {/* Retailer */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-neon-ash mb-2">
            Supplier
          </label>
          <div className="grid grid-cols-3 gap-2">
            {availableRetailers.map((r) => (
              <button
                key={r.id}
                onClick={() => {
                  setRetailerId(r.id);
                  setBulkPrice('');
                }}
                className={`rounded-xl p-3 text-left transition-all ${
                  retailerId === r.id
                    ? 'bg-neon-spring/10 ring-2 ring-neon-spring/40'
                    : 'bg-neon-dark/30 ring-1 ring-neon-smoke hover:bg-neon-dark/50'
                }`}
              >
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-neon-ink">
                  <span className="h-2 w-2 rounded-full" style={{ background: r.color }} />
                  {r.name}
                </span>
                {product?.prices[r.id] && (
                  <span className="block text-xs text-neon-ash mt-1">
                    ₹{effectivePrice(product.prices[r.id])} / unit
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Bulk price + confirmation */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neon-ash mb-2">
              Bulk price (per unit)
            </label>
            <input
              type="number"
              value={bulkPrice}
              onChange={(e) => setBulkPrice(e.target.value)}
              placeholder="e.g. 115"
              className="w-full h-11 rounded-xl bg-neon-cherry ring-1 ring-inset ring-neon-smoke px-3 text-sm text-neon-ink focus:outline-none focus:ring-2 focus:ring-neon-spring/50"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neon-ash mb-2">
              Min quantity (units)
            </label>
            <input
              type="number"
              value={minQty}
              onChange={(e) => setMinQty(e.target.value)}
              className="w-full h-11 rounded-xl bg-neon-cherry ring-1 ring-inset ring-neon-smoke px-3 text-sm text-neon-ink focus:outline-none focus:ring-2 focus:ring-neon-spring/50"
            />
          </div>
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={bulkPriceConfirmed}
            onChange={(e) => setBulkPriceConfirmed(e.target.checked)}
            className="h-4 w-4 rounded accent-neon-spring"
          />
          <span className="text-sm text-neon-ink">
            This bulk price is supplier-confirmed
            <span className="block text-xs text-neon-ash">Leave unchecked if this is an estimated target price.</span>
          </span>
        </label>

        {/* Deadline */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-neon-ash mb-2">
            Deadline (days from now)
          </label>
          <input
            type="number"
            value={deadlineDays}
            onChange={(e) => setDeadlineDays(e.target.value)}
            step="0.5"
            min="0.1"
            className="w-full h-11 rounded-xl bg-neon-cherry ring-1 ring-inset ring-neon-smoke px-3 text-sm text-neon-ink focus:outline-none focus:ring-2 focus:ring-neon-spring/50"
          />
          <p className="mt-1 text-xs text-neon-ash">
            Closes on {new Date(Date.now() + (parseFloat(deadlineDays) || 0) * 86400000).toLocaleString()}
          </p>
        </div>

        {/* Savings preview */}
        {product && bulkPrice && (
          <div className="rounded-xl bg-neon-spring/5 ring-1 ring-neon-spring/20 p-3 text-sm text-neon-ink">
            <Info className="h-4 w-4 inline text-neon-green mr-1" />
            Saving per unit: <span className="font-bold text-neon-green">
              ₹{Math.max(0, effectivePrice(product.prices[retailerId]) - parseFloat(bulkPrice)).toFixed(0)}
            </span>{' '}
            vs individual price (₹{effectivePrice(product.prices[retailerId])})
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-50 ring-1 ring-red-200 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <Button variant="primary" size="lg" className="w-full" onClick={handleCreate} disabled={creating || !!matchWarn || !residentName.trim()}>
          {creating ? 'Creating…' : (<><Plus className="h-4 w-4" /> Create campaign</>)}
        </Button>
        {matchWarn && (
          <p className="text-center text-xs text-neon-ash">
            Campaign creation is disabled because an active campaign exists for this product.
          </p>
        )}
      </Card>
    </div>
  );
}
