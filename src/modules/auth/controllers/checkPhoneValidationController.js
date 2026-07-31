import {
  checkPhoneSchema,
  getZodIssues,
} from "../validators/authValidators.js";
import { ValidationError } from "../../../shared/errors/validationError.js";
import { CheckPhoneValidationUseCase } from "../use-cases/checkPhoneValidationUseCase.js";

export class CheckPhoneValidationController {
  static async check(req, res, next) {
    try {
      const validationResult =
        checkPhoneSchema.safeParse(req.query);

      if (!validationResult.success) {
        throw new ValidationError(
          "Validation failed",
          getZodIssues(validationResult.error)
        );
      }

      const data =
        await CheckPhoneValidationUseCase.execute(
          validationResult.data
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
