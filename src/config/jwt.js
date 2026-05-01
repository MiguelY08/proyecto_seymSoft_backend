import jwt from "jsonwebtoken";

/**
 * GENERAR ACCESS TOKEN (15 minutos)
 */
export const generateAccessToken = (id_user, email) => {
  return jwt.sign(
    {
      id_user, // Payload: datos dentro del token
      email,
    },
    process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET, // Secret para firmar
    {
      expiresIn: process.env.JWT_ACCESS_EXPIRES || "15m", // Expira en 15 min
    },
  );
};

/**
 * GENERAR REFRESH TOKEN (7 días)
 */
export const generateRefreshToken = (id_user) => {
  return jwt.sign(
    {
      id_user, // Solo guardamos el ID
      type: "refresh",
    },
    process.env.JWT_REFRESH_SECRET, // Secret diferente al ACCESS
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRES || "7d", // Expira en 7 días
    },
  );
};

/**
 * VALIDAR ACCESS TOKEN
 */
export const verifyAccessToken = (token) => {
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET,
    );
    return decoded; // Devuelve { id_user, email, iat, exp }
  } catch (error) {
    // Token inválido, expirado o corrupto
    console.error("JWT Error:", error.message);
    return null;
  }
};

/**
 * VALIDAR REFRESH TOKEN
 */
export const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    return decoded; // Devuelve { id_user, type, iat, exp }
  } catch (error) {
    console.error("Refresh Token Error:", error.message);
    return null;
  }
};

//  * DECODIFICAR TOKEN (sin validar)

export const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
};
