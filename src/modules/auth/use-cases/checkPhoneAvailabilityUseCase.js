import { AuthRepository } from "../repositories/authRepository.js";
import { normalizeNumericString } from "../../../shared/utils/textNormalizer.js";

export class CheckPhoneAvailabilityUseCase {
  static async execute(phone) {
    const normalizedPhone = normalizeNumericString(phone);
    const user = await AuthRepository.findUserByPhone(normalizedPhone);

    return {
      phone: normalizedPhone,
      exists: Boolean(user),
      available: !user,
    };
  }
}
