import { z } from "zod";

/**
 * Schema reutilizable para permisos
 */
export const permissionSchema = z.object({
  id_module: z
    .number({
      required_error: "id_module es requerido",
    })
    .int()
    .positive(
      "El id_module debe ser positivo"
    ),

  id_privilege: z
    .number({
      required_error: "id_privilege es requerido",
    })
    .int()
    .positive(
      "El id_privilege debe ser positivo"
    ),
});


/**
 * Validar permisos duplicados
 */
export const permissionsSchema = z
  .array(permissionSchema)
  .min(
    1,
    "Debe asignar al menos un permiso"
  )
  .refine(
    (permissions) => {

      const seen = new Set();

      for (const perm of permissions) {

        const key =
          `${perm.id_module}-${perm.id_privilege}`;

        if (seen.has(key)) {
          return false;
        }

        seen.add(key);

      }

      return true;

    },
    {
      message:
        "No pueden existir permisos duplicados"
    }
  );


/**
 * CREATE ROLE
 */
export const createRoleSchema =
z.object({

  name_role: z
    .string()
    .trim()
    .min(
      5,
      "El nombre debe tener mínimo 5 caracteres"
    )
    .max(
      20,
      "El nombre no puede superar 20 caracteres"
    )
    .regex(
      /^[a-zA-Z][a-zA-Z0-9\s]*$/,
      "Debe iniciar con letra"
    ),

  description: z
    .string()
    .trim()
    .min(
      10,
      "La descripción debe tener mínimo 10 caracteres"
    )
    .max(
      50,
      "La descripción no puede superar 50 caracteres"
    )
    .optional(),

  permissions:
    permissionsSchema

})
.refine(

  data =>
    data.name_role
      .toLowerCase() !==
    "administrator",

  {
    path:["name_role"],
    message:
      "No puedes crear un rol Administrator"
  }

);


/**
 * UPDATE ROLE
 */
export const updateRoleSchema =
z.object({

  name_role: z
    .string()
    .trim()
    .min(
      5,
      "El nombre debe tener mínimo 5 caracteres"
    )
    .max(
      20,
      "El nombre no puede superar 20 caracteres"
    )
    .regex(
      /^[a-zA-Z][a-zA-Z0-9\s]*$/,
      "Debe iniciar con letra"
    ),

  description: z
    .string()
    .trim()
    .min(
      10,
      "La descripción debe tener mínimo 10 caracteres"
    )
    .max(
      50,
      "La descripción no puede superar 50 caracteres"
    )
    .optional(),

  permissions:
    permissionsSchema.optional()

})
.refine(

  data =>

    !data.name_role ||

    data.name_role
    .toLowerCase()
    !==
    "administrator",

  {
    path:["name_role"],
    message:
      "No puedes editar Administrator"
  }

);


/**
 * DELETE ROLE
 */
export const deleteRoleSchema =
z.object({

  id_role:z
    .number()
    .int()
    .positive()

});


/**
 * GET ROLE
 */
export const getRoleSchema =
z.object({

  id_role:z
    .number()
    .int()
    .positive()

});


/**
 * UPDATE STATUS
 */
export const updateRoleStatusSchema =
z.object({

  id_status:z
    .number()
    .int()
    .refine(
      value =>
        [1,2]
        .includes(value),
      {
        message:
        "El estado debe ser 1 o 2"
      }
    )

});

