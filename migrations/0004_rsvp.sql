CREATE TABLE IF NOT EXISTS rsvp_events (
  id TEXT PRIMARY KEY,
  public_slug TEXT NOT NULL UNIQUE,
  manage_token_hash TEXT NOT NULL UNIQUE,
  payload_ciphertext TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS rsvp_events_status_idx
  ON rsvp_events (status, updated_at);

CREATE TABLE IF NOT EXISTS rsvp_responses (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  phone_hash TEXT NOT NULL,
  status TEXT NOT NULL,
  adults INTEGER NOT NULL DEFAULT 0,
  children INTEGER NOT NULL DEFAULT 0,
  payload_ciphertext TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (event_id) REFERENCES rsvp_events(id) ON DELETE CASCADE,
  UNIQUE (event_id, phone_hash)
);

CREATE INDEX IF NOT EXISTS rsvp_responses_event_idx
  ON rsvp_responses (event_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS rsvp_rate_limits (
  rate_key TEXT NOT NULL,
  window_start TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (rate_key, window_start)
);
