CREATE DATABASE IF NOT EXISTS customs_ledger CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE customs_ledger;

CREATE TABLE admin_accounts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, 
  email VARCHAR(255) NOT NULL, 
  display_name VARCHAR(120) NOT NULL, 
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('owner', 'admin', 'viewer') NOT NULL DEFAULT 'admin', 
  is_active BOOLEAN NOT NULL DEFAULT TRUE, last_login_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, 
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id), 
  UNIQUE KEY uq_admin_email (email)
) ENGINE=InnoDB;

CREATE TABLE admin_sessions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  admin_id BIGINT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_admin_session_token (token_hash),
  KEY idx_admin_sessions_admin (admin_id),
  KEY idx_admin_sessions_expiry (expires_at),
  CONSTRAINT fk_admin_sessions_admin FOREIGN KEY (admin_id) REFERENCES admin_accounts (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE players (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, 
  summoner_name VARCHAR(100) NOT NULL,
  normalized_name VARCHAR(100) GENERATED ALWAYS AS (LOWER(TRIM(summoner_name))) STORED, 
  is_active BOOLEAN NOT NULL DEFAULT TRUE, 
  notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, 
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id), 
  UNIQUE KEY uq_player_normalized_name (normalized_name), 
  KEY idx_players_active (is_active)
) ENGINE=InnoDB;

CREATE TABLE player_role_ranks (
  player_id BIGINT UNSIGNED NOT NULL,
  role ENUM('Top', 'Jungle', 'Middle', 'Bottom', 'Support') NOT NULL,
  rank_value TINYINT UNSIGNED NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (player_id, role),
  CONSTRAINT fk_player_role_ranks_player FOREIGN KEY (player_id) REFERENCES players (id) ON DELETE CASCADE,
  CONSTRAINT chk_player_role_rank_value CHECK (rank_value BETWEEN 1 AND 10)
) ENGINE=InnoDB;

CREATE TABLE champions (
  id SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT, 
  name VARCHAR(80) NOT NULL, 
  slug VARCHAR(80) NOT NULL, 
  is_active BOOLEAN NOT NULL DEFAULT TRUE, 
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id), 
  UNIQUE KEY uq_champion_name (name), 
  UNIQUE KEY uq_champion_slug (slug)
) ENGINE=InnoDB;

CREATE TABLE matches (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, 
  played_at DATETIME NOT NULL, 
  winner_team ENUM('blue', 'red') NOT NULL, 
  notes TEXT NULL, created_by BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, 
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id), 
  KEY idx_matches_played_at (played_at), 
  KEY idx_matches_created_by (created_by),
  CONSTRAINT fk_matches_created_by FOREIGN KEY (created_by) REFERENCES admin_accounts (id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE match_teams (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, 
  match_id BIGINT UNSIGNED NOT NULL, 
  side ENUM('blue', 'red') NOT NULL, 
  PRIMARY KEY (id), 
  UNIQUE KEY uq_match_team_side (match_id, side),
  CONSTRAINT fk_match_teams_match FOREIGN KEY (match_id) REFERENCES matches (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE match_players (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, 
  match_team_id BIGINT UNSIGNED NOT NULL, 
  player_id BIGINT UNSIGNED NULL, 
  player_name VARCHAR(100) NOT NULL,
  role ENUM('Top', 'Jungle', 'Middle', 'Bottom', 'Support') NOT NULL, 
  champion_id SMALLINT UNSIGNED NULL, 
  champion_name VARCHAR(80) NULL,
  rank_at_match VARCHAR(80) NULL,
  kills SMALLINT UNSIGNED NOT NULL DEFAULT 0, 
  deaths SMALLINT UNSIGNED NOT NULL DEFAULT 0, 
  assists SMALLINT UNSIGNED NOT NULL DEFAULT 0, 
  position VARCHAR(30) NULL, 
  sort_order TINYINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id), 
  UNIQUE KEY uq_match_team_player (match_team_id, player_id), 
  KEY idx_match_players_player (player_id), 
  KEY idx_match_players_champion (champion_id),
  CONSTRAINT fk_match_players_team FOREIGN KEY (match_team_id) REFERENCES match_teams (id) ON DELETE CASCADE, 
  CONSTRAINT fk_match_players_player FOREIGN KEY (player_id) REFERENCES players (id) ON DELETE SET NULL, 
  CONSTRAINT fk_match_players_champion FOREIGN KEY (champion_id) REFERENCES champions (id) ON DELETE SET NULL,
  CONSTRAINT chk_match_players_kda CHECK (kills >= 0 AND deaths >= 0 AND assists >= 0)
) ENGINE=InnoDB;

CREATE TABLE player_aliases (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, 
  player_id BIGINT UNSIGNED NOT NULL, 
  alias VARCHAR(100) NOT NULL, 
  normalized_alias VARCHAR(100) GENERATED ALWAYS AS (LOWER(TRIM(alias))) STORED, 
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id), 
  UNIQUE KEY uq_player_alias (normalized_alias), 
  CONSTRAINT fk_player_aliases_player FOREIGN KEY (player_id) REFERENCES players (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE app_settings (
  setting_key VARCHAR(100) NOT NULL, 
  setting_value JSON NOT NULL, 
  updated_by BIGINT UNSIGNED NULL, 
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, 
  PRIMARY KEY (setting_key),
  CONSTRAINT fk_settings_admin FOREIGN KEY (updated_by) REFERENCES admin_accounts (id) ON DELETE SET NULL
) ENGINE=InnoDB;
