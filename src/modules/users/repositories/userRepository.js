import { prisma } from "../../../config/prisma.js";
import { UserMapper } from "../mappers/usersMapper.js";

export class UserRepository {

  static async create(data) {
    const user = await prisma.users.create({
      data: {
        id_google: data.idGoogle || null,
        token_version: 0,
        full_name: data.fullName,
        email: data.email,
        pass_word: data.password,
        phone: data.phone,
        id_status: data.idStatus,
        token_version: 0
      }
    });

    return UserMapper.toDomain(user);
  }

  /**
   * Obtener todos los usuarios (sin paginación - DEPRECATED)
   * Considera usar findAllWithFilters() en su lugar
   */
  static async findAll() {
    const users = await prisma.users.findMany({
      select: {
        id_user: true,
        full_name: true,
        email: true,
        creation_date: true,
        phone: true,
        id_status: true,
      },
    });

    return users.map(UserMapper.toDomain);
  }

  
  static async findAllWithFilters(filters = {}) {
    const {
      page = 1,
      limit = 10,
      status,
      search,
      sortBy = "date",
      order = "desc",
    } = filters;

    // Validar y convertir paginación
    const pageNum = Math.max(1, page);
    const limitNum = Math.min(Math.max(1, limit), 100); // Max 100 por seguridad
    const skip = (pageNum - 1) * limitNum;

    // Construir condiciones WHERE dinámicamente
    const where = {};

    if (status !== undefined) {
      where.id_status = status;
    }

    if (search) {
      // Buscar en nombre o email
      where.OR = [
        { full_name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    // Mapear sortBy a campo de BD
    const sortFieldMap = {
      name: "full_name",
      email: "email",
      date: "creation_date",
    };
    const sortField = sortFieldMap[sortBy] || "creation_date";

    // Validar order
    const validOrder = order.toLowerCase() === "asc" ? "asc" : "desc";

    // Ejecutar queries en paralelo
    const [users, total] = await Promise.all([
      prisma.users.findMany({
        where,
        select: {
          id_user: true,
          full_name: true,
          email: true,
          creation_date: true,
          phone: true,
          id_status: true,
        },
        orderBy: {
          [sortField]: validOrder,
        },
        skip,
        take: limitNum,
      }),
      prisma.users.count({ where }),
    ]);

    // Calcular datos de paginación
    const totalPages = Math.ceil(total / limitNum);

    return {
      users: users,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
      hasNextPage: pageNum < totalPages,
      hasPrevPage: pageNum > 1,
    };
  }

  static async findById(id) {
    const user = await prisma.users.findUnique({
      where: { id_user: id },
      select: {
        id_user: true,
        full_name: true,
        email: true,
        creation_date: true,
        phone: true,
        id_status: true,
      },
    });

    return user;
  }

  static async findByEmail(email) {
    const user = await prisma.users.findUnique({
      where: { email: email }
    });
    return user;
  }

  static async update(id, data) {
    const user = await prisma.users.update({
      where: { id_user: id },
      data: {
        ...(data.fullName && { full_name: data.fullName }),
        ...(data.email && { email: data.email }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.idStatus && { id_status: data.idStatus }),
      },
    });

    return UserMapper.toDomain(user);
  }

  static async updateStatus(id, idStatus) {
    const user = await prisma.users.update({
      where: { id_user: id },
      data: {
        id_status: idStatus
      }
    });

    return UserMapper.toDomain(user);
  }

  static async delete(id) {
    await prisma.users.delete({
      where: { id_user: id }
    });

    return true;
  }

  /**
 * Obtiene usuario con su rol y permisos
 * Maneja casos donde el usuario no tiene employee/rol
 */

/**
 * MÉTODO CORREGIDO PARA UserRepository
 * 
 * Obtiene usuario con su rol y permisos
 * Maneja el hecho de que employee_roles es singular (1-1)
 */

/**
 * MÉTODO FINAL getUserWithRole para UserRepository
 * 
 * Obtiene usuario con su rol y TODOS los permisos del rol
 * 
 * Flujo:
 * 1. Obtén usuario
 * 2. Busca employee del usuario
 * 3. Si existe employee_roles → obtén assigned_permission
 * 4. De assigned_permission obtén id_role
 * 5. Obtén TODOS los assigned_permissions de ese role
 * 6. Retorna usuario con role completo y todos sus permisos
 */

static async getUserWithRole(id_user) {
  // 1. Obtén usuario
  const user = await prisma.users.findUnique({
    where: { id_user },
    select: {
      id_user: true,
      full_name: true,
      email: true,
      phone: true,
      id_status: true,
      creation_date: true,
      token_version: true,
    },
  });

  if (!user) {
    return null;
  }

  // 2. Busca employee vía id_user (relación UNIQUE)
  const employee = await prisma.employees.findUnique({
    where: { id_user },
    include: {
      employee_roles: {
        include: {
          assigned_permissions: {
            include: {
              roles: true,
            },
          },
        },
      },
    },
  });

  // 3. Si NO existe employee → usuario sin rol (cliente)
  if (!employee || !employee.employee_roles) {
    return {
      user: UserMapper.toDomain(user),
      role: null,
      permissions: [],
    };
  }

  // 4. Obtén assigned_permission del employee_roles
  const assignedPermission = employee.employee_roles.assigned_permissions;

  // 5. Si NO tiene assigned_permission
  if (!assignedPermission) {
    return {
      user: UserMapper.toDomain(user),
      role: null,
      permissions: [],
    };
  }

  // 6. Obtén id_role de assigned_permission
  const idRole = assignedPermission.id_role;
  const role = assignedPermission.roles;

  // 7. Obtén TODOS los assigned_permissions del rol
  const allRolePermissions = await prisma.assigned_permissions.findMany({
    where: { id_role: idRole },
    include: {
      modules: true,
      privileges: true,
    },
  });

  // 8. Mapea TODOS los permisos del rol
  const permissions = allRolePermissions.map((perm) => ({
    idPermission: perm.id_permission,
    idRole: perm.id_role,
    idModule: perm.id_module,
    nameModule: perm.modules.name_module,
    idPrivilege: perm.id_privilege,
    namePrivilege: perm.privileges.name_privilege,
  }));

  // 9. Mapea rol
  const mappedRole = role
    ? {
        idRole: role.id_role,
        nameRole: role.name_role,
        description: role.description,
        idStatus: role.id_status,
      }
    : null;

  return {
    user: UserMapper.toDomain(user),
    role: mappedRole,
    permissions,
  };
}
}