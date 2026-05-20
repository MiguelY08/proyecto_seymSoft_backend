import { AuthRepository } from "../repositories/authRepository.js";
import { UserMapper } from "../../users/mappers/usersMapper.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../../../config/jwt.js";
import { hashPassword } from "../../../shared/utils/hashPassword.js";
import { ConflictError } from "../../../shared/errors/index.js";
import { prisma } from "../../../config/prisma.js";
import { EmailService } from "../../../shared/services/emailService.js";


export class RegisterUseCase {
  static async execute(userData) {
    // Verificar si el email ya existe
    const existingUser = await AuthRepository.findUserByEmail(
      userData.email,
    );

    if (existingUser) {
      throw new ConflictError(
        "User already exists with this email",
      );
    }


    // Hashear contraseña
    const hashedPassword = await hashPassword(
      userData.password,
    );

    // Crear usuario
    const newUser = await prisma.users.create({
      data: {
        full_name: userData.fullName,
        email: userData.email,
        pass_word: hashedPassword,
        phone: userData.phone || null,
        id_status: 1,
      },
    });

    // Generar tokens
    const accessToken = generateAccessToken(
      newUser.id_user,
      newUser.email,
      newUser.token_version,
    );

    const refreshToken = generateRefreshToken(
      newUser.id_user,
    );

    // Fecha expiración refresh token
    const expirationDate = new Date();
    expirationDate.setDate(
      expirationDate.getDate() + 7,
    );

    // Guardar refresh token
    await AuthRepository.createRefreshToken(
      newUser.id_user,
      refreshToken,
      expirationDate,
    );

    // Enviar welcome email (NO bloqueante)
    try {
      await EmailService.sendLandingWelcomeEmail(
        newUser.email,
        newUser.full_name,
      );

      console.log(
        ` Welcome email sent to ${newUser.email}`,
      );
    } catch (emailError) {
      console.error(
        `❌Failed to send welcome email to ${newUser.email}:`,
        emailError.message,
      );
    }

    // Usuario limpio
    const cleanUser =
      UserMapper.toCleanUser(newUser);

    return {
      user: cleanUser,
      accessToken,
      refreshToken,
    };
  }
}
