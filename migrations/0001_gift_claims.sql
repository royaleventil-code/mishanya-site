CREATE TABLE IF NOT EXISTS gift_claims (
  id TEXT PRIMARY KEY,
  phone_hash TEXT NOT NULL UNIQUE,
  gift_code TEXT NOT NULL,
  source_code TEXT NOT NULL,
  language TEXT NOT NULL,
  payload_ciphertext TEXT NOT NULL,
  submitted_at TEXT NOT NULL,
  valid_until TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  bitrix_lead_id INTEGER,
  last_error TEXT,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS gift_claims_status_idx
  ON gift_claims (status, updated_at);

CREATE INDEX IF NOT EXISTS gift_claims_valid_until_idx
  ON gift_claims (valid_until);
