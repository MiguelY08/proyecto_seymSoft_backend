import {
  checkEmailSchema,
  getZodIssues,
} from "../validators/authValidators.js";
import { ValidationError } from "../../../shared/errors/validationError.js";
import { CheckEmailAvailabilityUseCase } from "../use-cases/checkEmailAvailabilityUseCase.js";

export class CheckEmailAvailabilityController {
  static async check(req, res, next) {
    try {
      const validationResult =
        checkEmailSchema.safeParse(req.query);

      if (!validationResult.success) {
        throw new ValidationError(
          "Validation failed",
          getZodIssues(validationResult.error)
        );
      }

      const data =
        await CheckEmailAvailabilityUseCase.execute(
          validationResult.data.email
        );

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }
}
