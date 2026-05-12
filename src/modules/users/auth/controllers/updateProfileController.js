import { UpdateProfileUseCase } from "../use-cases/updateProfileUseCase.js";
import { updateProfileSchema } from "../validators/authValidators.js";
import { ValidationError } from "../../../../shared/errors/index.js";

export class UpdateProfileController {
  static async updateProfile(req, res, next) {
    try {
      const { id_user } = req.user;
      const {
        email,
        pass_word,
        password,
        current_password,
        confirm_password,
        phone,
      } = req.body;

      // Validar datos
      const validatedData = updateProfileSchema.parse({
        email,
        pass_word: pass_word || password,
        current_password,
        confirm_password,
        phone,
      });

      const { user, requiresReLogin } = await UpdateProfileUseCase.execute(
        id_user,
        validatedData,
      );

      const response = {
        success: true,
        message: "Profile updated successfully",
        data: user,
      };

      if (requiresReLogin) {
        response.requiresReLogin = true;
      }

      res.status(200).json(response);
    } catch (error) {
      if (error.name === "ZodError") {
        next(new ValidationError("Validation failed", error.errors));
      } else {
        next(error);
      }
    }
  }
}
