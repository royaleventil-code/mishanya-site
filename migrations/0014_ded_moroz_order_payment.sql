ALTER TABLE dm_orders ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'unmarked'
  CHECK (payment_status IN ('unmarked', 'unpaid', 'paid'));

UPDATE dm_orders SET status = 'new', payment_status = 'paid' WHERE status = 'paid';
