ALTER TABLE "order_details"
  ADD COLUMN "id_barcode" INTEGER;

UPDATE "order_details" AS detail
SET "id_barcode" = barcode."id_barcode"
FROM "barcodes" AS barcode
WHERE barcode."id_product" = detail."id_product"
  AND barcode."barcode" = detail."barcode";

ALTER TABLE "order_details"
  ADD CONSTRAINT "order_details_barcode_fkey"
  FOREIGN KEY ("id_barcode") REFERENCES "barcodes"("id_barcode")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "idx_order_details_barcode"
  ON "order_details"("id_barcode");
