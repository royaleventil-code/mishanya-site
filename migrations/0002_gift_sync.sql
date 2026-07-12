ALTER TABLE gift_claims ADD COLUMN sync_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE gift_claims ADD COLUMN last_attempt_at TEXT;
