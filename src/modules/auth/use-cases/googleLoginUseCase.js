import { UserRepository } from "../../users/repositories/userRepository.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../../../config/jwt.js";
import { AuthRepository } from "../repositories/authRepository.js";
import {
  UnauthorizedError,
  NotFoundError,
} from "../../../shared/errors/index.js";

/**
 * GOOGLE LOGIN USE CASE - ACTUALIZADO
 * 
 * Ahora retorna:
 * - user: datos del usuario
 * - role: rol del usuario (null si no es empleado)
 * - permissions: permisos del rol ([] si no es empleado)
 * - accessToken
 * - refreshToken
 */

export class GoogleLoginUseCase {
  static async execute(user) {
    try {
      // 1. Obtener token_version de BD
      const userFromDB = await UserRepository.findById(user.idUser);
      
      if (!userFromDB) {
        throw new NotFoundError("Usuario no encontrado");
      }

      const ALLOWED_LOGIN_STATUSES = [1];
  
      if (
        !ALLOWED_LOGIN_STATUSES.includes(
          userFromDB.id_status
        )
      ) {
        throw new UnauthorizedError(
          "Tu cuenta se encuentra inactiva. Contacta al administrador."
        );
      }

      // 2. Obtener usuario con rol y permisos
      const userWithRole = await UserRepository.getUserWithRole(user.idUser);

      // 3. Generar token con token_version CORRECTO de BD
      const accessToken = generateAccessToken(
        user.idUser,
        user.email,
        userFromDB.token_version  //  Ahora tiene el valor correcto
      );

      const refreshToken = generateRefreshToken(user.idUser);
      
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 7);

      await AuthRepository.createRefreshToken(
        user.idUser,
        refreshToken,
        expirationDate,
      );

      return {
        user: userWithRole.user,
        role: userWithRole.role,
        permissions: userWithRole.permissions,
        accessToken,
        refreshToken,
      };
    } catch (error) {
      console.error("Error en GoogleLoginUseCase:", error);
      throw  error ;
    }
  }
}