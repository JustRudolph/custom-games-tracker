ALTER TABLE matches
  MODIFY COLUMN status ENUM('draft', 'pending', 'complete') NOT NULL DEFAULT 'complete';
