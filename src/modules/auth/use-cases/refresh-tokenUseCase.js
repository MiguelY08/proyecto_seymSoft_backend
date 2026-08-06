import { AuthRepository } from "../repositories/authRepository.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../../../config/jwt.js";
import { AppError, UnauthorizedError } from "../../../shared/errors/index.js";

export class RefreshTokenUseCase {
  static async execute({ refresh_token }) {
    const refreshToken = refresh_token;

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (error) {
      const reason = error.message || "Refresh token invalid";
      console.error("[AUTH_REFRESH_FAILED]", {
        reason,
        userId: null,
        httpStatus: 401,
        cause: "jwt verification failed",
      });
      throw new UnauthorizedError(reason);
    }

    const tokenRecord = await AuthRepository.findRefreshToken(refreshToken);

    if (!tokenRecord) {
      console.error("[AUTH_REFRESH_FAILED]", {
        reason: "Refresh token invalid",
        userId: decoded?.id_user ?? null,
        httpStatus: 403,
        cause: "refresh token not found in persistence",
      });
      throw new AppError("Refresh token invalid", 403);
    }

    if (new Date() > tokenRecord.expiration_date) {
      console.error("[AUTH_REFRESH_FAILED]", {
        reason: "Refresh token expired",
        userId: decoded?.id_user ?? null,
        httpStatus: 401,
        cause: "stored refresh token expired",
      });
      throw new UnauthorizedError("Refresh token expired");
    }

    if (tokenRecord.id_user !== decoded.id_user) {
      console.error("[AUTH_REFRESH_FAILED]", {
        reason: "Refresh token invalid",
        userId: decoded?.id_user ?? null,
        httpStatus: 403,
        cause: "refresh token does not belong to the user",
      });
      throw new AppError("Refresh token invalid", 403);
    }

    const user = await AuthRepository.findUserById(decoded.id_user);
    if (!user) {
      console.error("[AUTH_REFRESH_FAILED]", {
        reason: "Refresh token invalid",
        userId: decoded?.id_user ?? null,
        httpStatus: 401,
        cause: "user not found for refresh token",
      });
      throw new UnauthorizedError("Refresh token invalid");
    }

    const newAccessToken = generateAccessToken(
      user.id_user,
      user.email,
      user.token_version,
    );

    return {
      accessToken: newAccessToken,
      refreshToken: refreshToken,
    };
  }
}
