ALTER TABLE dm_orders ADD COLUMN amount_ils REAL NOT NULL DEFAULT 250 CHECK (amount_ils > 0);
ALTER TABLE dm_orders ADD COLUMN repeat_of TEXT;

CREATE UNIQUE INDEX dm_orders_second_video ON dm_orders (repeat_of) WHERE repeat_of IS NOT NULL;
