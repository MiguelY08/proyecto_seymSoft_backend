import { DeleteRoleUseCase } from "../use-cases/deleteRoleUseCase.js";


export class DeleteRoleController {
  static async deleteRole(req, res, next) {
    try {
      //  Obtener ID del parámetro
      const { id } = req.params;

      //  Ejecutar use case
      const result = await DeleteRoleUseCase.execute(parseInt(id));

      // Responder con código 200 OK
      res.status(200).json({
        success: true,
        message: result.message,
        data: result,
      });

    } catch (error) {
      next(error);
    }
  }
}