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

    // ✅ PASO 1: Validar nombre duplicado
    const existingRole =
      await RoleRepository.findRoleByName(
        roleData.name_role
      );

    if (existingRole) {
      throw new ConflictError(
        "Ya existe un rol con este nombre"
      );
    }

    // ✅ PASO 2: Obtener módulos y privilegios
    const moduleIds = [
      ...new Set(
        roleData.permissions.map(p => p.id_module)
      )
    ];

    const privilegeIds = [
      ...new Set(
        roleData.permissions.map(p => p.id_privilege)
      )
    ];

    const modules =
      await RoleRepository.findModulesByIds(moduleIds);

    const privileges =
      await RoleRepository.findPrivilegesByIds(privilegeIds);

    // ✅ PASO 3: Validar permisos ANTES de crear
    validateRolePermissions(
      roleData.permissions,
      modules,
      privileges
    );

    // ✅ PASO 4: AHORA sí crear el rol (sabemos que es válido)
    const newRole =
      await RoleRepository.createRole(roleData);

    // ✅ PASO 5: Crear permisos
    await RoleRepository.createManyAssignedPermissions(
      roleData.permissions.map(permission => ({
        id_role: newRole.id_role,
        id_module: permission.id_module,
        id_privilege: permission.id_privilege
      }))
    );

    // ✅ PASO 6: Obtener rol completo
    const role =
      await RoleRepository.findRoleById(
        newRole.id_role
      );

    return new RoleResponseDto(role);

  }
}