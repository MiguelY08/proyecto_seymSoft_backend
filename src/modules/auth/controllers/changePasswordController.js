import { ChangePasswordUseCase } from "../use-cases/changePasswordUseCase.js";
import { ChangePasswordDto } from "../dtos/changePasswordDto.js";
import {
  changePasswordSchema,
  getZodIssues,
} from "../validators/authValidators.js";
import { ValidationError } from "../../../shared/errors/validationError.js";


export class ChangePasswordController {
  static async changePassword(req, res, next) {
    try {
      const validationResult = changePasswordSchema.safeParse(req.body);
      if (!validationResult.success) {
        throw new ValidationError(
          "Validation failed",
          getZodIssues(validationResult.error),
        );
      }

      const { id_user } = req.user;

      // ✅ Instancia el DTO
      const changePasswordDto = new ChangePasswordDto(validationResult.data);

      await ChangePasswordUseCase.execute(id_user, changePasswordDto);

      res.status(200).json({
        success: true,
        message: "Password changed successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}
