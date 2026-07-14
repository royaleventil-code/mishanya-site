CREATE TABLE IF NOT EXISTS rsvp_client_messages (
  deal_id TEXT NOT NULL,
  message_kind TEXT NOT NULL,
  contact_id TEXT NOT NULL,
  template_version TEXT NOT NULL,
  message_fingerprint TEXT NOT NULL,
  status TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  claimed_at TEXT,
  accepted_at TEXT,
  next_attempt_at TEXT,
  provider_message_id TEXT,
  last_http_status INTEGER,
  last_error TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (deal_id, message_kind)
);

CREATE INDEX IF NOT EXISTS rsvp_client_messages_status_idx
  ON rsvp_client_messages (status, updated_at);
