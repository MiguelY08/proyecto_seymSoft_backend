import { UserRepository } from "../repositories/userRepository.js";

/**
 * Use-Case: Obtener todos los usuarios
 * 
 * Responsabilidades:
 * - Aplicar lógica de negocio
 * - Llamar al repository con filtros
 * - Validar reglas de negocio
 * - Retornar datos estructurados
 * 
 * Reglas de negocio:
 * - Los usuarios retornados DEBEN contener:
 *   • Tipo de documento
 *   • Número de documento
 *   • Nombre completo
 *   • Correo electrónico
 *   • Teléfono/celular
 *   • Fecha de creación (metadata)
 *   • Estado (metadata)
 * 
 * - Soporta paginación y filtros avanzados
 * - Ordena por campo especificado
 * 
 * @param {Object} filters - Filtros de búsqueda
 * @param {number} filters.page - Número de página (default: 1)
 * @param {number} filters.limit - Usuarios por página (default: 10)
 * @param {number} filters.status - Filtro por estado (opcional)
 * @param {string} filters.docType - Filtro por tipo documento (opcional)
 * @param {string} filters.search - Búsqueda por nombre/email/doc (opcional)
 * @param {string} filters.sortBy - Campo de orden: name, email, date (default: date)
 * @param {string} filters.order - Dirección: asc, desc (default: desc)
 * 
 * @returns {Promise<Object>} Resultado con estructura:
 * {
 *   success: boolean,
 *   data: {
 *     users: Array<{
 *       id: number,
 *       docType: string,
 *       docNumber: number,
 *       fullName: string,
 *       email: string,
 *       phone: number|null,
 *       creationDate: Date,
 *       statusId: number
 *     }>,
 *     total: number,
 *     page: number,
 *     limit: number,
 *     totalPages: number,
 *     hasNextPage: boolean,
 *     hasPrevPage: boolean
 *   },
 *   error: string|null
 * }
 * 
 * @throws No lanza excepciones, retorna objeto de resultado
 * 
 * Ejemplo de uso:
 * const result = await getAllUsersUseCase({
 *   page: 1,
 *   limit: 10,
 *   status: 1,
 *   search: "juan",
 *   sortBy: "name",
 *   order: "asc"
 * });
 * 
 * if (result.success) {
 *   console.log(result.data.users);
 * } else {
 *   console.error(result.error);
 * }
 */
export const getAllUsersUseCase = async (filters = {}) => {
  try {
    // Llamar al repository con filtros validados
    const result = await UserRepository.findAllWithFilters(filters);

    // Validar que los datos cumplan reglas de negocio
    if (!result.users || !Array.isArray(result.users)) {
      return {
        success: false,
        data: null,
        error: "Error: estructura de datos inválida del repository",
      };
    }

    // Validar que cada usuario tenga los campos requeridos
    const requiredFields = [
      "docType",
      "docNumber",
      "fullName",
      "email",
      "phone",
    ];

    for (const user of result.users) {
      for (const field of requiredFields) {
        if (user[field] === undefined) {
          return {
            success: false,
            data: null,
            error: `Error: usuario falta campo requerido: ${field}`,
          };
        }
      }
    }

    // Retornar resultado exitoso con estructura esperada
    return {
      success: true,
      data: {
        users: result.users,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        hasNextPage: result.hasNextPage,
        hasPrevPage: result.hasPrevPage,
      },
      error: null,
    };

  } catch (error) {
    // Capturar errores no esperados
    console.error("[GetAllUsersUseCase] Error:", error.message);

    return {
      success: false,
      data: null,
      error: "Error al obtener usuarios: " + error.message,
    };
  }
};

/**
 * Alias (exportación alternativa para compatibilidad)
 */
export const getAll = getAllUsersUseCase;