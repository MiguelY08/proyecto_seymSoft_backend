import { UpdateProfileUseCase } from "../use-cases/updateProfileUseCase.js";
import {
  getZodIssues,
  updateProfileSchema,
} from "../validators/authValidators.js";
import { ValidationError } from "../../../shared/errors/index.js";
import { UserRepository } from "../../users/repositories/userRepository.js";

export class UpdateProfileController {
  static async updateProfile(req, res, next) {
    try {
      const { id_user } = req.user;
      const {
        email,
        full_name,
        fullName,
        pass_word,
        password,
        current_password,
        confirm_password,
        address,
        phone,
      } = req.body;

      // Validar datos
      const validatedData = updateProfileSchema.parse({
        email,
        full_name: full_name ?? fullName,
        pass_word: pass_word || password,
        current_password,
        confirm_password,
        address,
        phone,
      });

      const { user, requiresReLogin, unchangedFields } =
        await UpdateProfileUseCase.execute(
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
        response.message =
          "Profile updated successfully. Please sign in again for security.";
      }

      if (unchangedFields && Object.keys(unchangedFields).length > 0) {
        response.data.unchangedFields = unchangedFields;
      }

      res.status(200).json(response);
    } catch (error) {
      if (error.name === "ZodError") {
        next(new ValidationError("Validation failed", getZodIssues(error)));
      } else {
        next(error);
      }
    }
  }
}
