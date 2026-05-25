import { RoleRepository } from "../repositories/roleRepository.js";
import { RoleResponseDto } from "../dtos/roleDtos.js";
import {
  ConflictError,
  BadRequestError
} from "../../../../shared/errors/index.js";
import { validateRolePermissions } 
from "../helpers/validateRolePermissions.js";

export class CreateRoleUseCase {

  static async execute(roleData) {

    // Validar nombre duplicado
    const existingRole =
      await RoleRepository.findRoleByName(
        roleData.name_role
      );

    if (existingRole) {
      throw new ConflictError(
        "Ya existe un rol con este nombre"
      );
    }

    // Crear rol
    const newRole =
      await RoleRepository.createRole(roleData);

    // Obtener IDs únicos
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

    // Consultar una sola vez
    const modules =
      await RoleRepository.findModulesByIds(
        moduleIds
      );

    const privileges =
      await RoleRepository.findPrivilegesByIds(
        privilegeIds
      );

    // Validar módulos
    validateRolePermissions(
      roleData.permissions,
      modules,
      privileges
    );


    // Crear todos los permisos juntos
    await RoleRepository.createManyAssignedPermissions(

      roleData.permissions.map(permission => ({
        id_role: newRole.id_role,
        id_module: permission.id_module,
        id_privilege: permission.id_privilege
      }))

    );

    // Obtener rol completo
    const role =
      await RoleRepository.findRoleById(
        newRole.id_role
      );

    return new RoleResponseDto(role);

  }
}