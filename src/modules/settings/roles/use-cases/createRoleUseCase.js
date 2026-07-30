import { RoleRepository } from "../repositories/roleRepository.js";
import { RoleResponseDto } from "../dtos/roleDtos.js";
import { ConflictError } from "../../../../shared/errors/index.js";
import { validateRolePermissions } from "../helpers/validateRolePermissions.js";

export class CreateRoleUseCase {
  static async execute(roleData) {
    const existingRole = await RoleRepository.findRoleByNameInsensitive(
      roleData.name_role,
    );

    if (existingRole) {
      throw new ConflictError("Ya existe un rol con este nombre");
    }

    const moduleIds = [
      ...new Set(
        roleData.permissions.map((permission) => permission.id_module),
      ),
    ];

    const privilegeIds = [
      ...new Set(
        roleData.permissions.map((permission) => permission.id_privilege),
      ),
    ];

    const modules = await RoleRepository.findModulesByIds(moduleIds);

    const privileges = await RoleRepository.findPrivilegesByIds(privilegeIds);

    validateRolePermissions(roleData.permissions, modules, privileges);

    const newRole = await RoleRepository.createRole(roleData);

    await RoleRepository.createManyAssignedPermissions(
      roleData.permissions.map((permission) => ({
        id_role: newRole.id_role,
        id_module: permission.id_module,
        id_privilege: permission.id_privilege,
      })),
    );

    const role = await RoleRepository.findRoleById(newRole.id_role);

    return new RoleResponseDto(role);
  }
}
