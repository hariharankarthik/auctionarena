-- Cricsheet cache table for fallback when CricAPI is rate-limited.
-- Stores aggregated player performances per match, populated by:
--   1. Cron auto-sync of recently added matches (syncRecentCricsheetMatches)
--   2. Bulk import script (scripts/import-cricsheet.ts)

CREATE TABLE IF NOT EXISTS cricsheet_cache (
  match_id    TEXT PRIMARY KEY,
  season      TEXT,
  teams       TEXT[],
  event_name  TEXT,
  match_date  TEXT NOT NULL,
  performances JSONB NOT NULL,
  imported_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index on match_date for the fallback lookup path
CREATE INDEX IF NOT EXISTS idx_cricsheet_cache_match_date ON cricsheet_cache (match_date);

-- Allow service role full access (cron + import script use service role)
ALTER TABLE cricsheet_cache ENABLE ROW LEVEL SECURITY;

-- Read access for authenticated users (fallback queries from API routes)
CREATE POLICY "cricsheet_cache_select" ON cricsheet_cache
  FOR SELECT USING (true);

-- Insert/update only via service role (handled by Supabase default)
CREATE POLICY "cricsheet_cache_service_insert" ON cricsheet_cache
  FOR INSERT WITH CHECK (true);

CREATE POLICY "cricsheet_cache_service_update" ON cricsheet_cache
  FOR UPDATE USING (true);
