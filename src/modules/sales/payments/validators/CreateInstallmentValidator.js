/**
 * Validator: CreateInstallmentValidator
 * Responsibility: Validate request payload for creating an installment using Zod.
 */
import { z } from "zod";

export default class CreateInstallmentValidator {
  static schema = z.object({});

  static validate(data) {
    return this.schema.parse(data);
  }
}
