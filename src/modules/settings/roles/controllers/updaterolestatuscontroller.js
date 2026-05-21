import { UpdateRoleStatusUseCase } from "../use-cases/updateRoleStatusUseCase.js";
import { ValidationError } from "../../../../shared/errors/validationError.js";

/**
 * UPDATE ROLE STATUS CONTROLLER
 * 
 * Endpoint: PATCH /api/roles/:id/status
 * Descripción: Activa o desactiva un rol
 * 
 * Body esperado:
 * {
 *   "id_status": 1  // 1 = Activo, 2 = Inactivo
 * }
 * 
 * Restricciones:
 * - NO se puede cambiar estado de "Administrator"
 * - id_status debe ser 1 o 2
 * - NO puede cambiar al mismo estado que ya tiene
 * 
 * Ejemplo:
 * PATCH /api/roles/5/status
 * Body: { "id_status": 2 }
 */
export class UpdateRoleStatusController {
  static async updateRoleStatus(req, res, next) {
    try {
      //  Obtener ID del parámetro
      const { id } = req.params;

      //  Obtener id_status del body
      const { id_status } = req.body;

      //  Validar que id_status esté presente
      if (id_status === undefined) {
        throw new ValidationError(
          "id_status es requerido",
          [{ message: "El campo id_status es requerido" }]
        );
      }

      // Validar que id_status sea número
      if (typeof id_status !== "number") {
        throw new ValidationError(
          "id_status debe ser un número",
          [{ message: "id_status debe ser 1 (Activo) o 2 (Inactivo)" }]
        );
      }

      // Ejecutar use case
      const result = await UpdateRoleStatusUseCase.execute(
        parseInt(id),
        id_status
      );

      //  Responder
      const estadoNuevo = id_status === 1 ? "Activo" : "Inactivo";
      res.status(200).json({
        success: true,
        message: `Rol actualizado a estado: ${estadoNuevo}`,
        data: result,
      });

    } catch (error) {
      next(error);
    }
  }
}