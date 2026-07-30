import { UserRepository } from "../repositories/userRepository.js";
import { hashPassword } from "../../../shared/utils/hashPassword.js";
import { EmailService } from "../../../shared/services/emailService.js";
import { RoleRepository } from "../../settings/roles/repositories/roleRepository.js";
import { env } from "../../../config/env.js";
import {
  normalizeEmail,
  normalizeName,
  normalizeNumericString,
} from "../../../shared/utils/textNormalizer.js";

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
      console.error(
        "[CreateUserUseCase] Email error:",
        {
          message: emailError.message,
          code: emailError.code,
          command: emailError.command,
          responseCode: emailError.responseCode,
        }
      );
    }
  });
};

export const createUserUseCase = async (userData) => {
  try {
    const {
      phone,
      idRole,
    } = userData;

    const fullName = normalizeName(userData.fullName);
    const email = normalizeEmail(userData.email);
    const normalizedPhone =
      phone !== undefined && phone !== null
        ? BigInt(normalizeNumericString(phone))
        : null;

    if (!fullName || !email) {
      return {
        success: false,
        data: null,
        error: "Faltan campos obligatorios",
        errorCode: "VALIDATION_ERROR",
      };
    }

    const existingEmail = await UserRepository.findByEmail(email);

    if (existingEmail) {
      return {
        success: false,
        data: null,
        error: "El email ya esta registrado",
        errorCode: "DUPLICATE_EMAIL",
      };
    }

    if (idRole) {
      const role = await RoleRepository.findRoleById(idRole);

      if (!role) {
        return {
          success: false,
          data: null,
          error: "El rol no existe",
          errorCode: "INVALID_ROLE",
        };
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

    return {
      success: true,
      data: newUser,
      warning: null,
      warningCode: null,
      error: null,
      errorCode: null,
    };
  } catch (error) {
    console.error(
      "[CreateUserUseCase]",
      error
    );

    return {
      success: false,
      data: null,
      error: error.message,
      errorCode: "DATABASE_ERROR",
    };
  }
};

export const create = createUserUseCase;
