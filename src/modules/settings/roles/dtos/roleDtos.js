/**
 * CREATE ROLE DTO
 * Estructura de datos para crear un nuevo rol
 */
export class CreateRoleDto {
  name_role;
  description;
  permissions;

  constructor(data) {
    this.name_role = data.name_role;
    this.description = data.description || null;
    this.permissions = data.permissions; // Array de { id_module, id_privilege }
  }
}

/**
 * UPDATE ROLE DTO
 * Estructura de datos para actualizar un rol
 */
export class UpdateRoleDto {
  id_role;
  name_role;
  description;
  permissions;

  constructor(data) {
    this.id_role = data.id_role;
    this.name_role = data.name_role;
    this.description = data.description || null;
    this.permissions = data.permissions; // Array de { id_module, id_privilege }
  }
}

/**
 * ROLE RESPONSE DTO
 * Estructura de datos para responder con un rol (sin datos sensibles)
 */
export class RoleResponseDto {
  id_role;
  name_role;
  description;
  date_creation;
  id_status;
  is_admin;
  assigned_permissions;
  total_permissions;

  constructor(role) {
    this.id_role = role.id_role;
    this.name_role = role.name_role;
    this.description = role.description;
    this.date_creation = role.date_creation;
    this.id_status = role.id_status;
    this.is_admin = role.name_role?.toLowerCase() === "administrator";
    this.assigned_permissions = role.assigned_permissions || [];
    this.total_permissions = this.assigned_permissions.length;
  }
}

/**
 * ROLE LIST DTO
 * Estructura de datos para listar roles (sin detalles de permisos)
 */
export class RoleListDto {
  id_role;
  name_role;
  description;
  date_creation;
  id_status;
  is_admin;
  total_permissions;

  constructor(role) {
    this.id_role = role.id_role;
    this.name_role = role.name_role;
    this.description = role.description;
    this.date_creation = role.date_creation;
    this.id_status = role.id_status;
    this.is_admin = role.name_role?.toLowerCase() === "administrator";
    this.total_permissions = role.assigned_permissions?.length || 0;
  }
}