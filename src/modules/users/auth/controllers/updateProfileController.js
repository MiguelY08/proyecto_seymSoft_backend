import { UpdateProfileUseCase } from "../use-cases/updateProfileUseCase.js";
import { updateProfileSchema } from "../validators/authValidators.js";
import { ValidationError } from "../../../../shared/errors/index.js";

export class UpdateProfileController {
  static async updateProfile(req, res, next) {
    try {
      const { id_user } = req.user;
      const { phone, address, currentPassword, newPassword } = req.body;

      // Validar datos
      const validatedData = updateProfileSchema.parse({
        phone,
        address,
        currentPassword,
        newPassword,
      });

      const updatedUser = await UpdateProfileUseCase.execute(
        id_user,
        validatedData,
      );

      res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: updatedUser,
      });
    } catch (error) {
      if (error.name === "ZodError") {
        next(new ValidationError(error.errors));
      } else {
        next(error);
      }
    }
  }
}
