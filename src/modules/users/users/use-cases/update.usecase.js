import { UserRepository } from "../repositories/userRepository.js";

/**
 * Use-Case: Actualizar usuario
 * 
 * Responsabilidades:
 * - Aplicar lógica de negocio
 * - Validar que el usuario existe
 * - Validar duplicados de email y documento (si se actualizan)
 * - Actualizar solo los campos especificados
 * - Retornar usuario actualizado
 * 
 * Reglas de negocio:
 * - El usuario DEBE existir
 * - Si se actualiza email, DEBE ser único (pero se permite si es el mismo)
 * - Si se actualiza docNumber, DEBE ser único (pero se permite si es el mismo)
 * - Solo se actualizan los campos que vienen en updateData (parcial)
 * - No se puede actualizar: id, idStatus, creationDate, password
 * - Retorna el usuario actualizado con todos sus datos
 * 
 * Campos que se pueden actualizar:
 * - docType
 * - docNumber (con validación de unicidad)
 * - fullName
 * - email (con validación de unicidad)
 * - phone
 * 
 * Campos que NO se pueden actualizar:
 * - idUser (inmutable)
 * - creationDate (inmutable)
 * - idStatus (usar updateStatus.usecase.js)
 * - password (usar módulo auth)
 * 
 * @param {Object} params - Parámetros
 * @param {number} params.idUser - ID del usuario a actualizar
 * @param {Object} params.updateData - Datos a actualizar (todos opcionales)
 * @param {string} params.updateData.docType - Tipo de documento
 * @param {number} params.updateData.docNumber - Número de documento
 * @param {string} params.updateData.fullName - Nombre completo
 * @param {string} params.updateData.email - Email
 * @param {number} params.updateData.phone - Teléfono
 * 
 * @returns {Promise<Object>} Resultado con estructura:
 * {
 *   success: boolean,
 *   data: {
 *     idUser: number,
 *     docType: string,
 *     docNumber: number,
 *     fullName: string,
 *     email: string,
 *     phone: number|null,
 *     creationDate: Date,
 *     idStatus: number
 *   }|null,
 *   error: string|null,
 *   errorCode: string|null
 * }
 * 
 * @throws No lanza excepciones, retorna objeto de resultado
 * 
 * Códigos de error:
 * - USER_NOT_FOUND: Usuario no existe
 * - DUPLICATE_EMAIL: Email ya existe en otro usuario
 * - DUPLICATE_DOC_NUMBER: Documento ya existe en otro usuario
 * - NO_DATA_TO_UPDATE: updateData está vacío
 * - DATABASE_ERROR: Error en BD
 * 
 * Ejemplo de uso:
 * const result = await updateUserUseCase({
 *   idUser: 5,
 *   updateData: {
 *     fullName: "Juan Carlos Pérez",
 *     email: "juancarlos@example.com",
 *     phone: 3009876543
 *   }
 * });
 * 
 * if (result.success) {
 *   console.log("Usuario actualizado:", result.data);
 * } else if (result.errorCode === "DUPLICATE_EMAIL") {
 *   console.log("Email ya existe");
 * } else {
 *   console.error("Error:", result.error);
 * }
 */
export const updateUserUseCase = async (params) => {
  try {
    const { idUser, updateData } = params;

    // Validar idUser
    if (!idUser || isNaN(idUser) || idUser < 1) {
      return {
        success: false,
        data: null,
        error: "ID de usuario inválido",
        errorCode: "VALIDATION_ERROR",
      };
    }

    const parsedIdUser = Number(idUser);

    // Validar que updateData no esté vacío
    if (!updateData || Object.keys(updateData).length === 0) {
      return {
        success: false,
        data: null,
        error: "Debe proporcionar al menos un campo para actualizar",
        errorCode: "NO_DATA_TO_UPDATE",
      };
    }

    // Buscar usuario existente
    const existingUser = await UserRepository.findById(parsedIdUser);

    // Usuario no existe
    if (!existingUser) {
      return {
        success: false,
        data: null,
        error: "Usuario no encontrado",
        errorCode: "USER_NOT_FOUND",
      };
    }

    // Validar email único (si se está actualizando)
    if (updateData.email) {
      const existingEmail = await UserRepository.findByEmail(updateData.email);

      // Permitir si es el mismo usuario, rechazar si pertenece a otro
      if (existingEmail && existingEmail.id !== parsedIdUser) {
        return {
          success: false,
          data: null,
          error: "El email ya está registrado",
          errorCode: "DUPLICATE_EMAIL",
        };
      }
    }

    // Validar documento único (si se está actualizando)
    if (updateData.docNumber) {
      const existingDocNumber = await UserRepository.findByDocNumber(
        updateData.docNumber
      );

      // Permitir si es el mismo usuario, rechazar si pertenece a otro
      if (existingDocNumber && existingDocNumber.id !== parsedIdUser) {
        return {
          success: false,
          data: null,
          error: "El documento ya está registrado",
          errorCode: "DUPLICATE_DOC_NUMBER",
        };
      }
    }

    // Actualizar usuario en BD
    const updatedUser = await UserRepository.update(parsedIdUser, updateData);

    // Validar resultado de la actualización
    if (!updatedUser) {
      return {
        success: false,
        data: null,
        error: "Error al actualizar el usuario en la base de datos",
        errorCode: "DATABASE_ERROR",
      };
    }

    // Validar que el usuario actualizado tenga los campos requeridos
    const requiredFields = [
      "idUser",
      "docType",
      "docNumber",
      "fullName",
      "email",
      "creationDate",
      "idStatus",
    ];

    for (const field of requiredFields) {
      if (updatedUser[field] === undefined) {
        return {
          success: false,
          data: null,
          error: `Error: usuario actualizado falta campo requerido: ${field}`,
          errorCode: "DATABASE_ERROR",
        };
      }
    }

    // Retornar usuario actualizado
    return {
      success: true,
      data: updatedUser,
      error: null,
      errorCode: null,
    };

  } catch (error) {
    // Capturar errores no esperados
    console.error("[UpdateUserUseCase] Error:", error.message);

    // Intentar identificar tipo de error
    let errorCode = "DATABASE_ERROR";
    if (error.code === "P2002") {
      // Error de constraint único en Prisma
      const field = error.meta?.target?.[0];
      if (field === "email") {
        errorCode = "DUPLICATE_EMAIL";
      } else if (field === "doc_number") {
        errorCode = "DUPLICATE_DOC_NUMBER";
      }
    }

    return {
      success: false,
      data: null,
      error: "Error al actualizar usuario: " + error.message,
      errorCode,
    };
  }
};

/**
 * Alias (exportación alternativa para compatibilidad)
 */
export const update = updateUserUseCase;