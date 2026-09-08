ALTER TABLE "barcodes"
  ADD COLUMN "variant_name" VARCHAR(120),
  ADD COLUMN "variant_image_url" VARCHAR(500),
  ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN "is_default" BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE "barcodes" AS b
SET
  "variant_name" = 'Estilo principal',
  "is_default" = TRUE
WHERE b."id_barcode" IN (
  SELECT MIN("id_barcode")
  FROM "barcodes"
  GROUP BY "id_product"
);

UPDATE "barcodes"
SET "variant_name" = 'Estilo pendiente'
WHERE "variant_name" IS NULL;

CREATE INDEX "idx_barcodes_product_active"
  ON "barcodes"("id_product", "is_active");

CREATE UNIQUE INDEX "uq_barcodes_product_default"
  ON "barcodes"("id_product")
  WHERE "is_default" = TRUE;
