import { ListRolesUseCase } from "../use-cases/listRoleUseCase.js";

export class ListRolesController {
  static async listRoles(req, res, next) {
    try {
      //  Obtener parámetro include_admin de query
      const includeAdmin = req.query.include_admin === "true";

      //  Ejecutar use case
      const result = await ListRolesUseCase.execute(includeAdmin);

      //  Responder
      res.status(200).json({
        success: true,
        message: "Roles listados correctamente",
        data: result,
        total: result.length,
      });

    } catch (error) {
      next(error);
    }
  }
}