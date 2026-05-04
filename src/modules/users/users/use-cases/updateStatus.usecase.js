import { UserRepository } from "../repositories/userRepository.js";

/**
 * Use-Case: Actualizar estado del usuario
 * 
 * Responsabilidades:
 * - Aplicar lógica de negocio
 * - Validar que el usuario existe
 * - Validar cambio de estado válido
 * - Actualizar estado en BD
 * - Retornar usuario actualizado
 * 
 * Reglas de negocio:
 * - El usuario DEBE existir
 * - El nuevo estado DEBE ser diferente al actual
 * - El estado debe ser un número positivo (validación básica)
 * - Retorna el usuario actualizado con todos sus datos
 * 
 * Estados comunes (ajustar según tu sistema):
 * - 1: Activo
 * - 2: Inactivo
 * - 3: Suspendido
 * - Etc.
 * 
 * @param {Object} params - Parámetros
 * @param {number} params.userId - ID del usuario
 * @param {number} params.statusId - Nuevo ID de estado
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
 * const result = await updateUserStatusUseCase({
 *   userId: 5,
 *   statusId: 2
 * });
 * 
 * if (result.success) {
 *   console.log("Estado actualizado:", result.data);
 * } else {
 *   console.error("Error:", result.error);
 * }
 */
export const updateUserStatusUseCase = async (params) => {
  try {
    const { userId, statusId } = params;

    // Validar parámetros
    if (!userId || isNaN(userId) || userId < 1) {
      return {
        success: false,
        data: null,
        error: "ID de usuario inválido",
      };
    }

    if (!statusId || isNaN(statusId) || statusId < 1) {
      return {
        success: false,
        data: null,
        error: "ID de estado inválido",
      };
    }

    const parsedUserId = Number(userId);
    const parsedStatusId = Number(statusId);

    // Buscar usuario existente
    const existingUser = await UserRepository.findById(parsedUserId);

    // Usuario no existe
    if (!existingUser) {
      return {
        success: false,
        data: null,
        error: "Usuario no encontrado",
      };
    }

    // Validar que el estado sea diferente (evitar actualización innecesaria)
    if (existingUser.statusId === parsedStatusId) {
      return {
        success: false,
        data: null,
        error: "El usuario ya cuenta con ese estado",
      };
    }

    // Actualizar estado en BD
    const updatedUser = await UserRepository.updateStatus(
      parsedUserId,
      parsedStatusId
    );

    // Validar resultado de la actualización
    if (!updatedUser) {
      return {
        success: false,
        data: null,
        error: "Error al actualizar el estado del usuario",
      };
    }

    // Validar que el usuario actualizado tenga los campos requeridos
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
      if (updatedUser[field] === undefined) {
        return {
          success: false,
          data: null,
          error: `Error: usuario falta campo requerido: ${field}`,
        };
      }
    }

    // Validar que el estado fue actualizado correctamente
    if (updatedUser.statusId !== parsedStatusId) {
      return {
        success: false,
        data: null,
        error: "Error: estado no fue actualizado correctamente",
      };
    }

    // Retornar usuario actualizado
    return {
      success: true,
      data: updatedUser,
      error: null,
    };

  } catch (error) {
    // Capturar errores no esperados
    console.error("[UpdateUserStatusUseCase] Error:", error.message);

    return {
      success: false,
      data: null,
      error: "Error al actualizar estado: " + error.message,
    };
  }
};

/**
 * Alias (exportación alternativa para compatibilidad)
 */
export const updateStatus = updateUserStatusUseCase;