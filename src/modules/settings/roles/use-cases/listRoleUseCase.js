
import { RoleRepository } from "../repositories/roleRepository.js";
import { RoleListDto } from "../dtos/roleDtos.js";


export class ListRolesUseCase {
  static async execute(includeAdmin = false) {
    try {
      //  Obtener todos los roles
      // Si includeAdmin es false, excluye Administrator
      const roles = await RoleRepository.findAllRoles(!includeAdmin);

      //  Mapear a formato de respuesta
      const rolesList = roles.map((role) => new RoleListDto(role));

      return rolesList;

    } catch (error) {
      throw error;
    }
  }
}
