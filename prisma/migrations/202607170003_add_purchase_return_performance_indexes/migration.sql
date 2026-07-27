-- Indexes for purchase return list filters, metrics, detail history, and progress summaries.
CREATE INDEX IF NOT EXISTS "idx_purchase_returns_creation_date_id"
  ON "purchases_returns" ("creation_date", "id_purchase_return");

CREATE INDEX IF NOT EXISTS "idx_purchase_returns_status_date_id"
  ON "purchases_returns" ("id_return_status", "creation_date", "id_purchase_return");

CREATE INDEX IF NOT EXISTS "idx_purchase_returns_purchase"
  ON "purchases_returns" ("id_purchase");

CREATE INDEX IF NOT EXISTS "idx_prd_return_status"
  ON "prd" ("id_purchase_return", "id_return_status");

CREATE INDEX IF NOT EXISTS "idx_prd_purchase_detail"
  ON "prd" ("id_purchase_detail");

CREATE INDEX IF NOT EXISTS "idx_hsp_purchase_return"
  ON "hsp" ("id_purchase_return");

CREATE INDEX IF NOT EXISTS "idx_hsp_purchase_detail"
  ON "hsp" ("id_purchase_detail");
