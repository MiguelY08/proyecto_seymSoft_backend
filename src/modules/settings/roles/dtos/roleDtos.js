/**
 * CREATE ROLE DTO
 */
export class CreateRoleDto {
  name_role;
  description;
  permissions;

  constructor(data) {
    this.name_role = data.name_role?.trim();
    this.description = data.description?.trim() || null;

    this.permissions = data.permissions || [];
  }
}


/**
 * UPDATE ROLE DTO
 */
export class UpdateRoleDto {
  id_role;
  name_role;
  description;
  permissions;

  constructor(data) {
    this.id_role = data.id_role;

    this.name_role = data.name_role?.trim();

    this.description = data.description?.trim() || null;

    this.permissions = data.permissions || [];
  }
}


/**
 * ROLE RESPONSE DTO
 */
export class RoleResponseDto {
  id_role;
  name_role;
  description;
  date_creation;
  id_status;
  is_admin;
  permissions;
  total_permissions;

  constructor(data) {
    Object.assign(this,data);
  }
}


/**
 * ROLE LIST DTO
 */
export class RoleListDto {
  id_role;
  name_role;
  description;
  date_creation;
  id_status;
  is_admin;
  total_permissions;

  constructor(data){
    Object.assign(this,data);
  }
}