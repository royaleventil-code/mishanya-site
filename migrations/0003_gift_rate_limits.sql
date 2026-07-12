CREATE TABLE IF NOT EXISTS gift_rate_limits (
  rate_key TEXT NOT NULL,
  window_start TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (rate_key, window_start)
);
