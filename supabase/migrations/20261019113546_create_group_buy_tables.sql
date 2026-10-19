/*
# Group Buy Campaigns and Commitments

## Purpose
Adds asynchronous group-buying functionality to SocietyBasket. Residents can
create campaigns for products, join them with a committed quantity, and the
system tracks progress toward a supplier-approved bulk-price threshold.

## Tables

### 1. group_campaigns
Stores group-buy campaign metadata for a specific product + society.
- id (uuid PK)
- product_id (text) — references the demo catalogue product id (not a FK since products are static)
- product_name (text) — denormalized for display
- product_image (text) — denormalized image URL
- product_pack_size (text) — e.g. "5 kg"
- product_category (text) — category id for matching
- society (text) — society name
- retailer_id (text) — which retailer the bulk price comes from
- individual_price (numeric) — verified current individual price for this product
- bulk_price (numeric) — supplier-approved or estimated target bulk price per unit
- bulk_price_confirmed (boolean default false) — whether bulk_price is supplier-verified or estimated
- min_qty (integer) — minimum total quantity for bulk price to apply
- total_committed (integer default 0) — running total of all committed quantities
- participant_count (integer default 0) — number of unique commitments
- status (text default 'open') — open, target_reached, closing_soon, closed, cancelled
- deadline (timestamptz) — campaign closing date/time
- creator_name (text) — resident who created the campaign
- created_at (timestamptz default now())
- updated_at (timestamptz default now())

### 2. campaign_commitments
Individual resident commitments within a campaign.
- id (uuid PK)
- campaign_id (uuid FK → group_campaigns ON DELETE CASCADE)
- resident_name (text) — demo identity (no auth)
- qty (integer) — committed quantity
- created_at (timestamptz default now())
- updated_at (timestamptz default now())
- UNIQUE(campaign_id, resident_name) — prevents duplicate participation

## Security
- Single-tenant demo app with NO authentication.
- RLS enabled on both tables.
- Policies allow anon + authenticated full CRUD (data is intentionally shared/public for demo).
- This is explicitly a demo mode — any visitor can see and modify all campaigns.
- Real production would require auth + ownership-scoped policies.

## Notes
1. total_committed and participant_count on group_campaigns are maintained by the
   application layer (read + recompute on each commitment change). A trigger could
   also do this, but app-side keeps the demo simple and avoids trigger complexity.
2. Campaign status is derived from deadline + min_qty at read time in the app,
   not stored as a hardcoded label. The status column is a cache for display.
3. No payment, delivery, or order-confirmation tables — those features are not
   implemented and should not be implied.
*/

CREATE TABLE IF NOT EXISTS group_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id text NOT NULL,
  product_name text NOT NULL,
  product_image text NOT NULL DEFAULT '',
  product_pack_size text NOT NULL DEFAULT '',
  product_category text NOT NULL DEFAULT '',
  society text NOT NULL,
  retailer_id text NOT NULL,
  individual_price numeric NOT NULL DEFAULT 0,
  bulk_price numeric NOT NULL DEFAULT 0,
  bulk_price_confirmed boolean NOT NULL DEFAULT false,
  min_qty integer NOT NULL DEFAULT 1,
  total_committed integer NOT NULL DEFAULT 0,
  participant_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'open',
  deadline timestamptz NOT NULL,
  creator_name text NOT NULL DEFAULT 'Anonymous',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE group_campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_campaigns" ON group_campaigns;
CREATE POLICY "anon_select_campaigns" ON group_campaigns FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_campaigns" ON group_campaigns;
CREATE POLICY "anon_insert_campaigns" ON group_campaigns FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_campaigns" ON group_campaigns;
CREATE POLICY "anon_update_campaigns" ON group_campaigns FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_campaigns" ON group_campaigns;
CREATE POLICY "anon_delete_campaigns" ON group_campaigns FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS campaign_commitments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES group_campaigns(id) ON DELETE CASCADE,
  resident_name text NOT NULL,
  qty integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, resident_name)
);

ALTER TABLE campaign_commitments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_commitments" ON campaign_commitments;
CREATE POLICY "anon_select_commitments" ON campaign_commitments FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_commitments" ON campaign_commitments;
CREATE POLICY "anon_insert_commitments" ON campaign_commitments FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_commitments" ON campaign_commitments;
CREATE POLICY "anon_update_commitments" ON campaign_commitments FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_commitments" ON campaign_commitments;
CREATE POLICY "anon_delete_commitments" ON campaign_commitments FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_campaigns_society_status ON group_campaigns(society, status);
CREATE INDEX IF NOT EXISTS idx_campaigns_product ON group_campaigns(product_id);
CREATE INDEX IF NOT EXISTS idx_commitments_campaign ON campaign_commitments(campaign_id);
CREATE INDEX IF NOT EXISTS idx_commitments_resident ON campaign_commitments(resident_name);
