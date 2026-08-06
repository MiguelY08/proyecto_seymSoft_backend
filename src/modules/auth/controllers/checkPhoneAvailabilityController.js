import {
  checkPhoneSchema,
  getZodIssues,
} from "../validators/authValidators.js";
import { ValidationError } from "../../../shared/errors/validationError.js";
import { CheckPhoneAvailabilityUseCase } from "../use-cases/checkPhoneAvailabilityUseCase.js";

export class CheckPhoneAvailabilityController {
  static async check(req, res, next) {
    try {
      const validationResult = checkPhoneSchema.safeParse(req.query);

      if (!validationResult.success) {
        throw new ValidationError(
          "Validation failed",
          getZodIssues(validationResult.error),
        );
      }

      const data = await CheckPhoneAvailabilityUseCase.execute(
        validationResult.data.phone,
      );

      return res.status(200).json({
        success: true,
        data,
        exists: data.exists,
        available: data.available,
        phone: data.phone,
        context: validationResult.data.context,
      });
    } catch (error) {
      next(error);
    }
  }
}
