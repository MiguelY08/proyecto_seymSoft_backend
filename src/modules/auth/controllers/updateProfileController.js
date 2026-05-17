import { UpdateProfileUseCase } from "../use-cases/updateProfileUseCase.js";
import { updateProfileSchema } from "../validators/authValidators.js";
import { ValidationError } from "../../../shared/errors/index.js";

export class UpdateProfileController {
  static async updateProfile(req, res, next) {
    try {
      const { id_user } = req.user;
<<<<<<< HEAD
      const { phone, address, currentPassword, newPassword } = req.body;

      // Validar datos
      const validatedData = updateProfileSchema.parse({
        phone,
        address,
        currentPassword,
        newPassword,
      });

      const updatedUser = await UpdateProfileUseCase.execute(
=======
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
>>>>>>> 9c78c36f6047a654cf9c83306f577fa37f5d9c6e
        id_user,
        validatedData,
      );

<<<<<<< HEAD
      res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: updatedUser,
      });
    } catch (error) {
      if (error.name === "ZodError") {
        next(new ValidationError(error.errors));
=======
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
>>>>>>> 9c78c36f6047a654cf9c83306f577fa37f5d9c6e
      } else {
        next(error);
      }
    }
  }
}
