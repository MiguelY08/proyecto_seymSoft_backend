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
import {
  normalizeEmail,
  normalizeName,
  normalizeNumericString,
} from "../../../shared/utils/textNormalizer.js";

const sendLandingWelcomeEmailInBackground = ({
  email,
  fullName,
}) => {
  setImmediate(async () => {
    try {
      await EmailService.sendLandingWelcomeEmail(
        email,
        fullName,
      );

      console.log(
        ` Welcome email sent to ${email}`,
      );
    } catch (emailError) {
      console.error(
        `[RegisterUseCase] Failed to send welcome email to ${email}:`,
        {
          message: emailError.message,
          code: emailError.code,
          command: emailError.command,
          responseCode: emailError.responseCode,
        },
      );
    }
  });
};

export class RegisterUseCase {
  static async execute(userData) {
    const email = normalizeEmail(userData.email);
    const fullName = normalizeName(userData.fullName);
    const phone =
      userData.phone !== undefined && userData.phone !== null
        ? BigInt(normalizeNumericString(userData.phone))
        : null;

    const existingUser = await AuthRepository.findUserByEmail(
      email,
    );

    if (existingUser) {
      throw new ConflictError(
        "User already exists with this email",
      );
    }

    const hashedPassword = await hashPassword(
      userData.password,
    );

    const newUser = await prisma.users.create({
      data: {
        full_name: fullName,
        email,
        pass_word: hashedPassword,
        phone,
        id_status: 1,
      },
    });

    const accessToken = generateAccessToken(
      newUser.id_user,
      newUser.email,
      newUser.token_version,
    );

    const refreshToken = generateRefreshToken(
      newUser.id_user,
    );

    const expirationDate = new Date();
    expirationDate.setDate(
      expirationDate.getDate() + 7,
    );

    await AuthRepository.createRefreshToken(
      newUser.id_user,
      refreshToken,
      expirationDate,
    );

    sendLandingWelcomeEmailInBackground({
      email: newUser.email,
      fullName: newUser.full_name,
    });

    const cleanUser =
      UserMapper.toCleanUser(newUser);

    return {
      user: cleanUser,
      role: null,
      permissions: [],
      client: null,
      accessToken,
      refreshToken,
    };
  }
}
