INSERT INTO "assigned_permissions" (
  "id_role",
  "id_module",
  "id_privilege"
)
SELECT
  role_record."id_role",
  module_record."id_module",
  privilege_record."id_privilege"
FROM "roles" AS role_record
CROSS JOIN "modules" AS module_record
CROSS JOIN "privileges" AS privilege_record
WHERE role_record."name_role" = 'Administrator'
  AND module_record."name_module" = 'Devoluciones_en_compras'
  AND privilege_record."name_privilege" = 'CREATE'
ON CONFLICT ("id_role", "id_module", "id_privilege") DO NOTHING;
