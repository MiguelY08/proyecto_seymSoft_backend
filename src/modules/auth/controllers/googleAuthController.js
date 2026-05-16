import { GoogleLoginUseCase } from "../use-cases/googleLoginUseCase.js";

export class GoogleAuthController {
    static async googleCallback(req, res, next) {
        try {
            const user = req.user; // Usuario autenticado por Passport
            const result = await GoogleLoginUseCase.execute(user);
            const redirectUrl = `${process.env.FRONTEND_URL}/auth-callback?accessToken=${result.accessToken}&refreshToken=${result.refreshToken}`;
          
            res.redirect(redirectUrl);
        } catch (error) {
            console.error('Error en GoogleAuthController:', error);
            res.redirect(`${process.env.FRONTEND_URL}/login?error=google_auth_failed`);
        }
    }
}