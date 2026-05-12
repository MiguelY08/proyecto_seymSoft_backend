import { UserRepository } from "../repositories/userRepository.js";
import { UserMapper } from "../mappers/usersMapper.js";

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
 *     idUser: number,
 *     fullName: string,
 *     email: string,
 *     phone: number|null,
 *     creationDate: Date,
 *     idStatus: number
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

    const idUser = Number(id);

    // Buscar usuario en el repository
    const user = await UserRepository.findById(idUser);

    // Usuario no existe
    if (!user) {
      return {
        success: true,
        data: null,
        error: null,
      };
    }

    // Mapear usuario de formato BD a formato limpio PRIMERO
    let mappedUser;
    try {
      mappedUser = UserMapper.toDomain(user);
    } catch (mapError) {
      console.error("[GetUserByIdUseCase] Error mapping user:", mapError.message);
      return {
        success: false,
        data: null,
        error: "Error al mapear usuario: " + mapError.message,
      };
    }

    // Validar que el usuario tenga los campos requeridos
    const requiredFields = [
      "idUser",
      "fullName",
      "email",
      "phone",
      "creationDate",
      "idStatus",
    ];

    for (const field of requiredFields) {
      if (mappedUser[field] === undefined) {
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
      data: mappedUser,
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