-- Indexes for sales list filters and ordering.
CREATE INDEX IF NOT EXISTS "idx_sales_sale_date"
  ON "sales" ("sale_date");

CREATE INDEX IF NOT EXISTS "idx_sales_status_sale_date"
  ON "sales" ("id_sale_status", "sale_date");

CREATE INDEX IF NOT EXISTS "idx_sales_type_sale_date"
  ON "sales" ("id_sale_type", "sale_date");

CREATE INDEX IF NOT EXISTS "idx_sales_employee_sale_date"
  ON "sales" ("id_employe", "sale_date");

CREATE INDEX IF NOT EXISTS "idx_sale_payment_methods_payment_method"
  ON "sale_payment_methods" ("id_payment_method");
