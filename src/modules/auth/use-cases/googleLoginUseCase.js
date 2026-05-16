import { UserRepository } from "../../users/repositories/userRepository.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../../../config/jwt.js";
import { AuthRepository } from "../repositories/authRepository.js";

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
      // 1. Obtener usuario con rol y permisos
      const userWithRole = await UserRepository.getUserWithRole(user.idUser);

      // 2. Generar tokens
      const accessToken = generateAccessToken(
        user.idUser,
        user.email,
        user.token_version || 0,
      );
      const refreshToken = generateRefreshToken(user.idUser);

      // 3. Calcular fecha de expiración del refresh token (7 días)
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 7);

      // 4. Guardar refresh token en BD
      await AuthRepository.createRefreshToken(
        user.idUser,
        refreshToken,
        expirationDate,
      );

      // 5. Retornar con rol y permisos
      return {
        user: userWithRole.user,
        role: userWithRole.role,
        permissions: userWithRole.permissions,
        accessToken,
        refreshToken,
      };
    } catch (error) {
      console.error("Error en GoogleLoginUseCase:", error);
      throw new Error("Error al procesar login con Google");
    }
  }
}