-- Add co_host_ids array for granting host-level access to additional users.
ALTER TABLE fantasy_leagues ADD COLUMN IF NOT EXISTS co_host_ids UUID[] DEFAULT '{}';

-- Grant Varad Rane co-host access to the Magnolia Cricket Club league (invite code 9HVXGC).
UPDATE fantasy_leagues
SET co_host_ids = array_append(COALESCE(co_host_ids, '{}'), sub.uid)
FROM (
  SELECT id AS uid FROM auth.users WHERE email = 'varadrane99@gmail.com'
) sub
WHERE invite_code = '9HVXGC'
  AND NOT (sub.uid = ANY(COALESCE(co_host_ids, '{}')));
