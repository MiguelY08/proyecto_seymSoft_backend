import { AuthRepository } from "../repositories/authRepository.js";
import { UserRepository } from "../../users/repositories/userRepository.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../../../config/jwt.js";
import { comparePassword } from "../../../shared/utils/hashPassword.js";
import {
  UnauthorizedError,
  NotFoundError,
} from "../../../shared/errors/index.js";

/**
 * LOGIN USE CASE - ACTUALIZADO
 * 
 * Ahora retorna:
 * - user: datos del usuario
 * - role: rol del usuario (null si no es empleado)
 * - permissions: permisos del rol ([] si no es empleado)
 * - accessToken
 * - refreshToken
 */
export class LoginUseCase {
  static async execute({ email, password }) {
    try {
      // 1. Buscar usuario por email
      const user = await AuthRepository.findUserByEmail(email);
      if (!user) {
        throw new NotFoundError("Usuario no encontrado");
      }

      // 2. Verificar contraseña
      const isPasswordValid = await comparePassword(password, user.pass_word);
      if (!isPasswordValid) {
        throw new UnauthorizedError("Credenciales inválidas");
      }

      // 3. Obtener usuario con rol y permisos
      const userWithRole = await UserRepository.getUserWithRole(user.id_user);

      // 4. Generar tokens
      const accessToken = generateAccessToken(
        user.id_user,
        user.email,
        user.token_version,
      );
      const refreshToken = generateRefreshToken(user.id_user);

      // 5. Calcular fecha de expiración del refresh token (7 días)
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 7);

      // 6. Guardar refresh token en BD
      await AuthRepository.createRefreshToken(
        user.id_user,
        refreshToken,
        expirationDate,
      );

      // 7. Retornar con rol y permisos
      return {
        user: userWithRole.user,
        role: userWithRole.role,
        permissions: userWithRole.permissions,
        accessToken,
        refreshToken,
      };
    } catch (error) {
      throw error;
    }
  }
}