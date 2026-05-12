import { AuthRepository } from "../repositories/authRepository.js";
import { UserMapper } from "../../users/mappers/usersMapper.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../../../config/jwt.js";
import { hashPassword } from "../../../shared/utils/hashPassword.js";
import { ConflictError } from "../../../shared/errors/index.js";
import { prisma } from "../../../config/prisma.js";

export class RegisterUseCase {
  static async execute(userData) {
    // Verificar si el email ya existe
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
        full_name: userData.fullName,
        email: userData.email,
        pass_word: hashedPassword,
        phone: userData.phone || null,
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
      },
    });

    // Generar tokens
    const accessToken = generateAccessToken(newUser.id_user, newUser.email);
    const refreshToken = generateRefreshToken(newUser.id_user);

    // Calcular fecha de expiración del refresh token (7 días)
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 7);

    // Guardar refresh token en DB
    await AuthRepository.createRefreshToken(
      newUser.id_user,
      refreshToken,
      expirationDate,
    );

    // Mapear usuario limpio (sin contraseña)
    const cleanUser = UserMapper.toCleanUser(newUser);

    return {
      user: cleanUser,
      accessToken,
      refreshToken,
    };
  }
}
