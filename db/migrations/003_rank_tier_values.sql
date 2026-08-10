-- Converts player role ranks from text to canonical numeric League tiers.
-- 1 Iron, 2 Bronze, 3 Silver, 4 Gold, 5 Platinum, 6 Emerald,
-- 7 Diamond, 8 Master, 9 Grandmaster, 10 Challenger.

USE customs_ledger;

ALTER TABLE player_role_ranks
  ADD COLUMN rank_value TINYINT UNSIGNED NULL AFTER role;

UPDATE player_role_ranks
SET rank_value = CASE LOWER(TRIM(rank_name))
  WHEN 'iron' THEN 1
  WHEN 'bronze' THEN 2
  WHEN 'silver' THEN 3
  WHEN 'gold' THEN 4
  WHEN 'platinum' THEN 5
  WHEN 'emerald' THEN 6
  WHEN 'diamond' THEN 7
  WHEN 'master' THEN 8
  WHEN 'grandmaster' THEN 9
  WHEN 'challenger' THEN 10
  ELSE NULL
END;

DELETE FROM player_role_ranks WHERE rank_value IS NULL;

ALTER TABLE player_role_ranks
  MODIFY COLUMN rank_value TINYINT UNSIGNED NOT NULL,
  ADD CONSTRAINT chk_player_role_rank_value CHECK (rank_value BETWEEN 1 AND 10),
  DROP COLUMN rank_name;
