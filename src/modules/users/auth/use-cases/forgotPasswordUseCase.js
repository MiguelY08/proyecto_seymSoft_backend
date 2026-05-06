import { AuthRepository } from "../repositories/authRepository.js";
import { EmailService } from "../../../../shared/services/emailService.js";
import crypto from "crypto";

export class ForgotPasswordUseCase {
  static async execute(email) {
    const user = await AuthRepository.findUserByEmail(email);

    // Por seguridad, no revelamos si el email existe o no.
    if (!user) {
      return { message: "If the email exists, a reset link has been sent" };
    }

    const verificationCode = crypto.randomInt(100000, 1000000).toString();
    const expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() + 1);

    await AuthRepository.createPasswordReset(
      user.id_user,
      verificationCode,
      expirationDate,
    );

    await EmailService.sendPasswordResetEmail(
      user.email,
      verificationCode,
      user.full_name,
    );

    return { message: "If the email exists, a reset link has been sent" };
  }
}
