import { prisma } from '../../../../config/prisma.js';
import { ClientMapper } from '../mappers/clientMapper.js';

export class ClientRepository {

  static async findAllWithFilters(filters) {
    const { page = 1, limit = 13, search, personType, idStatus, sortBy = 'id_client', sortOrder = 'asc' } = filters;
    const skip = (page - 1) * limit;

    const where = {};

    if (personType) {
      where.person_type = personType;
    }

    if (idStatus !== undefined && idStatus !== null && idStatus !== '') {
      where.users = { id_status: Number(idStatus) };
    }

    if (search) {
      where.OR = [
        { doc_number: { contains: search } },
        { users: { full_name: { contains: search, mode: 'insensitive' } } },
        { users: { email: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const [clients, total] = await Promise.all([
      prisma.clients.findMany({
        where,
        include: { users: true },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder }
      }),
      prisma.clients.count({ where })
    ]);

    return {
      data: clients.map(ClientMapper.toDTO),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  static async findById(id) {
    const client = await prisma.clients.findUnique({
      where: { id_client: id },
      include: { users: true }
    });
    return client ? ClientMapper.toDTO(client) : null;
  }

  static async create(clientData, userId, db = prisma) {
    const client = await db.clients.create({
      data: {
        person_type: clientData.personType,
        doc_type: clientData.documentType,
        doc_number: String(clientData.document),
        address: clientData.address,
        contact_person_name: clientData.contactName || null,
        contact_person_number: clientData.contactPhone ? String(clientData.contactPhone) : null,
        rut: clientData.rut === 'si',
        codigo_ciu: clientData.ciuCode || null,
        client_type: clientData.clientType,
        credit: clientData.clientCredit ? parseFloat(clientData.clientCredit) : null,
        credit_balance: clientData.credit_balance !== undefined ? parseFloat(clientData.credit_balance) : 0,
        id_user: userId
      },
      include: { users: true }
    });
    return ClientMapper.toDTO(client);
  }

  static async update(id, updateData) {
    const data = {};

    if (updateData.address !== undefined) data.address = updateData.address;
    if (updateData.contactName !== undefined) data.contact_person_name = updateData.contactName;
    if (updateData.contactPhone !== undefined) data.contact_person_number = updateData.contactPhone ? String(updateData.contactPhone) : null;
    if (updateData.rut !== undefined) data.rut = updateData.rut === 'si';
    if (updateData.ciuCode !== undefined) data.codigo_ciu = updateData.ciuCode;
    if (updateData.clientType !== undefined) data.client_type = updateData.clientType;
    if (updateData.clientCredit !== undefined) data.credit = parseFloat(updateData.clientCredit) || null;
    if (updateData.credit_balance !== undefined) data.credit_balance = parseFloat(updateData.credit_balance) || 0;

    const client = await prisma.clients.update({
      where: { id_client: id },
      data,
      include: { users: true }
    });
    return ClientMapper.toDTO(client);
  }

  static async delete(id) {
    await prisma.clients.delete({ where: { id_client: id } });
    return true;
  }

  static async updateUserStatus(userId, idStatus) {
    await prisma.users.update({
      where: { id_user: userId },
      data: { id_status: idStatus }
    });
  }

  static async findById(id) {

  const client = await prisma.clients.findUnique({
    where: { id_client: id },
    include: { users: true }
  });

  return client ? ClientMapper.toDTO(client) : null;
}

  static async isUserAlreadyClient(userId) {
    const client = await prisma.clients.findUnique({ where: { id_user: userId } });
    return !!client;
  }

  static async findCreditBalanceEvents({ clientId = null, limit = 50 } = {}) {
    const returns = await prisma.sales_returns.findMany({
      where: clientId
        ? {
            returnable_sale_data: {
              path: ['clientId'],
              equals: Number(clientId)
            }
          }
        : undefined,
      select: {
        id_sales_return: true,
        return_number: true,
        returnable_sale_data: true
      },
      orderBy: { updated_at: 'desc' },
      take: 200
    });

    const events = returns.flatMap((saleReturn) => {
      const data = saleReturn.returnable_sale_data || {};
      const returnEvents = Array.isArray(data.creditEvents) ? data.creditEvents : [];
      return returnEvents.map((event) => ({
        ...event,
        returnId: event.returnId || saleReturn.id_sales_return,
        returnNumber: event.returnNumber || saleReturn.return_number,
        clientName: data.clientName || 'Cliente'
      }));
    });

    return events
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, Math.max(1, Math.min(Number(limit) || 50, 100)));
  }
}
