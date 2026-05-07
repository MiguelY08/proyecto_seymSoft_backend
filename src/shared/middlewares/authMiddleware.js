import { verifyAccessToken } from "../../config/jwt.js";
import { AppError } from "../errors/appError.js";
import { prisma } from "../../config/prisma.js";

/**
 * MIDDLEWARE: VALIDAR AUTENTICACIÓN
 */
export const authMiddleware = async (req, res, next) => {
  try {
    // Obtener el header Authorization
    const authHeader = req.headers.authorization;

    // Validar que exista el header
    if (!authHeader) {
      throw new AppError("Token no proporcionado", 401);
    }

    // El formato debe ser: "Bearer {token}"
    // Dividimos por espacio y tomamos la segunda parte
    const parts = authHeader.split(" ");

    if (parts.length !== 2 || parts[0] !== "Bearer") {
      throw new AppError(
        "Formato de token inválido. Debe ser: Bearer {token}",
        401,
      );
    }

    const token = parts[1];

    // Validar el token JWT
    const decoded = verifyAccessToken(token);

    // Si el token no es válido o está expirado
    if (!decoded) {
      throw new AppError("Token inválido o expirado", 401);
    }

    const user = await prisma.users.findUnique({
      where: { id_user: decoded.id_user },
    });

    if (!user) {
      throw new AppError("Usuario no encontrado", 401);
    }

    if (user.token_version !== decoded.tokenVersion) {
      throw new AppError("Token inválido o expirado", 401);
    }

    // Token válido
    req.user = {
      id_user: user.id_user,
      email: user.email,
    };

    // Pasar al siguiente middleware o controller
    next();
  } catch (error) {
    // Si es un AppError, pasar tal como está
    if (error instanceof AppError) {
      return next(error);
    }

    // Si es otro error, convertir a AppError
    next(new AppError(error.message || "Error de autenticación", 401));
  }
};
