import { z } from "zod";
import { ValidationError } from "../../../../shared/errors/validationError.js";
import { permissionsSchema } from "../validators/roleValidators.js";
import { ValidateRoleUseCase } from "../use-cases/validateRoleUseCase.js";

const roleIdSchema = z.preprocess((value) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  return Number(value);
}, z.number().int().positive().optional());

const roleNameValidationSchema = z.object({
  name_role: z
    .string()
    .trim()
    .min(5, "El nombre debe tener minimo 5 caracteres")
    .max(20, "El nombre no puede superar 20 caracteres")
    .regex(/^[a-zA-Z][a-zA-Z0-9\s]*$/, "Debe iniciar con letra")
    .refine(
      (value) => value.toLowerCase() !== "administrator",
      "No puedes usar el rol Administrator",
    ),
  id_role: roleIdSchema,
});

const rolePermissionsValidationSchema = z.object({
  permissions: permissionsSchema,
  id_role: roleIdSchema,
});

const roleValidationSchema = z.object({
  name_role: roleNameValidationSchema.shape.name_role,
  permissions: permissionsSchema,
  id_role: roleIdSchema,
});

const throwValidationError = (error) => {
  throw new ValidationError("Validacion fallida", error.issues || error.errors);
};

export class ValidateRoleController {
  static async validateName(req, res, next) {
    try {
      const validationResult = roleNameValidationSchema.safeParse({
        name_role: req.query.name_role || req.query.name,
        id_role: req.query.id_role || req.query.id,
      });

      if (!validationResult.success) {
        throwValidationError(validationResult.error);
      }

      const result = await ValidateRoleUseCase.validateName(
        validationResult.data.name_role,
        validationResult.data.id_role,
      );

      return res.status(200).json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async validatePermissions(req, res, next) {
    try {
      const validationResult = rolePermissionsValidationSchema.safeParse(
        req.body,
      );

      if (!validationResult.success) {
        throwValidationError(validationResult.error);
      }

      const result = await ValidateRoleUseCase.validatePermissions(
        validationResult.data.permissions,
        validationResult.data.id_role,
      );

      // Return a generic message when conflicts exist to avoid
      // exposing detailed per-permission messages to the frontend.
      if (
        !result.valid &&
        Array.isArray(result.conflicts) &&
        result.conflicts.length > 0
      ) {
        return res.status(200).json({
          success: true,
          message: "Uno o mas permisos ya estan asignados a otro rol",
          data: {
            valid: false,
          },
        });
      }

      return res.status(200).json({
        success: true,
        message: result.message,
        data: {
          valid: result.valid,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async validateRole(req, res, next) {
    try {
      const validationResult = roleValidationSchema.safeParse(req.body);

      if (!validationResult.success) {
        throwValidationError(validationResult.error);
      }

      const result = await ValidateRoleUseCase.validateRole({
        nameRole: validationResult.data.name_role,
        permissions: validationResult.data.permissions,
        idRole: validationResult.data.id_role,
      });

      // If permissions have conflicts, hide detailed conflicts and
      // return a generic message so the frontend shows a single alert.
      const permissionsValid = result.permissions?.valid ?? true;

      return res.status(200).json({
        success: true,
        message:
          permissionsValid && result.name?.available
            ? "Rol valido"
            : "El rol tiene conflictos",
        data: {
          valid: result.valid,
          name: result.name,
          permissions: {
            valid: permissionsValid,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
