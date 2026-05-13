import { AuthRepository } from "../repositories/authRepository.js";
import { UnauthorizedError } from "../../../shared/errors/index.js";

export class LogoutUseCase {
  static async execute({ refreshToken }) {
    // Verificar que el token existe
    const tokenRecord = await AuthRepository.findRefreshToken(refreshToken);
    if (!tokenRecord) {
      throw new UnauthorizedError("Invalid refresh token");
    }

    // Eliminar el refresh token
    await AuthRepository.deleteRefreshToken(refreshToken);

    return { message: "Logged out successfully" };
  }
}
