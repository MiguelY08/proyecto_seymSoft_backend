/**
 * Validator: CancelInstallmentValidator
 * Responsibility: Validate request payload for cancelling an installment using Zod.
 */
import { z } from "zod";

export default class CancelInstallmentValidator {
  static schema = z.object({});

  static validate(data) {
    return this.schema.parse(data);
  }
}
