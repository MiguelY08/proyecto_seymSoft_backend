import { ProfileUseCase } from "../use-cases/profileUseCase.js";
import { authMiddleware } from "../../../shared/middlewares/authMiddleware.js";
<<<<<<< HEAD
=======
import { UserRepository } from "../../users/repositories/userRepository.js";
>>>>>>> 9c78c36f6047a654cf9c83306f577fa37f5d9c6e

export class ProfileController {
  static async getProfile(req, res, next) {
    try {
<<<<<<< HEAD
      const { id_user } = req.user;

      const user = await ProfileUseCase.execute(id_user);

      res.status(200).json({
        success: true,
        data: user,
      });
=======
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
 
>>>>>>> 9c78c36f6047a654cf9c83306f577fa37f5d9c6e
    } catch (error) {
      next(error);
    }
  }
}
