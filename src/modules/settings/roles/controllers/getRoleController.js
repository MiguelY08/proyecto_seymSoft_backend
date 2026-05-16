import { GetRoleUseCase } from "../use-cases/getRoleUseCase.js";

export class GetRoleController {
  static async getRole(req, res, next) {
    try {
      //  Obtener ID del parámetro
      const { id } = req.params;

      //  Ejecutar use case
      const result = await GetRoleUseCase.execute(parseInt(id));

      //  Responder
      res.status(200).json({
        success: true,
        message: "Rol obtenido correctamente",
        data: result,
      });

    } catch (error) {
      next(error);
    }
  }
}