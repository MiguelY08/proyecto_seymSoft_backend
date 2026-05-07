import { z } from "zod";

/**
 * CREATE ROLE SCHEMA
 * Validación para crear un nuevo rol
 * 
 * Reglas:
 * - name_role: 5-20 caracteres, NO solo números, UNIQUE
 * - description: 10-50 caracteres, NO solo números (opcional)
 * - permissions: Mínimo 1 permiso (id_module + id_privilege)
 */
export const createRoleSchema = z
  .object({
    name_role: z
      .string()
      .min(5, "El nombre del rol debe tener mínimo 5 caracteres")
      .max(20, "El nombre del rol no puede exceder 20 caracteres")
      .regex(
        /^[a-zA-Z][\w\s]*$/,
        "El nombre del rol debe comenzar con letra y solo puede contener letras, números y espacios"
      )
      .regex(
        /[a-zA-Z]/,
        "El nombre del rol no puede ser solo números"
      )
      .trim(),
    description: z
      .string()
      .min(10, "La descripción debe tener mínimo 10 caracteres")
      .max(50, "La descripción no puede exceder 50 caracteres")
      .regex(
        /[a-zA-Z]/,
        "La descripción no puede ser solo números"
      )
      .trim()
      .optional(),
    permissions: z
      .array(
        z.object({
          id_module: z
            .number()
            .int()
            .positive("El id_module debe ser un número positivo"),
          id_privilege: z
            .number()
            .int()
            .positive("El id_privilege debe ser un número positivo"),
        })
      )
      .min(1, "Debe asignar mínimo 1 permiso (módulo + privilegio)")
      .refine(
        (permissions) => {
          // Validar que no haya duplicados (mismo módulo + privilegio)
          const seen = new Set();
          for (const perm of permissions) {
            const key = `${perm.id_module}-${perm.id_privilege}`;
            if (seen.has(key)) return false;
            seen.add(key);
          }
          return true;
        },
        {
          message: "No pueden haber permisos duplicados",
        }
      ),
  })
  .refine(
    (data) => data.name_role.toLowerCase() !== "administrator",
    {
      message: "No puedes crear un rol con el nombre 'Administrator'",
      path: ["name_role"],
    }
  );

/**
 * UPDATE ROLE SCHEMA
 * Validación para actualizar un rol
 * 
 * Las validaciones son las MISMAS que crear
 * Pero validamos que NO sea "Administrator"
 */
export const updateRoleSchema = z
  .object({
    name_role: z
      .string()
      .min(5, "El nombre del rol debe tener mínimo 5 caracteres")
      .max(20, "El nombre del rol no puede exceder 20 caracteres")
      .regex(
        /^[a-zA-Z][\w\s]*$/,
        "El nombre del rol debe comenzar con letra y solo puede contener letras, números y espacios"
      )
      .regex(
        /[a-zA-Z]/,
        "El nombre del rol no puede ser solo números"
      )
      .trim(),
    description: z
      .string()
      .min(10, "La descripción debe tener mínimo 10 caracteres")
      .max(50, "La descripción no puede exceder 50 caracteres")
      .regex(
        /[a-zA-Z]/,
        "La descripción no puede ser solo números"
      )
      .trim()
      .optional(),
    permissions: z
      .array(
        z.object({
          id_module: z
            .number()
            .int()
            .positive("El id_module debe ser un número positivo"),
          id_privilege: z
            .number()
            .int()
            .positive("El id_privilege debe ser un número positivo"),
        })
      )
      .min(1, "Debe asignar mínimo 1 permiso (módulo + privilegio)")
      .refine(
        (permissions) => {
          const seen = new Set();
          for (const perm of permissions) {
            const key = `${perm.id_module}-${perm.id_privilege}`;
            if (seen.has(key)) return false;
            seen.add(key);
          }
          return true;
        },
        {
          message: "No pueden haber permisos duplicados",
        }
      ),
  })
  .refine(
    (data) => data.name_role.toLowerCase() !== "administrator",
    {
      message: "No puedes editar el rol 'Administrator'",
      path: ["name_role"],
    }
  );

/**
 * DELETE ROLE SCHEMA
 * Validación para eliminar un rol
 * 
 * Solo necesita id_role que viene en parámetro
 * Las validaciones se hacen en el use case:
 * - NO puede ser "Administrator"
 * - NO puede tener employee_roles asociados
 */
export const deleteRoleSchema = z.object({
  id_role: z
    .number()
    .int()
    .positive("El id_role debe ser un número positivo"),
});

/**
 * GET ROLE BY ID SCHEMA
 * Validación para obtener un rol por ID
 */
export const getRoleSchema = z.object({
  id_role: z
    .number()
    .int()
    .positive("El id_role debe ser un número positivo"),
});

/**
 * UPDATE ROLE STATUS SCHEMA
 * Validación para cambiar estado de un rol (activo/inactivo)
 * 
 * Reglas:
 * - id_status: 1 (Activo) o 2 (Inactivo)
 */
export const updateRoleStatusSchema = z.object({
  id_status: z
    .number()
    .int()
    .refine(
      (val) => [1, 2].includes(val),
      "El estado debe ser 1 (Activo) o 2 (Inactivo)"
    ),
});