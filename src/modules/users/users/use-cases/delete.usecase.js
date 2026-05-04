import { prisma } from "../../../../config/prisma.js";
import { UserRepository } from "../repositories/userRepository.js";

const SYSTEM_USER_ID = 1; // Ajustar según tu configuración
const INACTIVE_STATUS_ID = 2; // Ajustar según tu configuración

/**
 * Use-Case: Eliminar usuario
 * 
 * Responsabilidades:
 * - Aplicar lógica de negocio
 * - Validar que el usuario existe
 * - Validar que el usuario está INACTIVO
 * - Prevenir eliminación del usuario del sistema
 * - Transferir relaciones del usuario a usuario del sistema
 * - Eliminar usuario de forma segura con transacciones
 * 
 * Reglas de negocio:
 * - El usuario DEBE existir
 * - El usuario DEBE estar INACTIVO (statusId = 2)
 * - NO se puede eliminar el usuario del sistema (id = 1)
 * - Antes de eliminar, se transfieren todas sus relaciones:
 *   • clients
 *   • employees
 *   • access
 *   • banner_img
 * - La operación completa es una TRANSACCIÓN (todo o nada)
 * - Si algo falla, se revierte todo
 * 
 * Nota sobre usuario del sistema:
 * - Es el usuario especial que recibe todas las relaciones de usuarios eliminados
 * - ID = 1 (ajustar si es diferente en tu sistema)
 * - Status = 1 (activo)
 * 
 * @param {number} userId - ID del usuario a eliminar
 * 
 * @returns {Promise<Object>} Resultado con estructura:
 * {
 *   success: boolean,
 *   data: {
 *     deletedUserId: number,
 *     relationsTransferred: {
 *       clients: number,
 *       employees: number,
 *       access: number,
 *       bannerImages: number
 *     }
 *   }|null,
 *   error: string|null,
 *   errorCode: string|null
 * }
 * 
 * @throws No lanza excepciones, retorna objeto de resultado
 * 
 * Códigos de error:
 * - VALIDATION_ERROR: Parámetro inválido
 * - USER_NOT_FOUND: Usuario no existe
 * - USER_STILL_ACTIVE: Usuario no está inactivo
 * - CANNOT_DELETE_SYSTEM_USER: No se puede eliminar usuario del sistema
 * - TRANSFER_ERROR: Error al transferir relaciones
 * - DATABASE_ERROR: Error en BD
 * 
 * Ejemplo de uso:
 * const result = await deleteUserUseCase(5);
 * 
 * if (result.success) {
 *   console.log("Usuario eliminado, relaciones transferidas:", result.data);
 * } else if (result.errorCode === "USER_STILL_ACTIVE") {
 *   console.log("Usuario debe estar inactivo");
 * } else {
 *   console.error("Error:", result.error);
 * }
 */
export const deleteUserUseCase = async (userId) => {
  try {
    // Validar userId
    if (!userId || isNaN(userId) || userId < 1) {
      return {
        success: false,
        data: null,
        error: "ID de usuario inválido",
        errorCode: "VALIDATION_ERROR",
      };
    }

    const parsedUserId = Number(userId);

    // Buscar usuario existente
    const existingUser = await UserRepository.findById(parsedUserId);

    // Usuario no existe
    if (!existingUser) {
      return {
        success: false,
        data: null,
        error: "Usuario no encontrado",
        errorCode: "USER_NOT_FOUND",
      };
    }

    // Validar que usuario está INACTIVO
    if (existingUser.statusId !== INACTIVE_STATUS_ID) {
      return {
        success: false,
        data: null,
        error: "El usuario debe estar inactivo para poder ser eliminado",
        errorCode: "USER_STILL_ACTIVE",
      };
    }

    // Prevenir eliminación del usuario del sistema
    if (parsedUserId === SYSTEM_USER_ID) {
      return {
        success: false,
        data: null,
        error: "No se puede eliminar el usuario del sistema",
        errorCode: "CANNOT_DELETE_SYSTEM_USER",
      };
    }

    let relationsTransferred = {
      clients: 0,
      employees: 0,
      access: 0,
      bannerImages: 0,
    };

    // TRANSACCIÓN - Operación crítica: transferir y eliminar
    try {
      await prisma.$transaction(async (tx) => {
        // Transferir relaciones a usuario del sistema

        // Contar y transferir clientes
        const clientsResult = await tx.clients.updateMany({
          where: { id_user: parsedUserId },
          data: { id_user: SYSTEM_USER_ID },
        });
        relationsTransferred.clients = clientsResult.count;

        // Contar y transferir empleados
        const employeesResult = await tx.employees.updateMany({
          where: { id_user: parsedUserId },
          data: { id_user: SYSTEM_USER_ID },
        });
        relationsTransferred.employees = employeesResult.count;

        // Contar y transferir accesos
        const accessResult = await tx.access.updateMany({
          where: { id_user: parsedUserId },
          data: { id_user: SYSTEM_USER_ID },
        });
        relationsTransferred.access = accessResult.count;

        // Contar y transferir imágenes de banner
        const bannerImgResult = await tx.banner_img.updateMany({
          where: { id_user: parsedUserId },
          data: { id_user: SYSTEM_USER_ID },
        });
        relationsTransferred.bannerImages = bannerImgResult.count;

        // Eliminar usuario
        await tx.users.delete({
          where: { id_user: parsedUserId },
        });
      });
    } catch (txError) {
      // Error en transacción
      console.error("[DeleteUserUseCase] Transaction error:", txError.message);

      let errorCode = "TRANSFER_ERROR";
      let errorMsg = "Error al transferir relaciones: " + txError.message;

      // Intentar identificar tipo específico de error
      if (txError.code === "P2025") {
        errorCode = "DATABASE_ERROR";
        errorMsg = "Registro no encontrado durante la eliminación";
      } else if (txError.code === "P2003") {
        errorCode = "TRANSFER_ERROR";
        errorMsg = "No se pueden transferir relaciones: restricciones de integridad";
      }

      return {
        success: false,
        data: null,
        error: errorMsg,
        errorCode,
      };
    }

    // Retornar resultado exitoso con información de transferencias
    return {
      success: true,
      data: {
        deletedUserId: parsedUserId,
        relationsTransferred,
      },
      error: null,
      errorCode: null,
    };

  } catch (error) {
    // Capturar errores no esperados
    console.error("[DeleteUserUseCase] Error:", error.message);

    return {
      success: false,
      data: null,
      error: "Error al eliminar usuario: " + error.message,
      errorCode: "DATABASE_ERROR",
    };
  }
};

/**
 * Alias (exportación alternativa para compatibilidad)
 */
export const delete_ = deleteUserUseCase;