import { UserRepository } from "../repositories/userRepository.js";

/**
 * Use-Case: Obtener usuario por ID
 * 
 * Responsabilidades:
 * - Aplicar lógica de negocio
 * - Validar que el usuario existe
 * - Retornar datos del usuario
 * 
 * Reglas de negocio:
 * - El usuario DEBE existir
 * - Debe retornar todos los campos del usuario:
 *   • ID del usuario
 *   • Tipo de documento
 *   • Número de documento
 *   • Nombre completo
 *   • Correo electrónico
 *   • Teléfono/celular
 *   • Fecha de creación
 *   • ID del estado
 * 
 * - Retorna null si no existe
 * - NO expone contraseña
 * 
 * @param {number} id - ID del usuario a buscar
 * 
 * @returns {Promise<Object>} Resultado con estructura:
 * {
 *   success: boolean,
 *   data: {
 *     id: number,
 *     docType: string,
 *     docNumber: number,
 *     fullName: string,
 *     email: string,
 *     phone: number|null,
 *     creationDate: Date,
 *     statusId: number
 *   }|null,
 *   error: string|null
 * }
 * 
 * @throws No lanza excepciones, retorna objeto de resultado
 * 
 * Ejemplo de uso:
 * const result = await getUserByIdUseCase(5);
 * 
 * if (result.success && result.data) {
 *   console.log("Usuario encontrado:", result.data);
 * } else if (result.success && !result.data) {
 *   console.log("Usuario no encontrado");
 * } else {
 *   console.error("Error:", result.error);
 * }
 */
export const getUserByIdUseCase = async (id) => {
  try {
    // Validar que el ID sea válido
    if (!id || isNaN(id) || id < 1) {
      return {
        success: false,
        data: null,
        error: "ID de usuario inválido",
      };
    }

    const userId = Number(id);

    // Buscar usuario en el repository
    const user = await UserRepository.findById(userId);

    // Usuario no existe
    if (!user) {
      return {
        success: true,
        data: null,
        error: null,
      };
    }

    // Validar que el usuario tenga los campos requeridos
    const requiredFields = [
      "id",
      "docType",
      "docNumber",
      "fullName",
      "email",
      "phone",
      "creationDate",
      "statusId",
    ];

    for (const field of requiredFields) {
      if (user[field] === undefined) {
        return {
          success: false,
          data: null,
          error: `Error: usuario falta campo requerido: ${field}`,
        };
      }
    }

    // Retornar usuario encontrado
    return {
      success: true,
      data: user,
      error: null,
    };

  } catch (error) {
    // Capturar errores no esperados
    console.error("[GetUserByIdUseCase] Error:", error.message);

    return {
      success: false,
      data: null,
      error: "Error al obtener usuario: " + error.message,
    };
  }
};

/**
 * Alias (exportación alternativa para compatibilidad)
 */
export const getById = getUserByIdUseCase;