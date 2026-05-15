import { LoginUseCase } from "../use-cases/loginUseCase.js";
import { LoginDto } from "../dtos/loginDto.js";
import { AuthResponseDto } from "../dtos/authResponseDto.js";
import { loginSchema } from "../validators/authValidators.js";
import { ValidationError } from "../../../../shared/errors/index.js";

export class LoginController {
  static async login(req, res, next) {
    try {
      // Validar input
      const validation = loginSchema.safeParse(req.body);
      if (!validation.success) {
        throw new ValidationError("Invalid input data");
      }

      const loginDto = new LoginDto(validation.data);

      // Ejecutar caso de uso
      const result = await LoginUseCase.execute(loginDto);

      const responseDto = new AuthResponseDto(result);

      res.status(200).json({
        success: true,
        data: responseDto,
      });
    } catch (error) {
      next(error);
    }
  }
}
