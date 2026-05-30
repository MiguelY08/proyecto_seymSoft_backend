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
 * Obtener módulos por IDs
 */
static async findModulesByIds(ids) {
  return await prisma.modules.findMany({
    where: {
      id_module: {
        in: ids,
      },
    },
  });
}

/**
 * Obtener privilegios por IDs
 */
static async findPrivilegesByIds(ids) {
  return await prisma.privileges.findMany({
    where: {
      id_privilege: {
        in: ids,
      },
    },
  });
}

/**
 * Crear múltiples permisos de una vez
 */
static async createManyAssignedPermissions(permissions) {
  return await prisma.assigned_permissions.createMany({
    data: permissions,
    skipDuplicates: true,
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

  /**
 * Eliminar employee_roles relacionados a un rol
 * Evita errores de FK antes de borrar permisos
 */
static async deleteEmployeeRolesByRole(id_role) {
  return await prisma.employee_roles.deleteMany({
    where: {
      assigned_permissions: {
        id_role,
      },
    },
  });
}

/**
 * Ejecutar actualización completa en transacción
 */
static async updateRolePermissionsTransaction(
  id_role,
  roleData,
  permissions
) {
  return await prisma.$transaction(async (tx) => {

    // Actualizar rol
    await tx.roles.update({
      where: { id_role },
      data: {
        name_role: roleData.name_role,
        description: roleData.description || null,
      },
    });

    // Primero eliminar employee_roles dependientes
    await tx.employee_roles.deleteMany({
      where: {
        assigned_permissions: {
          id_role,
        },
      },
    });

    // Después eliminar permisos
    await tx.assigned_permissions.deleteMany({
      where: {
        id_role,
      },
    });

    // Crear permisos nuevos
    if (permissions.length > 0) {
      await tx.assigned_permissions.createMany({
        data: permissions,
        skipDuplicates: true,
      });
    }

    // Obtener rol actualizado
    return await tx.roles.findUnique({
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

  });
}
}