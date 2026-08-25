CREATE TABLE IF NOT EXISTS board_of_shame (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  player_id BIGINT UNSIGNED NULL,
  player_name VARCHAR(100) NOT NULL,
  reason VARCHAR(1000) NOT NULL,
  image MEDIUMTEXT NULL,
  created_by BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_board_shame_created (created_at),
  KEY idx_board_shame_player (player_id),
  CONSTRAINT fk_board_shame_player FOREIGN KEY (player_id) REFERENCES players (id) ON DELETE SET NULL,
  CONSTRAINT fk_board_shame_created_by FOREIGN KEY (created_by) REFERENCES admin_accounts (id) ON DELETE SET NULL
) ENGINE=InnoDB;
