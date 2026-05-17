import { AuthRepository } from "../repositories/authRepository.js";
<<<<<<< HEAD
import { UserMapper } from "../../users/mappers/usersMapper.js";
=======
import { UserRepository } from "../../users/repositories/userRepository.js";
>>>>>>> 9c78c36f6047a654cf9c83306f577fa37f5d9c6e
import {
  generateAccessToken,
  generateRefreshToken,
} from "../../../config/jwt.js";
import { comparePassword } from "../../../shared/utils/hashPassword.js";
import {
  UnauthorizedError,
  NotFoundError,
} from "../../../shared/errors/index.js";

<<<<<<< HEAD
export class LoginUseCase {
  static async execute({ email, password }) {
    // Buscar usuario por email
    const user = await AuthRepository.findUserByEmail(email);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Verificar contraseña
    const isPasswordValid = await comparePassword(password, user.pass_word);
    if (!isPasswordValid) {
      throw new UnauthorizedError("Invalid credentials");
    }

    // Generar tokens
    const accessToken = generateAccessToken(user.id_user, user.email);
    const refreshToken = generateRefreshToken(user.id_user);

    // Calcular fecha de expiración del refresh token (7 días)
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 7);

    // Guardar refresh token en DB
    await AuthRepository.createRefreshToken(
      user.id_user,
      refreshToken,
      expirationDate,
    );

    // Mapear usuario limpio
    const cleanUser = UserMapper.toCleanUser(user);

    return {
      user: cleanUser,
      accessToken,
      refreshToken,
    };
  }
}
=======
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
>>>>>>> 9c78c36f6047a654cf9c83306f577fa37f5d9c6e
