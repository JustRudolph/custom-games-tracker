-- Apply this once to an existing Customs Ledger database.
-- It preserves existing players and match history.

USE customs_ledger;

CREATE TABLE IF NOT EXISTS player_role_ranks (
  player_id BIGINT UNSIGNED NOT NULL,
  role ENUM('Top', 'Jungle', 'Middle', 'Bottom', 'Support') NOT NULL,
  rank_name VARCHAR(80) NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (player_id, role),
  CONSTRAINT fk_player_role_ranks_player
    FOREIGN KEY (player_id) REFERENCES players (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Carry the legacy primary role/rank values into the normalized role-rank table.
INSERT INTO player_role_ranks (player_id, role, rank_name)
SELECT id, preferred_role, preferred_rank
FROM players
WHERE preferred_role IS NOT NULL
  AND preferred_rank IS NOT NULL
  AND TRIM(preferred_rank) <> ''
ON DUPLICATE KEY UPDATE rank_name = VALUES(rank_name);

ALTER TABLE match_players
  ADD COLUMN player_name VARCHAR(100) NULL AFTER player_id,
  ADD COLUMN champion_name VARCHAR(80) NULL AFTER champion_id;

UPDATE match_players mp
JOIN players p ON p.id = mp.player_id
SET mp.player_name = p.summoner_name
WHERE mp.player_name IS NULL;

-- Player names are match snapshots. If a profile is deleted later, match history remains legible.
ALTER TABLE match_players
  MODIFY COLUMN player_id BIGINT UNSIGNED NULL,
  MODIFY COLUMN player_name VARCHAR(100) NOT NULL;

ALTER TABLE match_players
  DROP FOREIGN KEY fk_match_players_player,
  ADD CONSTRAINT fk_match_players_player_snapshot
    FOREIGN KEY (player_id) REFERENCES players (id) ON DELETE SET NULL;

ALTER TABLE players
  DROP COLUMN preferred_role,
  DROP COLUMN preferred_rank;
