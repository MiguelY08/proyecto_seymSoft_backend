/**
 * Validator: GenerateInterestValidator
 * Responsibility: Validate request payload for generating interest using Zod.
 */
import { z } from "zod";

export default class GenerateInterestValidator {
  static schema = z.object({});

  static validate(data) {
    return this.schema.parse(data);
  }
}
