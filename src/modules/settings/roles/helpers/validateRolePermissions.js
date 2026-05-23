import { ROLE_PERMISSION_RULES } from "../constants/rolePermissionRules.js";
import { BadRequestError } from "../../../../shared/errors/index.js";

/**
 * VALIDATE ROLE PERMISSIONS
 *
 * Valida que:
 * - El módulo exista
 * - El privilegio exista
 * - El privilegio pertenezca al módulo
 */
export function validateRolePermissions(
  permissions,
  modules,
  privileges
) {

  for (const permission of permissions) {

    // Buscar módulo
    const module = modules.find(
      m => m.id_module === permission.id_module
    );

    if (!module) {
      throw new BadRequestError(
        `Módulo ${permission.id_module} no existe`
      );
    }

    // Buscar privilegio
    const privilege = privileges.find(
      p => p.id_privilege === permission.id_privilege
    );

    if (!privilege) {
      throw new BadRequestError(
        `Privilegio ${permission.id_privilege} no existe`
      );
    }

    // Obtener reglas del módulo
    const validPermissions =
      ROLE_PERMISSION_RULES[module.name_module];

    // Validar que exista configuración
    if (!validPermissions) {
      throw new BadRequestError(
        `No existen reglas configuradas para el módulo '${module.name_module}'`
      );
    }

    // Validar relación módulo-permiso
    const isValid =
      validPermissions.includes(
        privilege.name_privilege
      );

    if (!isValid) {
      throw new BadRequestError(
        `El privilegio '${privilege.name_privilege}' no es válido para el módulo '${module.name_module}'`
      );
    }
  }

  return true;
}