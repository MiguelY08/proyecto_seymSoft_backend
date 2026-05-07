import {
  generateAccessToken,
  generateRefreshToken,
} from "../../../../config/jwt.js";
import { AuthRepository } from "../repositories/authRepository.js";
import { UserMapper } from "../../users/mappers/userMapper.js";

export class GoogleLoginUseCase {
  static async execute(user) {
    try {
      //  Generar tokens
      const accessToken = generateAccessToken(
        user.id_user,
        user.email,
        user.token_version,
      );
      const refreshToken = generateRefreshToken(user.id_user);

      //  Calcular fecha de expiración del refresh token (7 días)
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 7);

      //  Guardar refresh token en BD
      await AuthRepository.createRefreshToken(
        user.id_user,
        refreshToken,
        expirationDate,
      );

      //  Mapear usuario sin mostrar contraseña
      const cleanUser = UserMapper.toCleanUser(user);

      return {
        accessToken,
        refreshToken,
        user: cleanUser,
      };
    } catch (error) {
      console.error("Error en GoogleLoginUseCase:", error);
      throw new Error("Error al procesar login con Google");
    }
  }
}
