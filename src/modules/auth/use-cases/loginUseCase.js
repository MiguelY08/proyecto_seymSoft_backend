import { AuthRepository } from "../repositories/authRepository.js";
import { UserMapper } from "../../users/mappers/usersMapper.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../../../config/jwt.js";
import { comparePassword } from "../../../shared/utils/hashPassword.js";
import {
  UnauthorizedError,
  NotFoundError,
} from "../../../shared/errors/index.js";

export class LoginUseCase {
  static async execute({ email, password }) {
    // Buscar usuario por email
    const user = await AuthRepository.findUserByEmail(email);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Verificar contraseña
    const isPasswordValid = await comparePassword(password, user.pass_word);
    if (!isPasswordValid) {
      throw new UnauthorizedError("Invalid credentials");
    }

    // Generar tokens
    const accessToken = generateAccessToken(user.id_user, user.email);
    const refreshToken = generateRefreshToken(user.id_user);

    // Calcular fecha de expiración del refresh token (7 días)
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 7);

    // Guardar refresh token en DB
    await AuthRepository.createRefreshToken(
      user.id_user,
      refreshToken,
      expirationDate,
    );

    // Mapear usuario limpio
    const cleanUser = UserMapper.toCleanUser(user);

    return {
      user: cleanUser,
      accessToken,
      refreshToken,
    };
  }
}
