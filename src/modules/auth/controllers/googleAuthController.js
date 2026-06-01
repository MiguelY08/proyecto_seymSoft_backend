import { GoogleLoginUseCase } from "../use-cases/googleLoginUseCase.js";

export class GoogleAuthController {
  static async googleCallback(req, res, next) {
    try {
      const user = req.user; // Usuario autenticado por Passport
      const result = await GoogleLoginUseCase.execute(user);

      // ✅ FIX: Pasar role en la URL para que AuthCallback sepa a dónde redirigir
      const params = new URLSearchParams({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        role: result.role ?? "",               // null → string vacío
      });

      res.redirect(`${process.env.FRONTEND_URL}/auth-callback?${params}`);

    } catch (error) {
      console.error('Error en GoogleAuthController:', error);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=google_auth_failed`);
    }
  }
}