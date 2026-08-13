ALTER TABLE matches
  MODIFY COLUMN winner_team ENUM('blue', 'red') NULL,
  ADD COLUMN status ENUM('draft', 'complete') NOT NULL DEFAULT 'complete' AFTER match_type,
  ADD KEY idx_matches_status (status);

ALTER TABLE match_players
  MODIFY COLUMN kills SMALLINT UNSIGNED NULL,
  MODIFY COLUMN deaths SMALLINT UNSIGNED NULL,
  MODIFY COLUMN assists SMALLINT UNSIGNED NULL;
