-- ═══════════════════════════════════════════════════════════
-- PropFlow – Supabase PostgreSQL Schema
-- Run this in Supabase SQL Editor to set up the database
-- ═══════════════════════════════════════════════════════════

-- ── Enable extensions ──────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── USERS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL UNIQUE,
  full_name     TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'agent' CHECK (role IN ('admin', 'agent', 'viewer')),
  phone         TEXT,
  avatar_url    TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  last_login    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── LISTINGS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.listings (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title         TEXT NOT NULL,
  type          TEXT NOT NULL CHECK (type IN ('office','industrial','retail','warehouse','mixed_use','agricultural')),
  listing_type  TEXT NOT NULL CHECK (listing_type IN ('to_let','for_sale')),
  status        TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','featured','pending','let','sold','archived')),
  price         NUMERIC NOT NULL CHECK (price >= 0),
  price_unit    TEXT NOT NULL DEFAULT 'per_month' CHECK (price_unit IN ('per_month','per_sqm','total')),
  size_sqm      NUMERIC NOT NULL CHECK (size_sqm > 0),
  location      TEXT NOT NULL,
  suburb        TEXT,
  city          TEXT NOT NULL,
  province      TEXT NOT NULL,
  postal_code   TEXT,
  description   TEXT,
  images        JSONB NOT NULL DEFAULT '[]',
  features      JSONB NOT NULL DEFAULT '{}',
  -- e.g. {"parking": 6, "floor": 3, "air_conditioning": true, "generator": false}
  view_count    INTEGER NOT NULL DEFAULT 0,
  enquiry_count INTEGER NOT NULL DEFAULT 0,
  agent_id      UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_by    UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── ENQUIRIES ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.enquiries (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id          UUID REFERENCES public.listings(id) ON DELETE SET NULL,
  agent_id            UUID REFERENCES public.users(id) ON DELETE SET NULL,
  user_id             UUID REFERENCES public.users(id) ON DELETE SET NULL,
  name                TEXT NOT NULL,
  email               TEXT NOT NULL,
  phone               TEXT,
  message             TEXT NOT NULL,
  status              TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread','read','in_progress','resolved','archived')),
  viewing_requested   BOOLEAN NOT NULL DEFAULT false,
  viewing_date        TIMESTAMPTZ,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── CHAT LOGS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.chat_logs (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID REFERENCES public.users(id) ON DELETE SET NULL,
  listing_id          UUID REFERENCES public.listings(id) ON DELETE SET NULL,
  message_count       INTEGER NOT NULL DEFAULT 1,
  last_user_message   TEXT,
  tokens_used         INTEGER DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── SAVED LISTINGS (public user favourites) ────────────────
CREATE TABLE IF NOT EXISTS public.saved_listings (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id  UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  session_id  TEXT,
  user_id     UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(listing_id, session_id),
  UNIQUE(listing_id, user_id)
);

-- ══════════════════════════════════════════════════════════
-- INDEXES
-- ══════════════════════════════════════════════════════════
CREATE INDEX idx_listings_status        ON public.listings(status);
CREATE INDEX idx_listings_type          ON public.listings(type);
CREATE INDEX idx_listings_city          ON public.listings(city);
CREATE INDEX idx_listings_agent_id      ON public.listings(agent_id);
CREATE INDEX idx_listings_created_at    ON public.listings(created_at DESC);
CREATE INDEX idx_listings_price         ON public.listings(price);
CREATE INDEX idx_listings_size_sqm      ON public.listings(size_sqm);
CREATE INDEX idx_enquiries_agent_id     ON public.enquiries(agent_id);
CREATE INDEX idx_enquiries_listing_id   ON public.enquiries(listing_id);
CREATE INDEX idx_enquiries_status       ON public.enquiries(status);
CREATE INDEX idx_enquiries_created_at   ON public.enquiries(created_at DESC);

-- Full-text search on listings
CREATE INDEX idx_listings_fts ON public.listings
  USING GIN(to_tsvector('english', title || ' ' || COALESCE(description,'') || ' ' || city || ' ' || location));

-- ══════════════════════════════════════════════════════════
-- FUNCTIONS
-- ══════════════════════════════════════════════════════════
-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_listings_updated_at   BEFORE UPDATE ON public.listings   FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_enquiries_updated_at  BEFORE UPDATE ON public.enquiries  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at      BEFORE UPDATE ON public.users      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Increment enquiry count
CREATE OR REPLACE FUNCTION increment_enquiry_count(listing_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.listings SET enquiry_count = enquiry_count + 1 WHERE id = listing_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment view counts (batch)
CREATE OR REPLACE FUNCTION increment_view_counts(listing_ids UUID[])
RETURNS VOID AS $$
BEGIN
  UPDATE public.listings SET view_count = view_count + 1 WHERE id = ANY(listing_ids);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ══════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ══════════════════════════════════════════════════════════
ALTER TABLE public.users        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enquiries    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_logs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_listings ENABLE ROW LEVEL SECURITY;

-- Users: read own profile, admins read all
CREATE POLICY "users_self_read"   ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_self_update" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Listings: public can read active/featured; agents manage own; admin manages all
CREATE POLICY "listings_public_read" ON public.listings FOR SELECT
  USING (status IN ('active','featured') OR auth.uid() IS NOT NULL);

CREATE POLICY "listings_agent_insert" ON public.listings FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "listings_agent_update" ON public.listings FOR UPDATE
  USING (auth.uid() = agent_id OR auth.uid() = created_by);

CREATE POLICY "listings_admin_all" ON public.listings FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- Enquiries: agents see own; public can insert
CREATE POLICY "enquiries_public_insert" ON public.enquiries FOR INSERT WITH CHECK (true);
CREATE POLICY "enquiries_agent_read"    ON public.enquiries FOR SELECT
  USING (agent_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "enquiries_agent_update"  ON public.enquiries FOR UPDATE
  USING (agent_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- ══════════════════════════════════════════════════════════
-- SEED DATA (optional – remove in production)
-- ══════════════════════════════════════════════════════════
-- Insert a default admin user after running:
-- 1. Create auth user in Supabase dashboard with email: admin@propflow.co.za
-- 2. Then run:
-- INSERT INTO public.users (id, email, full_name, role) 
-- VALUES ('<auth-user-uuid>', 'admin@propflow.co.za', 'Admin User', 'admin');
