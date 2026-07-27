ALTER TABLE "installments"
ADD COLUMN IF NOT EXISTS "registered_by" INTEGER;

ALTER TABLE "installments"
DROP CONSTRAINT IF EXISTS "fk_abonos_registered_by";

ALTER TABLE "installments"
ADD CONSTRAINT "fk_abonos_registered_by"
FOREIGN KEY ("registered_by")
REFERENCES "users"("id_user")
ON DELETE NO ACTION
ON UPDATE NO ACTION;

ALTER TABLE "installments"
DROP CONSTRAINT IF EXISTS "installments_cancelled_by_fkey";

ALTER TABLE "installments"
DROP CONSTRAINT IF EXISTS "fk_abonos_cancelled_by";

ALTER TABLE "installments"
ADD CONSTRAINT "fk_abonos_cancelled_by"
FOREIGN KEY ("cancelled_by")
REFERENCES "users"("id_user")
ON DELETE NO ACTION
ON UPDATE NO ACTION;
