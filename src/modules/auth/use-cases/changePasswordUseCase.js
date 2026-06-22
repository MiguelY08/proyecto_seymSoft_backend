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
    const user =
      await AuthRepository.findUserById(
        idUser
      );

    if (!user) {
      throw new NotFoundError(
        "User not found"
      );
    }

    const isGoogleFirstLogin =
      user.id_google
        ? await comparePassword(
            "OAUTH_GOOGLE",
            user.pass_word
          )
        : false;

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

    const hashedNewPassword =
      await hashPassword(
        newPassword
      );

    await AuthRepository.updatePassword(
      idUser,
      hashedNewPassword
    );

    await AuthRepository.deleteRefreshTokensByUserId(
      idUser
    );

    return {
      message:
        "Password changed successfully",
    };
  }
}
