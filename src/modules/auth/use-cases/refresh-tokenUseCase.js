import { AuthRepository } from "../repositories/authRepository.js";
import {
  generateAccessToken,
  verifyRefreshToken,
} from "../../../config/jwt.js";
import { UnauthorizedError } from "../../../shared/errors/index.js";

export class RefreshTokenUseCase {
  static async execute({ refreshToken }) {
    // Verificar token JWT
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      throw new UnauthorizedError("Invalid refresh token");
    }

    // Verificar que existe en DB y no ha expirado
    const tokenRecord = await AuthRepository.findRefreshToken(refreshToken);
    if (!tokenRecord || new Date() > tokenRecord.expiration_date) {
      throw new UnauthorizedError("Refresh token expired or invalid");
    }

    // Generar nuevo access token
    const user = await AuthRepository.findUserById(decoded.id_user);
    if (!user) {
      throw new UnauthorizedError("User not found");
    }

    const newAccessToken = generateAccessToken(user.id_user, user.email);

    return {
      accessToken: newAccessToken,
    };
  }
}
