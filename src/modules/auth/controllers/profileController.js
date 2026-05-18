import { ProfileUseCase } from "../use-cases/profileUseCase.js";
import { authMiddleware } from "../../../shared/middlewares/authMiddleware.js";

export class ProfileController {
  static async getProfile(req, res, next) {
    try {
      // El usuario viene del middleware authMiddleware
      const idUser = req.user?.id_user;
 
      if (!idUser) {
        throw new NotFoundError("Usuario no autenticado");
      }
 
      // Obtener usuario con rol y permisos
      const result = await UserRepository.getUserWithRole(idUser);
 
      if (!result || !result.user) {
        throw new NotFoundError("Usuario no encontrado");
      }
 
      // Retornar perfil del usuario
      return res.status(200).json({
        success: true,
        message: "Perfil obtenido exitosamente",
        data: {
          user: result.user,
          role: result.role,
          permissions: result.permissions,
        },
      });
 
    } catch (error) {
      next(error);
    }
  }
}
