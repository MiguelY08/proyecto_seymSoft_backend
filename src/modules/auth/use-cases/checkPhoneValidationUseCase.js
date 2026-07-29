import {
  isNumericString,
  normalizeNumericString,
} from "../../../shared/utils/textNormalizer.js";
import { UserRepository } from "../../users/repositories/userRepository.js";

export class CheckPhoneValidationUseCase {
  static async execute({ phone, context = "client" }) {
    const normalizedPhone = normalizeNumericString(phone);
    const isNumeric = isNumericString(normalizedPhone);
    const hasValidLength =
      context === "client"
        ? /^\d{7,10}$/.test(normalizedPhone)
        : isNumeric;
    const valid = isNumeric && hasValidLength;
    const user = valid
      ? await UserRepository.findByPhone(normalizedPhone)
      : null;

    return {
      phone: normalizedPhone,
      context,
      valid,
      isNumeric,
      hasValidLength,
      exists: Boolean(user),
      available: !user,
    };
  }
}
