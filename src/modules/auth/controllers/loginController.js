import { LoginUseCase } from "../use-cases/loginUseCase.js";
import { LoginDto } from "../dtos/loginDto.js";
import { loginSchema } from "../validators/authValidators.js";
import { ValidationError } from "../../../shared/errors/index.js";

export class LoginController {

  static async login(req, res, next) {
    try {

      const validation =
        loginSchema.safeParse(req.body);

      if (!validation.success) {
        throw new ValidationError(
          "Validation failed",
          validation.error.errors
        );
      }

      const loginDto =
        new LoginDto(validation.data);

      const result =
        await LoginUseCase.execute(
          loginDto
        );

      return res.status(200).json({
        success: true,
        data: result
      });

    } catch(error){
      next(error);
    }
  }

}