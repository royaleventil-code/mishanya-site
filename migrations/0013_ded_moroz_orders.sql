CREATE TABLE IF NOT EXISTS dm_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_key TEXT NOT NULL UNIQUE,
  season_year TEXT NOT NULL,
  created_at TEXT NOT NULL,
  ready_by TEXT NOT NULL,
  child_count INTEGER NOT NULL,
  payload_ciphertext TEXT NOT NULL,
  photo_prefix TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'new',
  video_url TEXT NOT NULL DEFAULT '',
  telegram_attempts INTEGER NOT NULL DEFAULT 0,
  telegram_next_at INTEGER NOT NULL,
  telegram_sent_at INTEGER
);

CREATE INDEX IF NOT EXISTS dm_orders_telegram_pending
  ON dm_orders (telegram_next_at) WHERE telegram_sent_at IS NULL;

CREATE TABLE IF NOT EXISTS dm_order_limits (
  rate_key TEXT NOT NULL,
  window_start INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (rate_key, window_start)
);

CREATE INDEX IF NOT EXISTS dm_order_limits_by_window ON dm_order_limits (window_start);

CREATE TABLE IF NOT EXISTS dm_photo_uploads (
  upload_id TEXT PRIMARY KEY,
  expires_at INTEGER
) WITHOUT ROWID;

CREATE INDEX IF NOT EXISTS dm_photo_uploads_expiry
  ON dm_photo_uploads (expires_at) WHERE expires_at IS NOT NULL;

CREATE TABLE IF NOT EXISTS dm_order_photo_parts (
  upload_id TEXT NOT NULL REFERENCES dm_photo_uploads(upload_id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  part INTEGER NOT NULL,
  content BLOB NOT NULL,
  PRIMARY KEY (upload_id, filename, part)
) WITHOUT ROWID;
