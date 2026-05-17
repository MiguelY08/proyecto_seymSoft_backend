import { AuthRepository } from "../repositories/authRepository.js";
import { UserMapper } from "../../users/mappers/usersMapper.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../../../config/jwt.js";
import { hashPassword } from "../../../shared/utils/hashPassword.js";
import { ConflictError } from "../../../shared/errors/index.js";
import { prisma } from "../../../config/prisma.js";
<<<<<<< HEAD
=======
import { EmailService } from "../../../shared/services/emailService.js";

>>>>>>> 9c78c36f6047a654cf9c83306f577fa37f5d9c6e

export class RegisterUseCase {
  static async execute(userData) {
    // Verificar si el email ya existe
<<<<<<< HEAD
    const existingUser = await AuthRepository.findUserByEmail(userData.email);
    if (existingUser) {
      throw new ConflictError("User already exists with this email");
    }

    // Hashear la contraseña
    const hashedPassword = await hashPassword(userData.password);

    // Crear el usuario en la base de datos
    const newUser = await prisma.users.create({
      data: {
        doc_type: userData.docType,
        doc_number: userData.docNumber,
=======
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
>>>>>>> 9c78c36f6047a654cf9c83306f577fa37f5d9c6e
        full_name: userData.fullName,
        email: userData.email,
        pass_word: hashedPassword,
        phone: userData.phone || null,
<<<<<<< HEAD
        id_status: 1, // Status activo por defecto
      },
      include: {
        employees: {
          include: {
            employee_roles: {
              include: {
                roles: true,
              },
            },
          },
        },
=======
        id_status: 1,
>>>>>>> 9c78c36f6047a654cf9c83306f577fa37f5d9c6e
      },
    });

    // Generar tokens
<<<<<<< HEAD
    const accessToken = generateAccessToken(newUser.id_user, newUser.email);
    const refreshToken = generateRefreshToken(newUser.id_user);

    // Calcular fecha de expiración del refresh token (7 días)
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 7);

    // Guardar refresh token en DB
=======
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
>>>>>>> 9c78c36f6047a654cf9c83306f577fa37f5d9c6e
    await AuthRepository.createRefreshToken(
      newUser.id_user,
      refreshToken,
      expirationDate,
    );

<<<<<<< HEAD
    // Mapear usuario limpio (sin contraseña)
    const cleanUser = UserMapper.toCleanUser(newUser);
=======
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
>>>>>>> 9c78c36f6047a654cf9c83306f577fa37f5d9c6e

    return {
      user: cleanUser,
      accessToken,
      refreshToken,
    };
  }
<<<<<<< HEAD
}
=======
}
>>>>>>> 9c78c36f6047a654cf9c83306f577fa37f5d9c6e
