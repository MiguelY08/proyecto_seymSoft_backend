import jwt from "jsonwebtoken";

const getRefreshTokenExpiresIn = () => {
  const configuredValue = process.env.JWT_REFRESH_EXPIRES || "7d";
  const normalizedValue = String(configuredValue).trim().toLowerCase();
  const match = normalizedValue.match(/^(\d+)([smhd])$/);

  if (!match) {
    return "7d";
  }

  return normalizedValue;
};

export const getRefreshTokenExpirationDate = () => {
  const expiresIn = getRefreshTokenExpiresIn();
  const match = expiresIn.match(/^(\d+)([smhd])$/);

  if (!match) {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 7);
    return expirationDate;
  }

  const amount = Number(match[1]);
  const unit = match[2];
  const expirationDate = new Date();

  switch (unit) {
    case "s":
      expirationDate.setSeconds(expirationDate.getSeconds() + amount);
      break;
    case "m":
      expirationDate.setMinutes(expirationDate.getMinutes() + amount);
      break;
    case "h":
      expirationDate.setHours(expirationDate.getHours() + amount);
      break;
    case "d":
    default:
      expirationDate.setDate(expirationDate.getDate() + amount);
      break;
  }

  return expirationDate;
};

/**
 * GENERAR ACCESS TOKEN (15 minutos)
 */
export const generateAccessToken = (id_user, email, tokenVersion = 0) => {
  return jwt.sign(
    {
      id_user, // Payload: datos dentro del token
      email,
      tokenVersion,
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
      expiresIn: getRefreshTokenExpiresIn(), // Respeta JWT_REFRESH_EXPIRES
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
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new Error("Refresh token expired");
    }

    throw new Error("Refresh token invalid");
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
