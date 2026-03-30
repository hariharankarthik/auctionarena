-- AuctionArena — initial schema (run on Supabase SQL editor or supabase db push)

-- ========== SPORTS ==========
CREATE TABLE IF NOT EXISTS sports (
  id TEXT PRIMARY KEY,
  sport_type TEXT NOT NULL,
  display_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  default_config JSONB NOT NULL DEFAULT '{}',
  scoring_rules JSONB NOT NULL DEFAULT '{}',
  player_roles TEXT[] NOT NULL DEFAULT '{}',
  season_start DATE,
  season_end DATE
);

-- ========== PROFILES ==========
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  is_pro BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(trim(NEW.raw_user_meta_data->>'preferred_username'), ''),
      split_part(COALESCE(NEW.email, 'user@local'), '@', 1)
    ) || '_' || substr(replace(NEW.id::text, '-', ''), 1, 6),
    COALESCE(
      NULLIF(trim(NEW.raw_user_meta_data->>'full_name'), ''),
      split_part(COALESCE(NEW.email, 'user@local'), '@', 1)
    ),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========== PLAYERS ==========
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sport_id TEXT NOT NULL REFERENCES sports (id),
  name TEXT NOT NULL,
  nationality TEXT,
  is_overseas BOOLEAN DEFAULT FALSE,
  role TEXT NOT NULL,
  base_price INTEGER NOT NULL,
  stats JSONB DEFAULT '{}',
  image_url TEXT,
  tier TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_players_sport ON players (sport_id);

-- ========== AUCTION ROOMS ==========
CREATE TABLE IF NOT EXISTS auction_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sport_id TEXT NOT NULL REFERENCES sports (id),
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  host_id UUID NOT NULL REFERENCES profiles (id),
  status TEXT DEFAULT 'lobby' CHECK (status IN ('lobby', 'live', 'paused', 'completed')),
  config JSONB NOT NULL DEFAULT '{}',
  current_player_id UUID REFERENCES players (id),
  current_bid INTEGER DEFAULT 0,
  current_bidder_team_id UUID,
  player_queue UUID[] DEFAULT '{}',
  queue_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rooms_invite ON auction_rooms (invite_code);
CREATE INDEX IF NOT EXISTS idx_rooms_host ON auction_rooms (host_id);

-- ========== TEAMS ==========
CREATE TABLE IF NOT EXISTS auction_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES auction_rooms (id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES profiles (id),
  team_name TEXT NOT NULL,
  team_color TEXT DEFAULT '#3B82F6',
  remaining_purse INTEGER NOT NULL,
  players_bought INTEGER DEFAULT 0,
  overseas_count INTEGER DEFAULT 0,
  is_ready BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (room_id, owner_id)
);

CREATE INDEX IF NOT EXISTS idx_teams_room ON auction_teams (room_id);

-- ========== BIDS ==========
CREATE TABLE IF NOT EXISTS bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES auction_rooms (id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players (id),
  team_id UUID NOT NULL REFERENCES auction_teams (id),
  amount INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bids_room ON bids (room_id);

-- ========== AUCTION RESULTS ==========
CREATE TABLE IF NOT EXISTS auction_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES auction_rooms (id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players (id),
  team_id UUID REFERENCES auction_teams (id),
  sold_price INTEGER,
  is_unsold BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (room_id, player_id)
);

CREATE INDEX IF NOT EXISTS idx_results_room ON auction_results (room_id);
CREATE INDEX IF NOT EXISTS idx_results_team ON auction_results (team_id);

-- ========== FANTASY ==========
CREATE TABLE IF NOT EXISTS fantasy_leagues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID UNIQUE NOT NULL REFERENCES auction_rooms (id) ON DELETE CASCADE,
  sport_id TEXT NOT NULL REFERENCES sports (id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fantasy_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID NOT NULL REFERENCES fantasy_leagues (id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES auction_teams (id),
  match_id TEXT NOT NULL,
  match_date DATE NOT NULL,
  total_points DECIMAL(10, 2) DEFAULT 0,
  breakdown JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (league_id, team_id, match_id)
);

CREATE INDEX IF NOT EXISTS idx_scores_league ON fantasy_scores (league_id);

-- ========== RPC ==========
CREATE OR REPLACE FUNCTION public.update_team_after_purchase(
  p_team_id UUID,
  p_amount INTEGER,
  p_is_overseas BOOLEAN
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE auction_teams SET
    remaining_purse = remaining_purse - p_amount,
    players_bought = players_bought + 1,
    overseas_count = CASE WHEN p_is_overseas THEN overseas_count + 1 ELSE overseas_count END
  WHERE id = p_team_id;
END;
$$;

-- ========== REALTIME (idempotent) ==========
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE auction_rooms;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE auction_teams;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE bids;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE auction_results;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE fantasy_scores;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ========== RLS ==========
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sports ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE fantasy_leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE fantasy_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Sports readable" ON sports;
CREATE POLICY "Sports readable" ON sports FOR SELECT USING (true);

DROP POLICY IF EXISTS "Players readable" ON players;
CREATE POLICY "Players readable" ON players FOR SELECT USING (true);

DROP POLICY IF EXISTS "Rooms are viewable by everyone" ON auction_rooms;
CREATE POLICY "Rooms are viewable by everyone" ON auction_rooms FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated users can create rooms" ON auction_rooms;
CREATE POLICY "Authenticated users can create rooms" ON auction_rooms FOR INSERT WITH CHECK (auth.uid() = host_id);
DROP POLICY IF EXISTS "Host can update room" ON auction_rooms;
CREATE POLICY "Host can update room" ON auction_rooms FOR UPDATE USING (auth.uid() = host_id);

DROP POLICY IF EXISTS "Teams are viewable by everyone" ON auction_teams;
CREATE POLICY "Teams are viewable by everyone" ON auction_teams FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can create own team" ON auction_teams;
CREATE POLICY "Users can create own team" ON auction_teams FOR INSERT WITH CHECK (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Users can update own team" ON auction_teams;
CREATE POLICY "Users can update own team" ON auction_teams FOR UPDATE USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Bids are viewable by everyone" ON bids;
CREATE POLICY "Bids are viewable by everyone" ON bids FOR SELECT USING (true);
DROP POLICY IF EXISTS "Team owners can place bids" ON bids;
CREATE POLICY "Team owners can place bids" ON bids FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT owner_id FROM auction_teams WHERE id = team_id)
);

DROP POLICY IF EXISTS "Results viewable by everyone" ON auction_results;
CREATE POLICY "Results viewable by everyone" ON auction_results FOR SELECT USING (true);
DROP POLICY IF EXISTS "Host can insert auction results" ON auction_results;
CREATE POLICY "Host can insert auction results" ON auction_results FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM auction_rooms r WHERE r.id = room_id AND r.host_id = auth.uid())
);

DROP POLICY IF EXISTS "Leagues viewable by everyone" ON fantasy_leagues;
CREATE POLICY "Leagues viewable by everyone" ON fantasy_leagues FOR SELECT USING (true);
DROP POLICY IF EXISTS "Host can insert fantasy league" ON fantasy_leagues;
CREATE POLICY "Host can insert fantasy league" ON fantasy_leagues FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM auction_rooms r WHERE r.id = room_id AND r.host_id = auth.uid())
);

DROP POLICY IF EXISTS "Scores viewable by everyone" ON fantasy_scores;
CREATE POLICY "Scores viewable by everyone" ON fantasy_scores FOR SELECT USING (true);
DROP POLICY IF EXISTS "Host can insert fantasy scores" ON fantasy_scores;
CREATE POLICY "Host can insert fantasy scores" ON fantasy_scores FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM fantasy_leagues fl
    JOIN auction_rooms ar ON ar.id = fl.room_id
    WHERE fl.id = league_id AND ar.host_id = auth.uid()
  )
);

-- Seed sports metadata (IPL active, NFL placeholder)
INSERT INTO sports (id, sport_type, display_name, is_active, default_config, scoring_rules, player_roles)
VALUES (
  'ipl_2026',
  'cricket',
  'IPL 2026',
  TRUE,
  '{"purse":12000,"timerSeconds":30,"maxTeams":10}'::jsonb,
  '{}'::jsonb,
  ARRAY['BAT','BOWL','ALL','WK']::text[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO sports (id, sport_type, display_name, is_active, default_config, scoring_rules, player_roles)
VALUES (
  'nfl_2026',
  'football',
  'NFL 2026',
  FALSE,
  '{}'::jsonb,
  '{}'::jsonb,
  ARRAY['QB','RB','WR','TE','K','DEF']::text[]
) ON CONFLICT (id) DO NOTHING;
