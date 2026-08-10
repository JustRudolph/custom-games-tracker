-- Apply this only after 001 stopped with a duplicate foreign-key-name error.
-- The earlier statements from 001 have already completed.

USE customs_ledger;

ALTER TABLE match_players
  DROP FOREIGN KEY fk_match_players_player;

ALTER TABLE match_players
  ADD CONSTRAINT fk_match_players_player_snapshot
    FOREIGN KEY (player_id) REFERENCES players (id) ON DELETE SET NULL;

ALTER TABLE players
  DROP COLUMN preferred_role,
  DROP COLUMN preferred_rank;
