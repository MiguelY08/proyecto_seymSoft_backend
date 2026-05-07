import { RoleRepository } from "../repositories/roleRepository.js";
import { RoleResponseDto } from "../dtos/roleDtos.js";
import { NotFoundError, BadRequestError } from "../../../../shared/errors/index.js";

/**
 * UPDATE ROLE STATUS USE CASE
 * 
 * Responsabilidades:
 * 1. Obtener rol actual
 * 2. Validar que NO sea Administrator
 * 3. Validar que id_status sea válido (1 = activo, 2 = inactivo)
 * 4. Validar que NO intente cambiar a mismo estado
 * 5. Cambiar estado en BD
 * 6. Retornar rol actualizado
 */
export class UpdateRoleStatusUseCase {
  static async execute(id_role, id_status) {
    try {
      //  Obtener rol actual
      const currentRole = await RoleRepository.findRoleById(id_role);

      if (!currentRole) {
        throw new NotFoundError("El rol no existe");
      }

      //  Validar que NO sea Administrator
      if (currentRole.name_role.toLowerCase() === "administrator") {
        throw new BadRequestError(
          "No se puede cambiar el estado del rol 'Administrator'"
        );
      }

      // Validar que id_status sea 1 o 2
      if (![1, 2].includes(id_status)) {
        throw new BadRequestError(
          "El estado debe ser 1 (Activo) o 2 (Inactivo)"
        );
      }

      //  Validar que NO sea el mismo estado
      if (currentRole.id_status === id_status) {
        const estadoActual = id_status === 1 ? "Activo" : "Inactivo";
        throw new BadRequestError(
          `El rol ya está ${estadoActual}`
        );
      }

      //  Cambiar estado en BD
      const updatedRole = await RoleRepository.updateRoleStatus(
        id_role,
        id_status
      );

      // Mapear a formato de respuesta
      return new RoleResponseDto(updatedRole);

    } catch (error) {
      throw error;
    }
  }
}