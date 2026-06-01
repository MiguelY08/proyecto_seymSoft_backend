import { UserRepository } from "../repositories/userRepository.js";
import { hashPassword } from "../../../shared/utils/hashPassword.js";
import { EmailService } from "../../../shared/services/emailService.js";

const generateRandomPassword = () => {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";

  const allChars =
    uppercase +
    lowercase +
    numbers;

  let password = "";

  for (let i = 0; i < 10; i++) {
    password += allChars.charAt(
      Math.floor(
        Math.random() *
        allChars.length
      )
    );
  }

  return password;
};

export const createUserUseCase = async (userData) => {

  try {

    const {
      fullName,
      email,
      phone,
      idRole
    } = userData;

    // ======================
    // Validar campos
    // ======================

    if (
      !fullName ||
      !email ||
      !idRole
    ) {

      return {
        success: false,
        data: null,
        error: "Faltan campos obligatorios",
        errorCode: "VALIDATION_ERROR"
      };

    }

    // ======================
    // Validar email duplicado
    // ======================

    const existingEmail =
      await UserRepository.findByEmail(
        email
      );

    if (existingEmail) {

      return {
        success: false,
        data: null,
        error: "El email ya está registrado",
        errorCode: "DUPLICATE_EMAIL"
      };

    }

    // ======================
    // Generar contraseña
    // ======================

    const tempPassword =
      generateRandomPassword();

    const hashedPassword =
      await hashPassword(
        tempPassword
      );

    // ======================
    // Crear usuario
    // ======================

    const newUser =
      await UserRepository.create({

        fullName:
          fullName,

        email,

        password:
          hashedPassword,

        phone:
          phone || null,

        idStatus: 1

      });

    // ======================
    // Asignar rol
    // ======================

    await UserRepository.assignRole(
      newUser.idUser,
      idRole
    );

    // ======================
    // Enviar correo
    // ======================

    try {

      await EmailService.sendWelcomeEmail(
        email,
        tempPassword,
        full_name,
        process.env.FRONTEND_URL
      );

    } catch (emailError) {

      console.log(
        "Error email:",
        emailError.message
      );

      return {

        success: true,

        data: newUser,

        error:
          "Usuario creado pero el email falló",

        errorCode:
          "EMAIL_SEND_ERROR"

      };

    }

    return {

      success: true,
      data: newUser,
      error: null,
      errorCode: null

    };

  } catch (error) {

    console.error(
      "[CreateUserUseCase]",
      error
    );

    return {

      success: false,

      data: null,

      error:
        error.message,

      errorCode:
        "DATABASE_ERROR"

    };

  }

};

export const create =
  createUserUseCase;