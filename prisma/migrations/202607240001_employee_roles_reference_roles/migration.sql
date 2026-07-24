ALTER TABLE "employee_roles" ADD COLUMN "id_role" INTEGER;

UPDATE "employee_roles" AS employee_role
SET "id_role" = assigned_permission."id_role"
FROM "assigned_permissions" AS assigned_permission
WHERE employee_role."id_assigned_permission" = assigned_permission."id_permission";

ALTER TABLE "employee_roles" ALTER COLUMN "id_role" SET NOT NULL;

ALTER TABLE "employee_roles"
ADD CONSTRAINT "empleados_rol_id_rol_fkey"
FOREIGN KEY ("id_role") REFERENCES "roles"("id_role")
ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "employee_roles"
DROP CONSTRAINT "empleados_rol_id_permisos_asignados_fkey";

ALTER TABLE "employee_roles" DROP COLUMN "id_assigned_permission";
