import { supabase } from './supabase';
import { PRODUCTS, effectivePrice, type RetailerId, type CategoryId } from '@/data/catalog';

// --- Types -------------------------------------------------------------

export type CampaignStatus = 'open' | 'target_reached' | 'closing_soon' | 'closed' | 'cancelled';

export interface CampaignRow {
  id: string;
  product_id: string;
  product_name: string;
  product_image: string;
  product_pack_size: string;
  product_category: string;
  society: string;
  retailer_id: string;
  individual_price: number;
  bulk_price: number;
  bulk_price_confirmed: boolean;
  min_qty: number;
  total_committed: number;
  participant_count: number;
  status: string;
  deadline: string;
  creator_name: string;
  created_at: string;
  updated_at: string;
}

export interface CommitmentRow {
  id: string;
  campaign_id: string;
  resident_name: string;
  qty: number;
  created_at: string;
  updated_at: string;
}

export interface CampaignWithCommitments extends CampaignRow {
  commitments: CommitmentRow[];
  derivedStatus: CampaignStatus;
  remainingMs: number;
  progressPct: number;
  perUnitSavings: number;
  estTotalSavings: number;
  myCommitment: CommitmentRow | null;
}

// --- Status derivation -------------------------------------------------

const CLOSING_SOON_MS = 24 * 60 * 60 * 1000; // 24h

export function deriveStatus(
  row: CampaignRow,
  now: number = Date.now()
): { status: CampaignStatus; remainingMs: number } {
  if (row.status === 'cancelled') {
    return { status: 'cancelled', remainingMs: 0 };
  }
  const deadlineMs = new Date(row.deadline).getTime();
  const remainingMs = deadlineMs - now;

  if (remainingMs <= 0) {
    return { status: 'closed', remainingMs: 0 };
  }
  if (row.total_committed >= row.min_qty) {
    return { status: 'target_reached', remainingMs };
  }
  if (remainingMs <= CLOSING_SOON_MS) {
    return { status: 'closing_soon', remainingMs };
  }
  return { status: 'open', remainingMs };
}

export function formatRemaining(ms: number): string {
  if (ms <= 0) return 'Closed';
  const totalMin = Math.floor(ms / 60000);
  const days = Math.floor(totalMin / (60 * 24));
  const hours = Math.floor((totalMin % (60 * 24)) / 60);
  const mins = totalMin % 60;
  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${mins}m left`;
  return `${mins}m left`;
}

export function formatDeadline(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// --- Enrichment --------------------------------------------------------

function enrich(
  row: CampaignRow,
  commitments: CommitmentRow[],
  residentName: string
): CampaignWithCommitments {
  const { status, remainingMs } = deriveStatus(row);
  const progressPct = row.min_qty > 0 ? Math.min(100, (row.total_committed / row.min_qty) * 100) : 0;
  const perUnitSavings = Math.max(0, +row.individual_price - +row.bulk_price);
  const estTotalSavings = +(perUnitSavings * row.total_committed).toFixed(2);
  const myCommitment = commitments.find((c) => c.resident_name === residentName) ?? null;
  return {
    ...row,
    individual_price: +row.individual_price,
    bulk_price: +row.bulk_price,
    commitments,
    derivedStatus: status,
    remainingMs,
    progressPct,
    perUnitSavings,
    estTotalSavings,
    myCommitment,
  };
}

// --- Queries -----------------------------------------------------------

export async function fetchCampaigns(
  society: string,
  residentName: string
): Promise<CampaignWithCommitments[]> {
  const { data: campaigns, error } = await supabase
    .from('group_campaigns')
    .select('*')
    .eq('society', society)
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!campaigns || campaigns.length === 0) return [];

  const ids = campaigns.map((c) => c.id);
  const { data: commitments, error: cErr } = await supabase
    .from('campaign_commitments')
    .select('*')
    .in('campaign_id', ids);

  if (cErr) throw cErr;

  const byCampaign = new Map<string, CommitmentRow[]>();
  for (const c of commitments ?? []) {
    const arr = byCampaign.get(c.campaign_id) ?? [];
    arr.push(c as CommitmentRow);
    byCampaign.set(c.campaign_id, arr);
  }

  return campaigns.map((row) =>
    enrich(row as CampaignRow, byCampaign.get(row.id) ?? [], residentName)
  );
}

export async function fetchCampaign(
  id: string,
  residentName: string
): Promise<CampaignWithCommitments | null> {
  const { data: row, error } = await supabase
    .from('group_campaigns')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (!row) return null;

  const { data: commitments, error: cErr } = await supabase
    .from('campaign_commitments')
    .select('*')
    .eq('campaign_id', id);

  if (cErr) throw cErr;

  return enrich(row as CampaignRow, (commitments ?? []) as CommitmentRow[], residentName);
}

export async function fetchMyCommitments(
  residentName: string,
  society: string
): Promise<{ campaign: CampaignWithCommitments; commitment: CommitmentRow }[]> {
  const { data: campaigns, error } = await supabase
    .from('group_campaigns')
    .select('*')
    .eq('society', society);

  if (error) throw error;
  if (!campaigns || campaigns.length === 0) return [];

  const ids = campaigns.map((c) => c.id);
  const { data: commitments, error: cErr } = await supabase
    .from('campaign_commitments')
    .select('*')
    .in('campaign_id', ids)
    .eq('resident_name', residentName);

  if (cErr) throw cErr;
  if (!commitments || commitments.length === 0) return [];

  const byId = new Map(campaigns.map((c) => [c.id, c as CampaignRow]));
  // Fetch all commitments for all relevant campaigns in one query
  const { data: allCommits, error: acErr } = await supabase
    .from('campaign_commitments')
    .select('*')
    .in('campaign_id', ids);
  if (acErr) throw acErr;
  const commitsByCampaign = new Map<string, CommitmentRow[]>();
  for (const c of (allCommits ?? []) as CommitmentRow[]) {
    const arr = commitsByCampaign.get(c.campaign_id) ?? [];
    arr.push(c);
    commitsByCampaign.set(c.campaign_id, arr);
  }
  const result: { campaign: CampaignWithCommitments; commitment: CommitmentRow }[] = [];
  for (const c of commitments as CommitmentRow[]) {
    const row = byId.get(c.campaign_id);
    if (!row) continue;
    result.push({
      campaign: enrich(row, commitsByCampaign.get(c.campaign_id) ?? [], residentName),
      commitment: c,
    });
  }
  return result;
}

// --- Mutations ---------------------------------------------------------

export interface CreateCampaignInput {
  productId: string;
  society: string;
  retailerId: RetailerId;
  bulkPrice: number;
  bulkPriceConfirmed: boolean;
  minQty: number;
  deadline: string; // ISO
  creatorName: string;
}

export async function findMatchingCampaign(
  productId: string,
  society: string
): Promise<CampaignRow | null> {
  // Only match campaigns that are not manually cancelled.
  // Status (open/closed) is derived from deadline at read time, so we fetch
  // all non-cancelled and filter by deadline client-side.
  const { data, error } = await supabase
    .from('group_campaigns')
    .select('*')
    .eq('product_id', productId)
    .eq('society', society)
    .neq('status', 'cancelled');
  if (error) throw error;
  if (!data || data.length === 0) return null;
  const now = Date.now();
  // Return the first campaign whose deadline hasn't passed
  const active = (data as CampaignRow[]).find(
    (c) => new Date(c.deadline).getTime() > now
  );
  return active ?? null;
}

export async function createCampaign(
  input: CreateCampaignInput
): Promise<CampaignRow> {
  const product = PRODUCTS.find((p) => p.id === input.productId);
  if (!product) throw new Error('Product not found');

  const pp = product.prices[input.retailerId];
  if (!pp || !pp.inStock) throw new Error('Product not available at selected retailer');

  const individualPrice = effectivePrice(pp);

  const { data, error } = await supabase
    .from('group_campaigns')
    .insert({
      product_id: input.productId,
      product_name: product.name,
      product_image: product.image,
      product_pack_size: product.packSize,
      product_category: product.category,
      society: input.society,
      retailer_id: input.retailerId,
      individual_price: individualPrice,
      bulk_price: input.bulkPrice,
      bulk_price_confirmed: input.bulkPriceConfirmed,
      min_qty: input.minQty,
      deadline: input.deadline,
      creator_name: input.creatorName,
    })
    .select('*')
    .single();

  if (error) throw error;
  return data as CampaignRow;
}

export async function joinCampaign(
  campaignId: string,
  residentName: string,
  qty: number
): Promise<void> {
  // Insert commitment (unique constraint prevents duplicates)
  const { error } = await supabase.from('campaign_commitments').insert({
    campaign_id: campaignId,
    resident_name: residentName,
    qty,
  });
  if (error) {
    // If duplicate, fall through to update
    if (error.code !== '23505') throw error;
    const { error: uErr } = await supabase
      .from('campaign_commitments')
      .update({ qty, updated_at: new Date().toISOString() })
      .eq('campaign_id', campaignId)
      .eq('resident_name', residentName);
    if (uErr) throw uErr;
  }
  await recomputeTotals(campaignId);
}

export async function updateCommitment(
  campaignId: string,
  residentName: string,
  qty: number
): Promise<void> {
  const { error } = await supabase
    .from('campaign_commitments')
    .update({ qty, updated_at: new Date().toISOString() })
    .eq('campaign_id', campaignId)
    .eq('resident_name', residentName);
  if (error) throw error;
  await recomputeTotals(campaignId);
}

export async function withdrawCommitment(
  campaignId: string,
  residentName: string
): Promise<void> {
  const { error } = await supabase
    .from('campaign_commitments')
    .delete()
    .eq('campaign_id', campaignId)
    .eq('resident_name', residentName);
  if (error) throw error;
  await recomputeTotals(campaignId);
}

async function recomputeTotals(campaignId: string): Promise<void> {
  const { data, error } = await supabase
    .from('campaign_commitments')
    .select('qty')
    .eq('campaign_id', campaignId);
  if (error) throw error;

  const total = (data ?? []).reduce((s, r) => s + r.qty, 0);
  const count = data?.length ?? 0;

  const { error: uErr } = await supabase
    .from('group_campaigns')
    .update({
      total_committed: total,
      participant_count: count,
      updated_at: new Date().toISOString(),
    })
    .eq('id', campaignId);
  if (uErr) throw uErr;
}

// --- Matching ----------------------------------------------------------

export function findMatchingCampaigns(
  productId: string,
  category: CategoryId | string,
  campaigns: CampaignWithCommitments[]
): CampaignWithCommitments[] {
  const product = PRODUCTS.find((p) => p.id === productId);
  if (!product) return [];
  return campaigns.filter((c) => {
    if (c.derivedStatus === 'closed' || c.derivedStatus === 'cancelled') return false;
    if (c.product_id === productId) return true;
    // Match by same category + same pack size
    return c.product_category === product.category && c.product_pack_size === product.packSize;
  });
}
