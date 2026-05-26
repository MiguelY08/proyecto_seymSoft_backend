import { AuthRepository } from "../repositories/authRepository.js";

/**
 * VALIDATE PASSWORD RESET USE CASE
 * 
 * Valida si el código de recuperación es válido y no ha expirado
 * Se usa en tiempo real mientras el usuario ingresa los dígitos
 */

export class ValidatePasswordResetUseCase {
  static async execute(token) {
    try {
      // Buscar el código en la BD
      const passwordReset = await AuthRepository.findPasswordReset(token);

      // No existe el código
      if (!passwordReset) {
        return {
          valid: false,
          message: "Código inválido",
        };
      }

      // El código ya fue usado
      if (passwordReset.used) {
        return {
          valid: false,
          message: "Este código ya fue utilizado",
        };
      }

      // Verificar que no haya expirado
      const now = new Date();
      const expirationDate = new Date(passwordReset.expiration_date);

      if (now > expirationDate) {
        return {
          valid: false,
          message: "El código ha expirado",
        };
      }

      //  Código VÁLIDO
      return {
        valid: true,
        message: "Código válido",
      };

    } catch (error) {
      console.error("Error en ValidatePasswordResetUseCase:", error);
      
      return {
        valid: false,
        message: "Error al validar el código",
      };
    }
  }
}