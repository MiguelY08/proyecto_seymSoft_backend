import { RoleRepository } from "../repositories/roleRepository.js";
import { RoleResponseDto } from "../dtos/roleDtos.js";
import {
  NotFoundError,
  BadRequestError,
  ConflictError,
} from "../../../../shared/errors/index.js";
import { validateRolePermissions }
  from "../helpers/validateRolePermissions.js";

export class UpdateRoleUseCase {
  static async execute(id_role, roleData) {
    const currentRole =
      await RoleRepository.findRoleById(id_role);

    if (!currentRole) {
      throw new NotFoundError(
        "El rol no existe"
      );
    }

    if (
      currentRole.name_role.toLowerCase() ===
      "administrator"
    ) {
      throw new BadRequestError(
        "No se puede editar el rol 'Administrator'"
      );
    }

    const requestedName = String(roleData.name_role || "").trim();
    const currentName = String(currentRole.name_role || "").trim();

    if (
      requestedName.toLowerCase() !==
      currentName.toLowerCase()
    ) {
      const existingRole =
        await RoleRepository.findRoleByNameInsensitive(
          requestedName,
          id_role
        );

      if (existingRole) {
        throw new ConflictError(
          "Ya existe un rol con este nombre"
        );
      }
    }

    const moduleIds = [
      ...new Set(
        roleData.permissions.map((permission) => permission.id_module)
      ),
    ];

    const privilegeIds = [
      ...new Set(
        roleData.permissions.map((permission) => permission.id_privilege)
      ),
    ];

    const modules =
      await RoleRepository.findModulesByIds(
        moduleIds
      );

    const privileges =
      await RoleRepository.findPrivilegesByIds(
        privilegeIds
      );

    validateRolePermissions(
      roleData.permissions,
      modules,
      privileges
    );

    const permissionConflicts =
      await RoleRepository.findPermissionConflicts(
        roleData.permissions,
        id_role
      );

    if (permissionConflicts.length > 0) {
      throw new ConflictError(
        "Uno o mas permisos ya estan asignados a otro rol"
      );
    }

    const role =
      await RoleRepository.updateRolePermissionsTransaction(
        id_role,
        roleData,
        roleData.permissions.map((permission) => ({
          id_role,
          id_module: permission.id_module,
          id_privilege: permission.id_privilege,
        }))
      );

    return new RoleResponseDto(role);
  }
}
