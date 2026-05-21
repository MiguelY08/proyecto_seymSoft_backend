
export class RoleMapper {

  static toResponseDto(role) {
    return {
      id_role: role.id_role,
      name_role: role.name_role,
      description: role.description,
      date_creation: role.date_creation,
      id_status: role.id_status,
      is_admin: role.name_role?.toLowerCase() === "administrator",
      permissions: role.assigned_permissions?.map((perm) => ({
        id_permission: perm.id_permission,
        id_module: perm.id_module,
        module_name: perm.modules?.name_module,
        module_description: perm.modules?.description,
        id_privilege: perm.id_privilege,
        privilege_name: perm.privileges?.name_privilege,
        privilege_description: perm.privileges?.description,
      })) || [],
      total_permissions: role.assigned_permissions?.length || 0,
    };
  }

  /**
   * Mapea rol a formato resumen (sin permisos detallados)
   * Usado en GET /api/roles (listado)
   */
  static toListDto(role) {
    return {
      id_role: role.id_role,
      name_role: role.name_role,
      description: role.description,
      date_creation: role.date_creation,
      id_status: role.id_status,
      is_admin: role.name_role?.toLowerCase() === "administrator",
      total_permissions: role.assigned_permissions?.length || 0,
    };
  }

  /**
   * Mapea módulos y privilegios disponibles
   * Usado en GET /api/roles/available-permissions
   */
  static toAvailablePermissionsDto(modules, privileges) {
    return {
      modules: modules.map((module) => ({
        id_module: module.id_module,
        name_module: module.name_module,
        description: module.description,
      })),
      privileges: privileges.map((privilege) => ({
        id_privilege: privilege.id_privilege,
        name_privilege: privilege.name_privilege,
        description: privilege.description,
      })),
      total_modules: modules.length,
      total_privileges: privileges.length,
    };
  }

  /**
   * Mapea respuesta de permisos asignados
   */
  static toAssignedPermissionDto(permission) {
    return {
      id_permission: permission.id_permission,
      id_role: permission.id_role,
      id_module: permission.id_module,
      module_name: permission.modules?.name_module,
      id_privilege: permission.id_privilege,
      privilege_name: permission.privileges?.name_privilege,
    };
  }
}