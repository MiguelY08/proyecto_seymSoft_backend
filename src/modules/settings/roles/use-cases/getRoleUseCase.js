import { RoleRepository } from "../repositories/roleRepository.js";
import { RoleResponseDto } from "../dtos/roleDtos.js";
import { NotFoundError } from "../../../../shared/errors/index.js";

/**
 * GET ROLE USE CASE
 * 
 * Responsabilidades:
 * 1. Obtener rol por ID
 * 2. Validar que exista
 * 3. Incluir todos sus permisos (módulo + privilegio)
 * 4. Retornar rol con permisos detallados
 */
export class GetRoleUseCase {
  static async execute(id_role) {
    try {
      //  Obtener rol por ID con permisos
      const role = await RoleRepository.findRoleById(id_role);

      // Validar que exista
      if (!role) {
        throw new NotFoundError("El rol no existe");
      }
      //  Mapear a formato de respuesta
      return new RoleResponseDto(role);

    } catch (error) {
      throw error;
    }
  }
}