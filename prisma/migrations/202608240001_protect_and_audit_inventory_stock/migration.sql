CREATE TABLE "inventory_stock_movements" (
  "id_stock_movement" SERIAL NOT NULL,
  "id_barcode" INTEGER NOT NULL,
  "quantity_delta" INTEGER NOT NULL,
  "stock_before" INTEGER NOT NULL,
  "stock_after" INTEGER NOT NULL,
  "movement_type" VARCHAR(50) NOT NULL,
  "reference_type" VARCHAR(50),
  "reference_id" INTEGER,
  "metadata" JSONB,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "inventory_stock_movements_pkey" PRIMARY KEY ("id_stock_movement"),
  CONSTRAINT "inventory_stock_movements_barcode_fkey"
    FOREIGN KEY ("id_barcode") REFERENCES "barcodes"("id_barcode")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "idx_inventory_stock_movements_barcode_date"
  ON "inventory_stock_movements"("id_barcode", "created_at");

CREATE INDEX "idx_inventory_stock_movements_reference"
  ON "inventory_stock_movements"("reference_type", "reference_id");

-- Los negativos historicos se conservan para conciliarlos de forma explicita,
-- pero toda escritura nueva queda protegida desde que se instala la migracion.
ALTER TABLE "barcodes"
  ADD CONSTRAINT "barcodes_stock_nonnegative"
  CHECK ("stock" >= 0) NOT VALID;
