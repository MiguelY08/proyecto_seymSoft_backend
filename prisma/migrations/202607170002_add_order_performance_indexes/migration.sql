-- Indexes for order list filters, payment deadlines, and receipt summaries.
CREATE INDEX IF NOT EXISTS "idx_sales_orders_order_date_id"
  ON "sales_orders" ("order_date", "id_order");

CREATE INDEX IF NOT EXISTS "idx_sales_orders_status_date_id"
  ON "sales_orders" ("id_order_status", "order_date", "id_order");

CREATE INDEX IF NOT EXISTS "idx_sales_orders_payment_status_date_id"
  ON "sales_orders" ("id_payment_status", "order_date", "id_order");

CREATE INDEX IF NOT EXISTS "idx_sales_orders_payment_status_text_date_id"
  ON "sales_orders" ("payment_status", "order_date", "id_order");

CREATE INDEX IF NOT EXISTS "idx_sales_orders_delivery_type_date_id"
  ON "sales_orders" ("delivery_type", "order_date", "id_order");

CREATE INDEX IF NOT EXISTS "idx_sales_orders_payment_deadline"
  ON "sales_orders" ("id_payment_status", "payment_deadline");

CREATE INDEX IF NOT EXISTS "idx_order_payment_receipts_order_status"
  ON "order_payment_receipts" ("id_order", "verification_status");
