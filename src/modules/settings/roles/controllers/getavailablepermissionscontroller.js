import { GetAvailablePermissionsUseCase } from "../use-cases/getAvailablePermissionsUseCase.js";

export class GetAvailablePermissionsController {
  static async getAvailablePermissions(req, res, next) {
    try {

      const result =
        await GetAvailablePermissionsUseCase.execute();

      return res.status(200).json({
        success: true,
        message: "Permisos disponibles obtenidos correctamente",
        data: result
      });

    } catch(error){
      next(error);
    }
  }
}