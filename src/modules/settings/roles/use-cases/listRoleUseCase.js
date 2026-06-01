import { RoleRepository } from "../repositories/roleRepository.js";
import { RoleMapper } from "../mappers/roleMapper.js";

export class ListRolesUseCase {

  static async execute(includeAdmin=false){

    const roles =
      await RoleRepository.findAllRoles(
        !includeAdmin
      );

    return roles.map(
      RoleMapper.toListDto
    );

  }

}