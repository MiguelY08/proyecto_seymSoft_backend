import { verifyRefreshToken } from "../../config/jwt.js";
import { AppError } from "../errors/appError.js";
import { prisma } from "../../config/prisma.js";

/**
 * MIDDLEWARE: VALIDAR REFRESH TOKEN
 */
export const refreshTokenMiddleware = async (req, res, next) => {
  try {
    // El refresh token viene en el body
    const { refreshToken } = req.body;

    // Validar que se envíe el refresh token
    if (!refreshToken) {
      throw new AppError("Refresh token no proporcionado", 401);
    }

    // Validar que el refresh token sea válido (JWT válido y no expirado)
    const decoded = verifyRefreshToken(refreshToken);

    if (!decoded) {
      throw new AppError("Refresh token inválido o expirado", 401);
    }

    const { id_user } = decoded;

    //  IMPORTANTE: Verificar que el refresh token exista en BD
    // Esto previene que se usen tokens revocados (después de logout)
    const tokenInDB = await prisma.refresh_tokens.findUnique({
      where: {
        token: refreshToken,
      },
    });

    // Si el token no existe en BD, fue revocado (usuario hizo logout)
    if (!tokenInDB) {
      throw new AppError("Refresh token ha sido revocado", 401);
    }

    // Validar que el token en BD corresponda al usuario
    if (tokenInDB.id_user !== id_user) {
      throw new AppError("Token no válido para este usuario", 401);
    }

    // Validar que no haya expirado
    if (new Date() > tokenInDB.expiration_date) {
      throw new AppError("Refresh token ha expirado", 401);
    }

    //  Token válido
    // Adjuntar id_user a req para que el controller lo use
    req.user = { id_user };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }

    next(new AppError(error.message || "Error validando refresh token", 401));
  }
};
