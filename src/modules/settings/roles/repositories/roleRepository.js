import { prisma } from "../../../../config/prisma.js";

/**
 * ROLE REPOSITORY
 * Gestiona todas las operaciones de BD relacionadas con roles
 */
export class RoleRepository {
  /**
   * Obtener rol por ID con todos sus permisos
   */
  static async findRoleById(id_role) {
    return await prisma.roles.findUnique({
      where: { id_role },
      include: {
        assigned_permissions: {
          include: {
            modules: true,
            privileges: true,
          },
        },
        general_statuses: true,
      },
    });
  }

  /**
   * Obtener rol por nombre
   */
  static async findRoleByName(name_role) {
    return await prisma.roles.findUnique({
      where: { name_role },
      include: {
        assigned_permissions: {
          include: {
            modules: true,
            privileges: true,
          },
        },
        general_statuses: true,
      },
    });
  }

  /**
   * Listar todos los roles (excepto Admin si se especifica)
   */
  static async findAllRoles(excludeAdmin = false) {
    const where = excludeAdmin
      ? {
          NOT: {
            name_role: "Administrator",
          },
        }
      : {};

    return await prisma.roles.findMany({
      where,
      include: {
        assigned_permissions: {
          include: {
            modules: true,
            privileges: true,
          },
        },
        general_statuses: true,
      },
      orderBy: {
        date_creation: "desc",
      },
    });
  }

  /**
   * Crear nuevo rol
   */
  static async createRole(roleData) {
    return await prisma.roles.create({
      data: {
        name_role: roleData.name_role,
        description: roleData.description || null,
        id_status: 1, // Activo por defecto
        date_creation: new Date(),
      },
      include: {
        assigned_permissions: {
          include: {
            modules: true,
            privileges: true,
          },
        },
        general_statuses: true,
      },
    });
  }

  /**
   * Actualizar rol
   */
  static async updateRole(id_role, roleData) {
    return await prisma.roles.update({
      where: { id_role },
      data: {
        name_role: roleData.name_role,
        description: roleData.description || null,
      },
      include: {
        assigned_permissions: {
          include: {
            modules: true,
            privileges: true,
          },
        },
        general_statuses: true,
      },
    });
  }

  /**
   * Eliminar rol
   */
  static async deleteRole(id_role) {
    return await prisma.roles.delete({
      where: { id_role },
    });
  }

  /**
   * Verificar si un rol tiene empleados asociados
   */
  static async hasAssociatedEmployees(id_role) {
    const count = await prisma.employee_roles.count({
      where: {
        assigned_permissions: {
          id_role,
        },
      },
    });
    return count > 0;
  }

  /**
   * Obtener todos los módulos disponibles
   */
  static async findAllModules() {
    return await prisma.modules.findMany({
      orderBy: {
        name_module: "asc",
      },
    });
  }

  /**
   * Obtener todos los privilegios disponibles
   */
  static async findAllPrivileges() {
    return await prisma.privileges.findMany({
      orderBy: {
        name_privilege: "asc",
      },
    });
  }

  /**
   * Crear permisos asignados a un rol
   */
  static async createAssignedPermission(permissionData) {
    return await prisma.assigned_permissions.create({
      data: {
        id_role: permissionData.id_role,
        id_module: permissionData.id_module,
        id_privilege: permissionData.id_privilege,
      },
      include: {
        modules: true,
        privileges: true,
      },
    });
  }

  /**
   * Obtener permisos asignados de un rol
   */
  static async findAssignedPermissionsByRole(id_role) {
    return await prisma.assigned_permissions.findMany({
      where: { id_role },
      include: {
        modules: true,
        privileges: true,
      },
    });
  }

  /**
   * Eliminar permiso asignado
   */
  static async deleteAssignedPermission(id_permission) {
    return await prisma.assigned_permissions.delete({
      where: { id_permission },
    });
  }

  /**
   * Eliminar todos los permisos de un rol
   */
  static async deleteAllAssignedPermissionsByRole(id_role) {
    return await prisma.assigned_permissions.deleteMany({
      where: { id_role },
    });
  }

  /**
   * Verificar si existe un permiso duplicado
   */
  static async findAssignedPermission(id_role, id_module, id_privilege) {
    return await prisma.assigned_permissions.findUnique({
      where: {
        id_role_id_module_id_privilege: {
          id_role,
          id_module,
          id_privilege,
        },
      },
    });
  }

  /**
   * Cambiar estado de un rol (activar/desactivar)
   */
  static async updateRoleStatus(id_role, id_status) {
    return await prisma.roles.update({
      where: { id_role },
      data: { id_status },
      include: {
        assigned_permissions: {
          include: {
            modules: true,
            privileges: true,
          },
        },
      },
    });
  }
}