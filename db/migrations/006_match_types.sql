USE customs_ledger;

ALTER TABLE matches
  ADD COLUMN match_type ENUM('manual', 'spin') NOT NULL DEFAULT 'manual' AFTER winner_team,
  ADD KEY idx_matches_type (match_type);
