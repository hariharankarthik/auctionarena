-- Weekly free agent window: teams can open one free agent window per week.
-- Changes are staged client-side and committed atomically via RPC.
-- The weekly window resets every Saturday at 12:00 AM Pacific Time.

ALTER TABLE private_league_teams
  ADD COLUMN IF NOT EXISTS fa_window_used_at TIMESTAMPTZ;

-- Atomically commit a batch of free agent swaps for a team's weekly window.
-- p_swaps: JSONB array of { "drop": "player_uuid", "add": "player_uuid" } objects.
-- Items with drop=null are pure adds (squad not full); items with add=null are pure drops.
CREATE OR REPLACE FUNCTION commit_free_agent_window(
  p_team_id UUID,
  p_league_id UUID,
  p_user_id UUID,
  p_swaps JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_team private_league_teams%ROWTYPE;
  v_week_start TIMESTAMPTZ;
  v_swap JSONB;
  v_drop_id UUID;
  v_add_id UUID;
  v_already_picked BOOLEAN;
  v_squad UUID[];
  v_max_squad INT := 15;
BEGIN
  -- Compute the most recent Saturday midnight Pacific Time.
  -- DOW: 0=Sun,1=Mon,...,6=Sat. We want the last Saturday (DOW=6).
  v_week_start := date_trunc('day',
    (NOW() AT TIME ZONE 'America/Los_Angeles')
    - ((EXTRACT(DOW FROM NOW() AT TIME ZONE 'America/Los_Angeles')::int + 1) % 7 || ' days')::interval
  ) AT TIME ZONE 'America/Los_Angeles';

  -- Lock ALL teams in this league to prevent concurrent modifications
  PERFORM id FROM private_league_teams
    WHERE league_id = p_league_id
    FOR UPDATE;

  -- Read the team after lock
  SELECT * INTO v_team
    FROM private_league_teams
    WHERE id = p_team_id AND league_id = p_league_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Team not found');
  END IF;

  IF v_team.claimed_by IS NULL OR v_team.claimed_by != p_user_id THEN
    RETURN jsonb_build_object('error', 'You do not own this team');
  END IF;

  -- Check window not already used this week
  IF v_team.fa_window_used_at IS NOT NULL AND v_team.fa_window_used_at >= v_week_start THEN
    RETURN jsonb_build_object('error', 'Free agent window already used this week. Resets Saturday at midnight PT.');
  END IF;

  -- Validate p_swaps is a non-empty array
  IF p_swaps IS NULL OR jsonb_array_length(p_swaps) = 0 THEN
    RETURN jsonb_build_object('error', 'No changes to commit');
  END IF;

  v_squad := v_team.squad_player_ids;

  -- Process each swap
  FOR v_swap IN SELECT * FROM jsonb_array_elements(p_swaps)
  LOOP
    v_drop_id := NULLIF(v_swap->>'drop', '')::UUID;
    v_add_id := NULLIF(v_swap->>'add', '')::UUID;

    -- Validate drop
    IF v_drop_id IS NOT NULL THEN
      IF NOT (v_drop_id = ANY(v_squad)) THEN
        RETURN jsonb_build_object('error', 'Player ' || v_drop_id || ' is not on your squad');
      END IF;
      v_squad := array_remove(v_squad, v_drop_id);
    END IF;

    -- Validate add
    IF v_add_id IS NOT NULL THEN
      IF array_length(v_squad, 1) >= v_max_squad THEN
        RETURN jsonb_build_object('error', 'Squad would exceed maximum size (15)');
      END IF;

      -- Check player not already on any team in the league
      SELECT EXISTS (
        SELECT 1 FROM private_league_teams plt
        WHERE plt.league_id = p_league_id
          AND v_add_id = ANY(plt.squad_player_ids)
      ) INTO v_already_picked;

      IF v_already_picked THEN
        RETURN jsonb_build_object('error', 'Player ' || v_add_id || ' is already on a team');
      END IF;

      IF v_add_id = ANY(v_squad) THEN
        RETURN jsonb_build_object('error', 'Player ' || v_add_id || ' is already on your squad');
      END IF;

      v_squad := v_squad || v_add_id;
    END IF;
  END LOOP;

  -- Apply the final squad and mark window as used
  UPDATE private_league_teams SET
    squad_player_ids = v_squad,
    -- Remove dropped players from starting XI, captain, and vice-captain
    starting_xi_player_ids = (
      SELECT COALESCE(array_agg(pid), '{}')
      FROM unnest(starting_xi_player_ids) AS pid
      WHERE pid = ANY(v_squad)
    ),
    captain_player_id = CASE WHEN captain_player_id = ANY(v_squad) THEN captain_player_id ELSE NULL END,
    vice_captain_player_id = CASE WHEN vice_captain_player_id = ANY(v_squad) THEN vice_captain_player_id ELSE NULL END,
    fa_window_used_at = NOW()
  WHERE id = p_team_id;

  RETURN jsonb_build_object('success', true, 'squad_size', array_length(v_squad, 1));
END;
$$;

GRANT EXECUTE ON FUNCTION public.commit_free_agent_window(UUID, UUID, UUID, JSONB) TO authenticated;
