import { RoleRepository } from "../repositories/roleRepository.js";
import { RoleResponseDto } from "../dtos/roleDtos.js";
import { ConflictError, BadRequestError } from "../../../../shared/errors/index.js";

/**
 * CREATE ROLE USE CASE
 * 
 * Responsabilidades:
 * 1. Validar que el nombre del rol NO exista
 * 2. Crear el rol en BD
 * 3. Asignar permisos (módulo + privilegio) al rol
 * 4. Retornar rol con permisos incluidos
 */
export class CreateRoleUseCase {
  static async execute(roleData) {
    try {
      //  Validar que el nombre del rol NO exista
      const existingRole = await RoleRepository.findRoleByName(
        roleData.name_role
      );
      if (existingRole) {
        throw new ConflictError(
          "Ya existe un rol con este nombre"
        );
      }

      //  Crear el rol
      const newRole = await RoleRepository.createRole(roleData);

      //  Asignar permisos al rol
      for (const perm of roleData.permissions) {
        // Verificar que el módulo exista
        const modules = await RoleRepository.findAllModules();
        const moduleExists = modules.some((m) => m.id_module === perm.id_module);

        if (!moduleExists) {
          throw new BadRequestError(
            `El módulo con ID ${perm.id_module} no existe`
          );
        }

        // Verificar que el privilegio exista
        const privileges = await RoleRepository.findAllPrivileges();
        const privilegeExists = privileges.some(
          (p) => p.id_privilege === perm.id_privilege
        );

        if (!privilegeExists) {
          throw new BadRequestError(
            `El privilegio con ID ${perm.id_privilege} no existe`
          );
        }

        // Crear permiso asignado
        await RoleRepository.createAssignedPermission({
          id_role: newRole.id_role,
          id_module: perm.id_module,
          id_privilege: perm.id_privilege,
        });
      }

      // Obtener rol actualizado con permisos
      const roleWithPermissions = await RoleRepository.findRoleById(
        newRole.id_role
      );

      return new RoleResponseDto(roleWithPermissions);

    } catch (error) {
      throw error;
    }
  }
}