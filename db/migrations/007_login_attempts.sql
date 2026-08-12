USE customs_ledger;

CREATE TABLE IF NOT EXISTS auth_login_attempts (
  attempt_key CHAR(64) NOT NULL,
  failures TINYINT UNSIGNED NOT NULL DEFAULT 0,
  window_started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  blocked_until DATETIME NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (attempt_key),
  KEY idx_login_attempts_updated (updated_at),
  KEY idx_login_attempts_blocked (blocked_until)
) ENGINE=InnoDB;
