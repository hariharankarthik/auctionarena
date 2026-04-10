-- RPC to expose match display names from cricket_sync_tracker (which has strict RLS).
-- Returns "Team1 vs Team2" for each match_id, falling back to the raw match_id.

CREATE OR REPLACE FUNCTION get_match_display_names(p_match_ids TEXT[])
RETURNS TABLE(match_id TEXT, display_name TEXT)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    cst.match_id,
    CASE
      WHEN cst.teams IS NOT NULL
        AND array_length(cst.teams, 1) >= 2
        AND cst.teams[1] IS NOT NULL
        AND cst.teams[2] IS NOT NULL
        THEN cst.teams[1] || ' vs ' || cst.teams[2]
      ELSE cst.match_id
    END AS display_name
  FROM cricket_sync_tracker cst
  WHERE cst.match_id = ANY(p_match_ids);
$$;

GRANT EXECUTE ON FUNCTION public.get_match_display_names(TEXT[]) TO authenticated;
