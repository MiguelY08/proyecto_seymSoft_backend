import { prisma } from "../../../config/prisma.js";
import { UserMapper } from "../mappers/usersMapper.js";

export class UserRepository {

  static async create(data) {

    const user =
      await prisma.users.create({

        data: {

          id_google:
            data.idGoogle || null,

          token_version: 0,

          full_name:
            data.fullName,

          email:
            data.email,

          pass_word:
            data.password,

          phone:
            data.phone,

          id_status:
            data.idStatus

        }

      });

    return UserMapper.toDomain(
      user
    );

  }

  /**
   * Asignar rol a usuario
   */
  static async assignRole(
    idUser,
    idRole
  ) {

    // Validar rol
    const role =
      await prisma.roles.findUnique({

        where: {
          id_role: idRole
        }

      });

    if (!role) {

      throw new Error(
        "Rol no encontrado"
      );

    }

    // Obtener cualquier permiso del rol
    const assignedPermission =
      await prisma.assigned_permissions.findFirst({

        where: {
          id_role: idRole
        },

        orderBy: {
          id_permission: "asc"
        }

      });

    if (!assignedPermission) {

      throw new Error(
        "El rol no tiene permisos asignados"
      );

    }

    // Buscar empleado asociado
    let employee =
      await prisma.employees.findUnique({

        where: {
          id_user: idUser
        }

      });

    // Si no existe lo crea
    if (!employee) {

      employee =
        await prisma.employees.create({

          data: {
            id_user: idUser
          }

        });

    }

    // Buscar si ya tiene rol
    const existingRole =
      await prisma.employee_roles.findFirst({

        where: {
          id_employee:
            employee.id_employee
        }

      });

    // Actualizar rol existente
    if (existingRole) {

      return await prisma.employee_roles.update({

        where: {

          id_employee_role:
            existingRole.id_employee_role

        },

        data: {

          assigned_permissions: {
            connect: {
              id_permission:
                assignedPermission.id_permission
            }
          }

        }

      });

    }

    // Crear relación nueva
    return await prisma.employee_roles.create({

      data: {

        employees: {
          connect: {
            id_employee:
              employee.id_employee
          }
        },

        assigned_permissions: {
          connect: {
            id_permission:
              assignedPermission.id_permission
          }
        }

      }

    });

  }

  static async findAll() {

    const users =
      await prisma.users.findMany({

        select: {

          id_user: true,
          full_name: true,
          email: true,
          creation_date: true,
          phone: true,
          id_status: true

        }

      });

    return users.map(
      UserMapper.toDomain
    );

  }

  static async findById(id) {

    return await prisma.users.findUnique({

      where: {
        id_user: id
      },

      select: {

        id_user: true,
        full_name: true,
        email: true,
        creation_date: true,
        phone: true,
        id_status: true

      }

    });

  }

  static async findByEmail(email) {

    return await prisma.users.findUnique({

      where: {
        email
      }

    });

  }

  static async update(
    id,
    data
  ) {

    const user =
      await prisma.users.update({

        where: {
          id_user: id
        },

        data: {

          ...(data.fullName && {
            full_name:
              data.fullName
          }),

          ...(data.email && {
            email:
              data.email
          }),

          ...(data.phone !== undefined && {
            phone:
              data.phone
          }),

          ...(data.idStatus && {
            id_status:
              data.idStatus
          })

        }

      });

    return UserMapper.toDomain(
      user
    );

  }

  static async updateStatus(
    id,
    idStatus
  ) {

    const user =
      await prisma.users.update({

        where: {
          id_user: id
        },

        data: {
          id_status:
            idStatus
        }

      });

    return UserMapper.toDomain(
      user
    );

  }

  static async delete(id) {

    // Eliminar relaciones primero
    const employee =
      await prisma.employees.findUnique({

        where: {
          id_user: id
        }

      });

    if (employee) {

      await prisma.employee_roles.deleteMany({

        where: {
          id_employee:
            employee.id_employee
        }

      });

      await prisma.employees.delete({

        where: {
          id_employee:
            employee.id_employee
        }

      });

    }

    await prisma.users.delete({

      where: {
        id_user: id
      }

    });

    return true;

  }

  /**
   * Obtener usuario con rol y permisos
   */
  static async getUserWithRole(
    id_user
  ) {

    const user =
      await prisma.users.findUnique({

        where: {
          id_user
        },

        select: {

          id_user: true,
          full_name: true,
          email: true,
          phone: true,
          id_status: true,
          creation_date: true,
          token_version: true

        }

      });

    if (!user) {

      return null;

    }

    const employee =
      await prisma.employees.findUnique({

        where: {
          id_user
        },

        include: {

          employee_roles: {

            include: {

              assigned_permissions: {

                include: {

                  roles: true

                }

              }

            }

          }

        }

      });

    if (
      !employee ||
      !employee.employee_roles
    ) {

      return {

        user:
          UserMapper.toDomain(
            user
          ),

        role: null,

        permissions: []

      };

    }

    const assignedPermission =
      employee.employee_roles
      .assigned_permissions;

    const idRole =
      assignedPermission.id_role;

    const permissions =
      await prisma.assigned_permissions.findMany({

        where: {
          id_role:
            idRole
        },

        include: {

          modules: true,
          privileges: true

        }

      });

    return {

      user:
        UserMapper.toDomain(
          user
        ),

      role: {

        idRole:
          assignedPermission
          .roles
          .id_role,

        nameRole:
          assignedPermission
          .roles
          .name_role,

        description:
          assignedPermission
          .roles
          .description,

        idStatus:
          assignedPermission
          .roles
          .id_status

      },

      permissions:
        permissions.map(
          p => ({

            idPermission:
              p.id_permission,

            idModule:
              p.id_module,

            module:
              p.modules
              .name_module,

            idPrivilege:
              p.id_privilege,

            privilege:
              p.privileges
              .name_privilege

          })
        )

    };

  }

}