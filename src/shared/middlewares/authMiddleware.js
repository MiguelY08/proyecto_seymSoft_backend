
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

    if (!decoded) {
      throw new AppError(
        "Token inválido o expirado",
        401,
      );
    }

    // Buscar usuario
    const user = await prisma.users.findUnique({
      where: {
        id_user: decoded.id_user,
      },
    });

    // Verificar que exista
    if (!user) {
      throw new AppError(
        "Usuario no encontrado",
        401,
      );
    }

    // Estados permitidos para acceder al sistema
    const ALLOWED_LOGIN_STATUSES = [1];

    // Verificar que esté activo
    if (
      !ALLOWED_LOGIN_STATUSES.includes(
        user.id_status
      )
    ) {
      throw new AppError(
        "Tu cuenta se encuentra inactiva. Contacta al administrador.",
        401,
      );
    }

    // Verificar token version
    if (
      user.token_version !==
      decoded.tokenVersion
    ) {
      throw new AppError(
        "Token inválido o expirado",
        401,
      );
    }

    // Token válido
    req.user = {
      id_user: user.id_user,
      email: user.email,
    };

    next();

  } catch (error) {

    if (error instanceof AppError) {
      return next(error);
    }

    next(
      new AppError(
        error.message ||
          "Error de autenticación",
        401,
      ),
    );
  }
};

