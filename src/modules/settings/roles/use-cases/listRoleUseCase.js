
import { RoleRepository } from "../repositories/roleRepository.js";

import { RoleMapper }
from "../mappers/roleMapper.js";

export class ListRolesUseCase {

  static async execute() {

    const roles =
      await RoleRepository.findAllRoles();

    return roles.map(
      RoleMapper.toListDto
    );

  }

}

