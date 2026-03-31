-- Allow private league participants to claim a team + manage their own Playing XI.

ALTER TABLE private_league_teams
  ADD COLUMN IF NOT EXISTS claimed_by UUID REFERENCES profiles (id) ON DELETE SET NULL;

-- One user can claim at most one team per private league.
CREATE UNIQUE INDEX IF NOT EXISTS private_league_teams_claimed_by_uidx
ON private_league_teams (league_id, claimed_by)
WHERE claimed_by IS NOT NULL;

-- RLS: claimed users can update their own team; hosts can update any team in their league.
DROP POLICY IF EXISTS "Host can update private league teams" ON private_league_teams;
CREATE POLICY "Host or claimed user can update private league teams" ON private_league_teams
FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM fantasy_leagues fl WHERE fl.id = league_id AND fl.host_id = auth.uid ())
  OR claimed_by = auth.uid ()
  OR claimed_by IS NULL
)
WITH CHECK (
  EXISTS (SELECT 1 FROM fantasy_leagues fl WHERE fl.id = league_id AND fl.host_id = auth.uid ())
  OR claimed_by = auth.uid ()
);

