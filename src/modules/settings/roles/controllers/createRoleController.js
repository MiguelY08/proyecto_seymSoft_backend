import { CreateRoleUseCase } from "../use-cases/createRoleUseCase.js";
import { CreateRoleDto } from "../dtos/roleDtos.js";
import { createRoleSchema } from "../validators/roleValidators.js";
import { ValidationError } from "../../../../shared/errors/validationError.js";

/**
 * CREATE ROLE CONTROLLER
 * 
 * Endpoint: POST /api/roles
 * Descripción: Crea un nuevo rol con permisos asignados
 * 
 * Body esperado:
 * {
 *   "name_role": "Vendedor",
 *   "description": "Rol para vendedores con permisos básicos",
 *   "permissions": [
 *     { "id_module": 1, "id_privilege": 1 },
 *     { "id_module": 2, "id_privilege": 2 }
 *   ]
 * }
 */
export class CreateRoleController {
  static async createRole(req, res, next) {
    try {
      //  Validar entrada con Zod
      const validationResult = createRoleSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        throw new ValidationError(
          "Validación fallida",
          validationResult.error.issues || validationResult.error.errors
        );
      }

      //  Crear DTO con datos validados
      const roleData = new CreateRoleDto(validationResult.data);

      //  Ejecutar use case
      const result = await CreateRoleUseCase.execute(roleData);

      // Responder con código 201 (Created)
      res.status(201).json({
        success: true,
        message: "Rol creado correctamente",
        data: result,
      });

    } catch (error) {
      next(error);
    }
  }
}
