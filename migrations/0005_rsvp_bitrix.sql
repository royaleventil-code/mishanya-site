ALTER TABLE rsvp_events ADD COLUMN source_type TEXT;
ALTER TABLE rsvp_events ADD COLUMN source_id TEXT;
ALTER TABLE rsvp_events ADD COLUMN manage_token_ciphertext TEXT;
ALTER TABLE rsvp_events ADD COLUMN source_payload_hash TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS rsvp_events_source_unique
  ON rsvp_events (source_type, source_id)
  WHERE source_type IS NOT NULL AND source_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS rsvp_bitrix_sync (
  deal_id TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_event_ts INTEGER,
  event_handler_id TEXT,
  public_slug TEXT,
  last_attempt_at TEXT,
  synced_at TEXT,
  last_error TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS rsvp_bitrix_sync_status_idx
  ON rsvp_bitrix_sync (status, updated_at);

CREATE TABLE IF NOT EXISTS rsvp_bitrix_webhook_receipts (
  fingerprint TEXT PRIMARY KEY,
  deal_id TEXT NOT NULL,
  event_ts INTEGER NOT NULL,
  event_handler_id TEXT NOT NULL,
  status TEXT NOT NULL,
  received_at TEXT NOT NULL,
  queued_at TEXT
);

CREATE INDEX IF NOT EXISTS rsvp_bitrix_webhook_receipts_deal_idx
  ON rsvp_bitrix_webhook_receipts (deal_id, received_at DESC);

CREATE INDEX IF NOT EXISTS rsvp_bitrix_webhook_receipts_received_idx
  ON rsvp_bitrix_webhook_receipts (received_at);
