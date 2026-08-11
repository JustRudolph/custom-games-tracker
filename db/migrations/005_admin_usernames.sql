USE customs_ledger;

ALTER TABLE admin_accounts
  ADD COLUMN username VARCHAR(32) NULL AFTER id;

UPDATE admin_accounts
SET username = CONCAT('admin', id)
WHERE username IS NULL OR TRIM(username) = '';

ALTER TABLE admin_accounts
  MODIFY username VARCHAR(32) NOT NULL,
  MODIFY email VARCHAR(255) NULL,
  ADD UNIQUE KEY uq_admin_username (username);
