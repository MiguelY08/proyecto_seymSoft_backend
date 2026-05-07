import { RoleRepository } from "../repositories/roleRepository.js";
import { RoleResponseDto } from "../dtos/roleDtos.js";
import { NotFoundError, BadRequestError, ConflictError } from "../../../../shared/errors/index.js";

/**
 * UPDATE ROLE USE CASE
 * 
 * Responsabilidades:
 * 1. Obtener rol actual
 * 2. Validar que NO sea Administrator
 * 3. Si cambia nombre, validar que NO exista otro rol con ese nombre
 * 4. Actualizar nombre y descripción
 * 5. Eliminar permisos anteriores
 * 6. Asignar nuevos permisos
 * 7. Retornar rol actualizado
 */
export class UpdateRoleUseCase {
  static async execute(id_role, roleData) {
    try {
      //  Obtener rol actual
      const currentRole = await RoleRepository.findRoleById(id_role);

      if (!currentRole) {
        throw new NotFoundError("El rol no existe");
      }

      //  Validar que NO sea Administrator
      if (currentRole.name_role.toLowerCase() === "administrator") {
        throw new BadRequestError(
          "No se puede editar el rol 'Administrator'"
        );
      }

      //  Si cambia el nombre, validar que NO exista otro rol con ese nombre
      if (roleData.name_role !== currentRole.name_role) {
        const existingRole = await RoleRepository.findRoleByName(
          roleData.name_role
        );
        if (existingRole) {
          throw new ConflictError(
            "Ya existe un rol con este nombre"
          );
        }
      }

      //  Actualizar rol (nombre y descripción)
      const updatedRole = await RoleRepository.updateRole(id_role, roleData);

      //  Eliminar permisos anteriores
      await RoleRepository.deleteAllAssignedPermissionsByRole(id_role);

      //  Asignar nuevos permisos
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
          id_role,
          id_module: perm.id_module,
          id_privilege: perm.id_privilege,
        });
      }

      //  Obtener rol actualizado con nuevos permisos
      const roleWithPermissions = await RoleRepository.findRoleById(id_role);

      return new RoleResponseDto(roleWithPermissions);

    } catch (error) {
      throw error;
    }
  }
}