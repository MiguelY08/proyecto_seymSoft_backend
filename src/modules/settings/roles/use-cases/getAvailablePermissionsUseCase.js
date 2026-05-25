import { RoleRepository } from "../repositories/roleRepository.js";

export class GetAvailablePermissionsUseCase {

  static async execute(){

    const modules =
      await RoleRepository.findAllModules();

    const privileges =
      await RoleRepository.findAllPrivileges();

    return {

      modules,

      privileges,

      total_modules:
        modules.length,

      total_privileges:
        privileges.length

    };

  }

}