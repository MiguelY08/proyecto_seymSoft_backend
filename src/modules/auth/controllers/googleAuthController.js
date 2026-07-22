import { GoogleLoginUseCase } from "../use-cases/googleLoginUseCase.js";
import { env } from "../../../config/env.js";

export class GoogleAuthController {

  static async googleCallback(
    req,
    res,
    next
  ) {

    try {

      // ─────────────────────────────
      // Usuario autenticado por Passport
      // ─────────────────────────────

      const user = req.user;

      // ─────────────────────────────
      // Generar tokens
      // ─────────────────────────────

      const result =
        await GoogleLoginUseCase.execute(
          user
        );

      // ─────────────────────────────
      // Construir params
      // ─────────────────────────────

      const params =
        new URLSearchParams({

          accessToken:
            result.accessToken,

          refreshToken:
            result.refreshToken,

        });

      // ─────────────────────────────
      // Redirect frontend
      // ─────────────────────────────

      return res.redirect(

        `${env.FRONTEND_URL}/auth/callback?${params}`

      );

    }

    catch (error) {

      console.error(
        "Error en GoogleAuthController:",
        error
      );

        if (
        error.message ===
        "Tu cuenta se encuentra inactiva. Contacta al administrador."
      ) {
        return res.redirect(
          `${env.FRONTEND_URL}/login?error=account_inactive`
        );
      }

      return res.redirect(
        `${env.FRONTEND_URL}/login?error=google_auth_failed`
      );
    }

  }

}
