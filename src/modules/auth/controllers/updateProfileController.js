import { UpdateProfileUseCase } from "../use-cases/updateProfileUseCase.js";
import { updateProfileSchema } from "../validators/authValidators.js";
import { ValidationError } from "../../../shared/errors/index.js";
import { UserRepository } from "../../users/repositories/userRepository.js";

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
      const userWithRole = await UserRepository.getUserWithRole(id_user);

      const response = {
        success: true,
        message: "Profile updated successfully",
        data: {
          user: userWithRole?.user ?? user,
          role: userWithRole?.role ?? null,
          permissions: userWithRole?.permissions ?? [],
          client: userWithRole?.client ?? null,
        },
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
