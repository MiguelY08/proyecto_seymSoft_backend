import { RoleRepository } from "../repositories/roleRepository.js";
import { validateRolePermissions } from "../helpers/validateRolePermissions.js";

const normalizeRoleId = (idRole) => {
  const parsedId = Number(idRole);

  return Number.isInteger(parsedId) && parsedId > 0 ? parsedId : null;
};

const mapPermissionConflict = (conflict) => ({
  id_role: conflict.roles?.id_role || conflict.id_role,
  name_role: conflict.roles?.name_role || null,
  id_module: conflict.modules?.id_module || conflict.id_module,
  name_module: conflict.modules?.name_module || null,
  id_privilege: conflict.privileges?.id_privilege || conflict.id_privilege,
  name_privilege: conflict.privileges?.name_privilege || null,
});

export class ValidateRoleUseCase {
  static async validateName(nameRole, idRole = null) {
    const name = String(nameRole || "").trim();
    const excludedRoleId = normalizeRoleId(idRole);

    if (!name) {
      return {
        available: false,
        message: "El nombre del rol es requerido",
        role: null,
      };
    }

    const existingRole = await RoleRepository.findRoleByNameInsensitive(
      name,
      excludedRoleId,
    );

    return {
      available: !existingRole,
      message: existingRole
        ? "Ya existe un rol con este nombre"
        : "Nombre disponible",
      role: existingRole,
    };
  }

  static async validatePermissions(permissions, idRole = null) {
    const excludedRoleId = normalizeRoleId(idRole);
    const moduleIds = [
      ...new Set(permissions.map((permission) => permission.id_module)),
    ];
    const privilegeIds = [
      ...new Set(permissions.map((permission) => permission.id_privilege)),
    ];

    const modules = await RoleRepository.findModulesByIds(moduleIds);
    const privileges = await RoleRepository.findPrivilegesByIds(privilegeIds);

    validateRolePermissions(permissions, modules, privileges);

    return {
      valid: true,
      message: "Permisos disponibles",
      conflicts: [],
    };
  }

  static async validateRole({ nameRole, permissions, idRole = null }) {
    const [nameValidation, permissionsValidation] = await Promise.all([
      this.validateName(nameRole, idRole),
      this.validatePermissions(permissions, idRole),
    ]);

    return {
      valid: nameValidation.available && permissionsValidation.valid,
      name: nameValidation,
      permissions: permissionsValidation,
    };
  }
}
