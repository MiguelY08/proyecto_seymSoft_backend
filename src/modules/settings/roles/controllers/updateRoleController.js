import { UpdateRoleUseCase } from "../use-cases/updateRoleUseCase.js";
import { UpdateRoleDto } from "../dtos/roleDtos.js";
import { updateRoleSchema } from "../validators/roleValidators.js";
import { ValidationError } from "../../../../shared/errors/validationError.js";


export class UpdateRoleController {
  static async updateRole(req, res, next) {
    try {
      //  Obtener ID del parámetro
      const { id } = req.params;

      //  Validar entrada con Zod
      const validationResult = updateRoleSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        throw new ValidationError(
          "Validación fallida",
          validationResult.error.errors
        );
      }

      //  Crear DTO con datos validados
      const roleData = new UpdateRoleDto({
        id_role: parseInt(id),
        ...validationResult.data,
      });

      //  Ejecutar use case
      const result = await UpdateRoleUseCase.execute(
        roleData.id_role,
        roleData
      );

      //  Responder
      res.status(200).json({
        success: true,
        message: "Rol actualizado correctamente",
        data: result,
      });

    } catch (error) {
      next(error);
    }
  }
}