import { prisma } from '../../../../config/prisma.js';

export class ProviderRepository {
  async findAll({ page, limit, search, personType, idStatus, sortBy, sortOrder }) {
    const skip = (page - 1) * limit;
    const where = {};
    
    if (personType) where.person_type = personType;
    if (idStatus !== undefined && idStatus !== null) where.id_status = idStatus;
    
    if (search) {
      where.OR = [
        { name_provider: { contains: search, mode: 'insensitive' } },
        { lastname: { contains: search, mode: 'insensitive' } },
        { document_number: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    const orderByConfig = {};
    const sortField = sortBy || 'id_provider';
    const sortDirection = sortOrder || 'asc';
    orderByConfig[sortField] = sortDirection;
    
    const [providers, total] = await Promise.all([
      prisma.providers.findMany({
        where,
        skip,
        take: limit,
        orderBy: orderByConfig,
        include: {
          provider_categories: {
            include: { categories: true }
          }
        }
      }),
      prisma.providers.count({ where })
    ]);
    
    return { providers: providers || [], total: total || 0 };
  }
  
  async findById(id) {
    return prisma.providers.findUnique({
      where: { id_provider: parseInt(id) },
      include: {
        provider_categories: {
          include: { categories: true }
        }
      }
    });
  }
  
  async existsByDocumentNumber(documentNumber, excludeId = null) {
    if (!documentNumber) return false;
    const where = { document_number: documentNumber };
    if (excludeId) where.id_provider = { not: parseInt(excludeId) };
    const provider = await prisma.providers.findFirst({ where });
    return !!provider;
  }
  
  async existsByEmail(email, excludeId = null) {
    if (!email) return false;
    const where = { email };
    if (excludeId) where.id_provider = { not: parseInt(excludeId) };
    const provider = await prisma.providers.findFirst({ where });
    return !!provider;
  }
  
  async create(data, categoryIds = []) {
    return prisma.providers.create({
      data: {
        ...data,
        provider_categories: {
          create: categoryIds.map(categoryId => ({
            categories: { connect: { id_category: categoryId } }
          }))
        }
      },
      include: {
        provider_categories: {
          include: { categories: true }
        }
      }
    });
  }
  
  async update(id, data, categoryIds = null) {
    // Si se proporcionan categoryIds, actualizar la relación
    if (categoryIds !== null) {
      // Eliminar relaciones existentes
      await prisma.provider_categories.deleteMany({
        where: { id_provider: parseInt(id) }
      });
      
      // Crear nuevas relaciones
      if (categoryIds.length > 0) {
        await prisma.provider_categories.createMany({
          data: categoryIds.map(categoryId => ({
            id_provider: parseInt(id),
            id_category: categoryId
          }))
        });
      }
    }
    
    return prisma.providers.update({
      where: { id_provider: parseInt(id) },
      data,
      include: {
        provider_categories: {
          include: { categories: true }
        }
      }
    });
  }
  
  async delete(id) {
    return prisma.providers.delete({
      where: { id_provider: parseInt(id) }
    });
  }
  
  async updateStatus(id, idStatus) {
    return prisma.providers.update({
      where: { id_provider: parseInt(id) },
      data: { id_status: idStatus }
    });
  }
}