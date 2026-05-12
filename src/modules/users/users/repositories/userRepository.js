import { prisma } from "../../../../config/prisma.js";
import { UserMapper } from "../mappers/usersMapper.js";

export class UserRepository {

  static async create(data) {
    const user = await prisma.users.create({
      data: {

        // doc_type: data.docType,
        // doc_number: data.docNumber,
        id_google: data.idGoogle || null,
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
        // doc_type: true,
        // doc_number: true,
        full_name: true,
        email: true,
        creation_date: true,
        phone: true,
        id_status: true,
      },
    });

    return users.map(UserMapper.toDomain);
  }

  /**
   * Obtener usuarios con paginación y filtros avanzados
   * 
   * @param {Object} filters - Objeto con parámetros de filtrado
   * @param {number} filters.page - Número de página (default: 1)
   * @param {number} filters.limit - Usuarios por página (default: 10)
   * @param {number} filters.status - ID de estado (opcional)
   * @param {string} filters.docType - Tipo de documento: CC, CE, NIT, TI, PP (opcional)
   * @param {string} filters.search - Buscar en nombre, email o doc (opcional)
   * @param {string} filters.sortBy - Campo para ordenar: name, email, date (default: date)
   * @param {string} filters.order - Orden: asc, desc (default: desc)
   * 
   * @returns {Object} { users: [], total, page, limit, totalPages }
   * 
   * Ejemplo:
   * const result = await UserRepository.findAllWithFilters({
   *   page: 1,
   *   limit: 10,
   *   status: 1,
   *   search: "juan",
   *   sortBy: "name",
   *   order: "asc"
   * });
   */
  static async findAllWithFilters(filters = {}) {
    const {
      page = 1,
      limit = 10,
      status,
      docType,
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

    if (docType) {
      where.doc_type = docType.toUpperCase();
    }

    if (search) {
      // Buscar en nombre, email o número de documento
      where.OR = [
        { full_name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { doc_number: isNaN(search) ? undefined : Number(search) },
      ].filter(condition => Object.values(condition)[0] !== undefined);
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
          // doc_type: true,
          // doc_number: true,
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
        // doc_type: true,
        // doc_number: true,
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

  // static async findByDocNumber(docNumber) {
  //   const user = await prisma.users.findUnique({
  //     where: { doc_number: docNumber }
  //   });
  //   return user;
  // }

  static async update(id, data) {
    const user = await prisma.users.update({
      where: { id_user: id },
      data: {
        // ...(data.docType && { doc_type: data.docType }),
        // ...(data.docNumber && { doc_number: data.docNumber }),
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
}