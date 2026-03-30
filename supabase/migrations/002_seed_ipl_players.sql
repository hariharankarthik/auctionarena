-- IPL 2026 player seed (representative list for MVP). Re-run safe with ON CONFLICT skip via NOT EXISTS.

INSERT INTO players (sport_id, name, nationality, is_overseas, role, base_price, tier, stats, image_url)
SELECT * FROM (VALUES
  ('ipl_2026', 'Virat Kohli', 'India', false, 'BAT', 200, 'marquee', '{"matches":237,"runs":7263}'::jsonb, NULL::text),
  ('ipl_2026', 'Rohit Sharma', 'India', false, 'BAT', 200, 'marquee', '{"matches":230,"runs":6210}'::jsonb, NULL),
  ('ipl_2026', 'Jasprit Bumrah', 'India', false, 'BOWL', 180, 'marquee', '{"wickets":145}'::jsonb, NULL),
  ('ipl_2026', 'Rashid Khan', 'Afghanistan', true, 'BOWL', 190, 'marquee', '{"wickets":140}'::jsonb, NULL),
  ('ipl_2026', 'Ben Stokes', 'England', true, 'ALL', 185, 'set_1', '{"runs":3200,"wickets":100}'::jsonb, NULL),
  ('ipl_2026', 'Glenn Maxwell', 'Australia', true, 'ALL', 170, 'set_1', '{"strike_rate":155}'::jsonb, NULL),
  ('ipl_2026', 'Jos Buttler', 'England', true, 'WK', 175, 'set_1', '{"average":38}'::jsonb, NULL),
  ('ipl_2026', 'KL Rahul', 'India', false, 'WK', 160, 'set_1', '{}'::jsonb, NULL),
  ('ipl_2026', 'Shubman Gill', 'India', false, 'BAT', 150, 'set_1', '{}'::jsonb, NULL),
  ('ipl_2026', 'Hardik Pandya', 'India', false, 'ALL', 155, 'set_1', '{}'::jsonb, NULL),
  ('ipl_2026', 'Ravindra Jadeja', 'India', false, 'ALL', 150, 'set_1', '{}'::jsonb, NULL),
  ('ipl_2026', 'Mohammed Shami', 'India', false, 'BOWL', 140, 'set_1', '{}'::jsonb, NULL),
  ('ipl_2026', 'Trent Boult', 'New Zealand', true, 'BOWL', 145, 'set_1', '{}'::jsonb, NULL),
  ('ipl_2026', 'Kagiso Rabada', 'South Africa', true, 'BOWL', 145, 'set_1', '{}'::jsonb, NULL),
  ('ipl_2026', 'Andre Russell', 'West Indies', true, 'ALL', 140, 'set_1', '{}'::jsonb, NULL),
  ('ipl_2026', 'Sunil Narine', 'West Indies', true, 'ALL', 135, 'set_1', '{}'::jsonb, NULL),
  ('ipl_2026', 'Yuzvendra Chahal', 'India', false, 'BOWL', 120, 'set_2', '{}'::jsonb, NULL),
  ('ipl_2026', 'Kuldeep Yadav', 'India', false, 'BOWL', 115, 'set_2', '{}'::jsonb, NULL),
  ('ipl_2026', 'Axar Patel', 'India', false, 'ALL', 110, 'set_2', '{}'::jsonb, NULL),
  ('ipl_2026', 'Rinku Singh', 'India', false, 'BAT', 100, 'set_2', '{}'::jsonb, NULL),
  ('ipl_2026', 'Tilak Varma', 'India', false, 'BAT', 95, 'set_2', '{}'::jsonb, NULL),
  ('ipl_2026', 'Arshdeep Singh', 'India', false, 'BOWL', 90, 'set_2', '{}'::jsonb, NULL),
  ('ipl_2026', 'Avesh Khan', 'India', false, 'BOWL', 85, 'set_3', '{}'::jsonb, NULL),
  ('ipl_2026', 'Ravi Bishnoi', 'India', false, 'BOWL', 80, 'set_3', '{}'::jsonb, NULL),
  ('ipl_2026', 'Nitish Rana', 'India', false, 'BAT', 75, 'set_3', '{}'::jsonb, NULL),
  ('ipl_2026', 'Washington Sundar', 'India', false, 'ALL', 85, 'set_3', '{}'::jsonb, NULL),
  ('ipl_2026', 'Devon Conway', 'New Zealand', true, 'WK', 130, 'set_2', '{}'::jsonb, NULL),
  ('ipl_2026', 'Faf du Plessis', 'South Africa', true, 'BAT', 125, 'set_2', '{}'::jsonb, NULL),
  ('ipl_2026', 'David Warner', 'Australia', true, 'BAT', 135, 'set_2', '{}'::jsonb, NULL),
  ('ipl_2026', 'Pat Cummins', 'Australia', true, 'BOWL', 160, 'set_1', '{}'::jsonb, NULL),
  ('ipl_2026', 'Mitchell Starc', 'Australia', true, 'BOWL', 150, 'set_1', '{}'::jsonb, NULL)
) AS v(sport_id, name, nationality, is_overseas, role, base_price, tier, stats, image_url)
WHERE NOT EXISTS (
  SELECT 1 FROM players p WHERE p.sport_id = v.sport_id AND p.name = v.name
);
