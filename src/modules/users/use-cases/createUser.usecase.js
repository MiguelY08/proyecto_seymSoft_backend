import { UserRepository } from "../repositories/userRepository.js";
import { hashPassword } from "../../../shared/utils/hashPassword.js";
import { EmailService } from "../../../shared/services/emailService.js";
import { RoleRepository } from "../../settings/roles/repositories/roleRepository.js";
import { env } from "../../../config/env.js";
import {
  normalizeEmail,
  normalizeNumericString,
  normalizeSpaces,
} from "../../../shared/utils/textNormalizer.js";
import { userErrorCodes } from "../../../shared/constants/userErrorCodes.js";
import { userErrorPublicMessages } from "../../../shared/constants/userErrorPublicMessages.js";

const fail = (errorCode) => ({
  success: false,
  data: null,
  error: userErrorPublicMessages[errorCode],
  errorCode,
});

const generateRandomPassword = () => {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const allChars = uppercase + lowercase + numbers;

  let password = "";

  for (let i = 0; i < 10; i++) {
    password += allChars.charAt(
      Math.floor(Math.random() * allChars.length)
    );
  }

  return password;
};

const sendWelcomeEmailInBackground = ({
  email,
  tempPassword,
  fullName,
}) => {
  setImmediate(async () => {
    try {
      await EmailService.sendWelcomeEmail(
        email,
        tempPassword,
        fullName,
        env.FRONTEND_URL
      );
    } catch (emailError) {
      console.error("[CreateUserUseCase] Email error:", {
        message: emailError.message,
        code: emailError.code,
        command: emailError.command,
        responseCode: emailError.responseCode,
      });
    }
  });
};

export const createUserUseCase = async (userData) => {
  try {
    const { phone, idRole } = userData;

    const fullName = normalizeSpaces(userData.fullName);
    const email = normalizeEmail(userData.email);
    const normalizedPhone =
      phone !== undefined && phone !== null
        ? BigInt(normalizeNumericString(phone))
        : null;

    if (!fullName || !email) {
      return fail(userErrorCodes.VALIDATION_ERROR);
    }

    const existingEmail = await UserRepository.findByEmail(email);

    if (existingEmail) {
      return fail(userErrorCodes.DUPLICATE_EMAIL);
    }

    if (idRole) {
      const role = await RoleRepository.findRoleById(idRole);

      if (!role) {
        return fail(userErrorCodes.ROLE_NOT_FOUND);
      }
    }

    const tempPassword = generateRandomPassword();
    const hashedPassword = await hashPassword(tempPassword);

    const newUser = await UserRepository.create({
      fullName,
      email,
      password: hashedPassword,
      phone: normalizedPhone,
      idStatus: 1,
    });

    if (idRole) {
      await UserRepository.assignRole(
        newUser.idUser,
        idRole
      );
    }

    sendWelcomeEmailInBackground({
      email,
      tempPassword,
      fullName,
    });

    const userWithRole = await UserRepository.getUserWithRole(
      newUser.idUser
    );

    if (!userWithRole?.user) {
      console.error("[CreateUserUseCase] Created user payload missing:", {
        idUser: newUser.idUser,
        userWithRole,
      });

      return fail(userErrorCodes.DATABASE_ERROR);
    }

    return {
      success: true,
      data: {
        user: userWithRole.user,
        role: userWithRole.role,
        permissions: userWithRole.permissions,
      },
      warning: null,
      warningCode: null,
      error: null,
      errorCode: null,
    };
  } catch (error) {
    console.error("[CreateUserUseCase] Error:", {
      email: userData?.email,
      idRole: userData?.idRole,
      message: error.message,
      prismaCode: error.code,
      meta: error.meta,
      stack: error.stack,
    });

    if (error.code === "P2002") {
      const field = error.meta?.target?.[0];
      if (field === "email") {
        return fail(userErrorCodes.DUPLICATE_EMAIL);
      }
    }

    return fail(userErrorCodes.DATABASE_ERROR);
  }
};

export const create = createUserUseCase;
