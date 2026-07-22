import { UserRepository } from "../../users/repositories/userRepository.js";
import { NotFoundError } from "../../../shared/errors/index.js";

export class ProfileController {
  static async getProfile(req, res, next) {
    try {
      // El usuario autenticado viene en req.user
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
          client:result.client,
          requiresPasswordSetup:result.requiresPasswordSetup
        },
      });
 
    } catch (error) {
      next(error);
    }
  }
}
