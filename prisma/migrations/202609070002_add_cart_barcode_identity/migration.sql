ALTER TABLE "shopping_cart_items"
  ADD COLUMN "id_barcode" INTEGER;

UPDATE "shopping_cart_items" AS item
SET "id_barcode" = (
  SELECT b."id_barcode"
  FROM "barcodes" AS b
  WHERE b."id_product" = item."id_product"
    AND b."is_active" = TRUE
  ORDER BY b."is_default" DESC, b."id_barcode" ASC
  LIMIT 1
)
WHERE item."id_barcode" IS NULL;

ALTER TABLE "shopping_cart_items"
  ADD CONSTRAINT "shopping_cart_items_barcode_fkey"
  FOREIGN KEY ("id_barcode") REFERENCES "barcodes"("id_barcode")
  ON DELETE RESTRICT ON UPDATE CASCADE;

DROP INDEX IF EXISTS "uq_shopping_cart_items_client_product";

CREATE UNIQUE INDEX "uq_shopping_cart_items_client_barcode"
  ON "shopping_cart_items"("id_client", "id_barcode");

CREATE INDEX "idx_shopping_cart_items_barcode"
  ON "shopping_cart_items"("id_barcode");
