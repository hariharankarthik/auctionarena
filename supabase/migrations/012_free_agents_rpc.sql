-- RPC to fetch free agents (players not on any squad in a league).
-- Uses POST body to avoid URL length limits with large exclusion lists.
CREATE OR REPLACE FUNCTION get_free_agents(p_sport_id TEXT, p_excluded_ids UUID[])
RETURNS TABLE(id UUID, name TEXT, role TEXT, nationality TEXT, is_overseas BOOLEAN, base_price INTEGER)
LANGUAGE SQL STABLE
AS $$
  SELECT p.id, p.name, p.role, p.nationality, p.is_overseas, p.base_price
  FROM players p
  WHERE p.sport_id = p_sport_id
    AND p.id != ALL(p_excluded_ids)
  ORDER BY p.base_price DESC;
$$;
