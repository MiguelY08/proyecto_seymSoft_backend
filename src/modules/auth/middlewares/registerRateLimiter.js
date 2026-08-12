import { rateLimit } from "express-rate-limit";

export const registerRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Demasiadas solicitudes de registro. Intenta nuevamente mas tarde.",
    errorCode: "TOO_MANY_REQUESTS",
  },
});
