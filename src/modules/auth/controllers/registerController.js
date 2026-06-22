import { RegisterUseCase } from "../use-cases/registerUseCase.js";
import { RegisterDto } from "../dtos/registerDto.js";
import { AuthResponseDto } from "../dtos/authResponseDto.js";
import { getZodIssues, registerSchema } from "../validators/authValidators.js";
import { ValidationError } from "../../../shared/errors/validationError.js";

export class RegisterController {
  static async register(req, res, next) {
    try {
      // Validar entrada
      const validationResult = registerSchema.safeParse(req.body);
      if (!validationResult.success) {
        throw new ValidationError(
          "Validation failed",
          getZodIssues(validationResult.error),
        );
      }

      const registerData = new RegisterDto(validationResult.data);

      // Ejecutar caso de uso
      const result = await RegisterUseCase.execute(registerData);

      // Responder
      const response = new AuthResponseDto(result);
      res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: response,
      });
    } catch (error) {
      next(error);
    }
  }
}
