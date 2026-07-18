import { RoleRepository } from "../repositories/roleRepository.js";
import { NotFoundError, BadRequestError } from "../../../../shared/errors/index.js";
import { GENERAL_STATUSES } from "../../../../shared/constants/generalStatuses.js";

/**
 * DELETE ROLE USE CASE
 * 
 * Responsabilidades:
 * 1. Obtener rol actual
 * 2. Validar que NO sea Administrator
 * 3. Validar que NO tenga empleados asociados
 * 4. Eliminar todos los permisos asignados del rol
 * 5. Eliminar el rol
 * 6. Retornar confirmación
 */
export class DeleteRoleUseCase {
  static async execute(id_role) {
    try {
      //  Obtener rol
      const role = await RoleRepository.findRoleById(id_role);

      if (!role) {
        throw new NotFoundError("El rol no existe");
      }

      //  Validar que NO sea Administrator
      if (role.name_role.toLowerCase() === "administrator") {
        throw new BadRequestError(
          "No se puede eliminar el rol 'Administrator'"
        );
      }

      if (role.id_status !== GENERAL_STATUSES[2].id) {
        throw new BadRequestError(
          "Solo se pueden eliminar roles inactivos. Primero desactiva el rol."
        );
      }

      //  Validar que NO tenga empleados asociados
      const hasEmployees = await RoleRepository.hasAssociatedEmployees(id_role);
      if (hasEmployees) {
        throw new BadRequestError(
          "No se puede eliminar un rol que tiene empleados asociados. Primero reasigna o elimina los empleados."
        );
      }

      //  Eliminar todos los permisos asignados al rol
      await RoleRepository.deleteAllAssignedPermissionsByRole(id_role);

      // Eliminar el rol
      const deletedRole = await RoleRepository.deleteRole(id_role);

      return {
        success: true,
        message: "Rol eliminado correctamente",
        deleted_role: deletedRole.name_role,
      };

    } catch (error) {
      throw error;
    }
  }
}
