INSERT INTO "payment_methods" ("id_payment_method", "name_payment_method")
VALUES (4, 'Saldo a favor')
ON CONFLICT ("id_payment_method") DO UPDATE
SET "name_payment_method" = EXCLUDED."name_payment_method";

SELECT setval(
  pg_get_serial_sequence('"payment_methods"', 'id_payment_method'),
  COALESCE((SELECT MAX("id_payment_method") FROM "payment_methods"), 1),
  true
);
