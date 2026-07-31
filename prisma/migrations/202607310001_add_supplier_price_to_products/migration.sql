ALTER TABLE "products"
ADD COLUMN IF NOT EXISTS "precio_proveedor" DECIMAL(10, 2);
