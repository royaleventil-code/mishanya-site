CREATE TABLE IF NOT EXISTS rsvp_webhook_outbox (
  generation TEXT PRIMARY KEY,
  deal_id TEXT NOT NULL,
  job_json TEXT NOT NULL,
  status TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  next_attempt_at TEXT NOT NULL,
  delivered_at TEXT,
  last_error TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS rsvp_webhook_outbox_pending_idx
  ON rsvp_webhook_outbox (status, next_attempt_at);
