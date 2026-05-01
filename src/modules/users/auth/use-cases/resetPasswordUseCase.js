import { AuthRepository } from "../repositories/authRepository.js";
import { hashPassword } from "../../../../shared/utils/hashPassword.js";
import { ValidationError } from "../../../../shared/errors/validationError.js";

export class ResetPasswordUseCase {
  static async execute({ code, newPassword }) {
    const resetRecord = await AuthRepository.findPasswordReset(code);

    if (!resetRecord) {
      throw new ValidationError("Invalid or expired verification code");
    }

    if (resetRecord.used) {
      throw new ValidationError("Verification code has already been used");
    }

    if (new Date() > resetRecord.expiration_date) {
      throw new ValidationError("Reset token has expired");
    }

    const hashedPassword = await hashPassword(newPassword);
    await AuthRepository.updatePassword(resetRecord.id_user, hashedPassword);
    await AuthRepository.markPasswordResetUsed(code);
    await AuthRepository.deleteRefreshTokensByUserId(resetRecord.id_user);
  }
}
