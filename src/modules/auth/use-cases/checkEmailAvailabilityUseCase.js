import { AuthRepository } from "../repositories/authRepository.js";
import { normalizeEmail } from "../../../shared/utils/textNormalizer.js";

export class CheckEmailAvailabilityUseCase {
  static async execute(email) {
    const normalizedEmail = normalizeEmail(email);
    const user = await AuthRepository.findUserByEmail(normalizedEmail);

    return {
      email: normalizedEmail,
      exists: Boolean(user),
      available: !user,
    };
  }
}
