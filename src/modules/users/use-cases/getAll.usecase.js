import { UserRepository } from "../repositories/userRepository.js";
import { UserMapper } from "../mappers/usersMapper.js";

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
 * @param {string} filters.search - Búsqueda por nombre/email (opcional)
 * @param {string} filters.sortBy - Campo de orden: name, email, date (default: date)
 * @param {string} filters.order - Dirección: asc, desc (default: desc)
 * 
 * @returns {Promise<Object>} Resultado con estructura:
 * {
 *   success: boolean,
 *   data: {
 *     users: Array<{
 *       idUser: number,
 *       fullName: string,
 *       email: string,
 *       phone: number|null,
 *       creationDate: Date,
 *       idStatus: number
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

    // Si está vacío, retornar vacío
    if (result.users.length === 0) {
      return {
        success: true,
        data: {
          users: [],
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
          hasNextPage: result.hasNextPage,
          hasPrevPage: result.hasPrevPage,
        },
        error: null,
      };
    }

    const mappedUsers = result.users.map((user) => {
      if (!user || Object.keys(user).length === 0) {
        return null;
      }

      try {
        const mappedUser = UserMapper.toDomain(user);

        return {
          ...mappedUser,
          role: user.role || null,
          isClient: user.isClient || false,
        };

      } catch (mapError) {
        console.error("[DEBUG] Error mapping user:", mapError.message);
        return null;
      }
    }).filter(u => u !== null);

    // Retornar resultado exitoso con estructura esperada
    return {
      success: true,
      data: {
        users: mappedUsers,
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
    console.error("[GetAllUsersUseCase] Error:", error.message);
    console.error("[GetAllUsersUseCase] Stack:", error.stack);

    return {
      success: false,
      data: null,
      error: "Error al obtener usuarios: " + error.message,
    };
  }
};

export const getAll = getAllUsersUseCase;