USE customs_ledger;

CREATE TABLE IF NOT EXISTS admin_sessions (
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
