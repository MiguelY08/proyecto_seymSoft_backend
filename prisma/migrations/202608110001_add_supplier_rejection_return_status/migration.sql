INSERT INTO "return_statuses" (
  "id_return_status",
  "name_status",
  "purchase_description",
  "sales_description"
)
VALUES (
  8,
  'Prov. rechazó',
  'El proveedor rechazó la devolución',
  'Devolución rechazada por el proveedor'
)
ON CONFLICT ("id_return_status") DO UPDATE
SET
  "name_status" = EXCLUDED."name_status",
  "purchase_description" = EXCLUDED."purchase_description",
  "sales_description" = EXCLUDED."sales_description";

SELECT setval(
  pg_get_serial_sequence('return_statuses', 'id_return_status'),
  GREATEST((SELECT MAX("id_return_status") FROM "return_statuses"), 1),
  true
);
