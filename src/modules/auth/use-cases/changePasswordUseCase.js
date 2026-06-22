import { AuthRepository } from "../repositories/authRepository.js";
import {
  comparePassword,
  hashPassword,
} from "../../../shared/utils/hashPassword.js";
import {
  NotFoundError,
  UnauthorizedError,
} from "../../../shared/errors/index.js";

export class ChangePasswordUseCase {
  static async execute(
    idUser,
    {
      currentPassword,
      newPassword,
    }
  ) {

    // Obtener usuario
    const user =
      await AuthRepository.findUserById(
        idUser
      );

    if (!user) {
      throw new NotFoundError(
        "User not found"
      );
    }



    // Detectar primer acceso Google
    const isGoogleFirstLogin =
      user.id_google
        ? await comparePassword(
            "OAUTH_GOOGLE",
            user.pass_word
          )
        : false;

    // ─────────────────────────────
    // USUARIO NORMAL
    // ─────────────────────────────

    if (!isGoogleFirstLogin) {

      if (!currentPassword) {
        throw new UnauthorizedError(
          "La contraseña actual es requerida"
        );
      }

      const isCurrentPasswordValid =
        await comparePassword(
          currentPassword,
          user.pass_word
        );

      if (!isCurrentPasswordValid) {
        throw new UnauthorizedError(
          "La contraseña actual es incorrecta"
        );
      }

    }

    // ─────────────────────────────
    // VALIDAR QUE NO SEA LA MISMA
    // ─────────────────────────────

    const isSamePassword =
      await comparePassword(
        newPassword,
        user.pass_word
      );

    if (isSamePassword) {
      throw new UnauthorizedError(
        "La nueva contraseña debe ser diferente a la actual"
      );
    }

    // ─────────────────────────────
    // GENERAR NUEVO HASH
    // ─────────────────────────────

    const hashedNewPassword =
      await hashPassword(
        newPassword
      );



    // ─────────────────────────────
    // ACTUALIZAR CONTRASEÑA
    // ─────────────────────────────

    await AuthRepository.updatePassword(
      idUser,
      hashedNewPassword
    );

    // ─────────────────────────────
    // INVALIDAR TOKENS
    // ─────────────────────────────

    await AuthRepository.deleteRefreshTokensByUserId(
      idUser
    );

    return {
      message:
        "Password changed successfully",
    };
  }
}
