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

    // Obtener rol actual
    const currentRole =
      await RoleRepository.findRoleById(id_role);

    if (!currentRole) {
      throw new NotFoundError(
        "El rol no existe"
      );
    }

    // Bloquear Administrator
    if (
      currentRole.name_role.toLowerCase() ===
      "administrator"
    ) {
      throw new BadRequestError(
        "No se puede editar el rol 'Administrator'"
      );
    }

    // Validar nombre duplicado
    if (
      roleData.name_role !==
      currentRole.name_role
    ) {

      const existingRole =
        await RoleRepository.findRoleByName(
          roleData.name_role
        );

      if (
        existingRole &&
        existingRole.id_role !== id_role
      ) {
        throw new ConflictError(
          "Ya existe un rol con este nombre"
        );
      }
    }

    // Obtener ids únicos
    const moduleIds = [
      ...new Set(
        roleData.permissions.map(
          p => p.id_module
        )
      )
    ];

    const privilegeIds = [
      ...new Set(
        roleData.permissions.map(
          p => p.id_privilege
        )
      )
    ];

    // Consultas optimizadas
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

    // Ejecutar actualización completa
    const role =
      await RoleRepository.updateRolePermissionsTransaction(
        id_role,
        roleData,
        roleData.permissions.map(
          permission => ({
            id_role,
            id_module:
              permission.id_module,
            id_privilege:
              permission.id_privilege,
          })
        )
      );

    return new RoleResponseDto(role);
  }
}