import { prisma } from '../../../../config/prisma.js';

const orderInclude = {
  include: {
    clients: {
      include: {
        users: {
          select: {
            id_user: true,
            full_name: true,
            email: true,
            phone: true,
          },
        },
      },
    },
    order_statuses: true,
    order_details: {
      include: {
        products: {
        select: {
          id_product: true,
          name: true,
          reference: true,
          iva_percentage: true,

          retail_price: true,
          wholesale_price: true,
          partner_price: true,
          bulk_price: true,
        },
      },
      },
      orderBy: {
        id_order_detail: 'asc',
      },
    },
  },
};

export class OrderRepository {
  async findAll(filters = {}) {
    const where = {};

    if (filters.statusId) {
      where.id_order_status = Number(filters.statusId);
    }

    if (filters.paymentStatus && filters.paymentStatus !== 'Todos') {
      where.payment_status = filters.paymentStatus;
    }

    if (filters.deliveryType && filters.deliveryType !== 'Todos') {
      where.delivery_type = filters.deliveryType;
    }

    if (filters.startDate || filters.endDate) {
      where.order_date = {};

      if (filters.startDate) {
        where.order_date.gte = new Date(filters.startDate);
      }

      if (filters.endDate) {
        where.order_date.lte = new Date(filters.endDate);
      }
    }

    return prisma.sales_orders.findMany({
      where,
      ...orderInclude,
      orderBy: {
        id_order: 'desc',
      },
    });
  }

  async findById(id) {
    return prisma.sales_orders.findUnique({
      where: {
        id_order: Number(id),
      },
      ...orderInclude,
    });
  }

  async findProductByBarcode(barcode) {
    return prisma.barcodes.findUnique({
      where: {
        barcode,
      },
      include: {
        products: true,
      },
    });
  }

  async create(data) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.sales_orders.create({
        data: {
          id_customer: Number(data.idClient),
          id_order_status: Number(data.idOrderStatus || 1),
          delivery_adress: data.deliveryAddress,
          delivery_type: data.deliveryType || 'Recoge',
          payment_status: data.paymentStatus || 'Pendiente',
          subtotal: data.subtotal,
          iva_amount: data.ivaAmount,
          total: data.total,
        },
      });

      await tx.order_details.createMany({
        data: data.items.map((item) => ({
          id_order: order.id_order,
          id_product: item.idProduct ?? item.id_product,
          barcode: item.barcode,
          quantity: Number(item.quantity),
          unit_price: item.unitPrice,
          subtotal: item.subtotal,
          iva_amount: item.ivaAmount,
        })),
      });

      return tx.sales_orders.findUnique({
        where: {
          id_order: order.id_order,
        },
        ...orderInclude,
      });
    });
  }

  async update(id, data) {
    return prisma.$transaction(async (tx) => {
      await tx.sales_orders.update({
        where: {
          id_order: Number(id),
        },
        data: {
          id_customer: Number(data.idClient),
          id_order_status: Number(data.idOrderStatus || 1),
          delivery_adress: data.deliveryAddress,
          delivery_type: data.deliveryType,
          payment_status: data.paymentStatus,
          subtotal: data.subtotal,
          iva_amount: data.ivaAmount,
          total: data.total,
        },
      });

      await tx.order_details.deleteMany({
        where: {
          id_order: Number(id),
        },
      });

      await tx.order_details.createMany({
        data: data.items.map((item) => ({
          id_order: Number(id),
          id_product: Number(item.idProduct),
          barcode: item.barcode,
          quantity: Number(item.quantity),
          unit_price: item.unitPrice,
          subtotal: item.subtotal,
          iva_amount: item.ivaAmount,
        })),
      });

      return tx.sales_orders.findUnique({
        where: {
          id_order: Number(id),
        },
        ...orderInclude,
      });
    });
  }

  async cancel(id) {
    return prisma.sales_orders.update({
      where: {
        id_order: Number(id),
      },
      data: {
        id_order_status: 4,
      },
      ...orderInclude,
    });
  }

async findClientById(idClient) {
  return prisma.clients.findUnique({
    where: {
      id_client: Number(idClient),
    },
    include: {
      users: true,
    },
  });
}


async findBarcodeByProduct(idProduct, barcode) {
  return prisma.barcodes.findFirst({
    where: {
      id_product: Number(idProduct),
      barcode,
    },
    include: {
      products: {
        select: {
          id_product: true,
          name: true,
          iva_percentage: true,

          retail_price: true,
          wholesale_price: true,
          partner_price: true,
          bulk_price: true,
        },
      },
    },
  });
}
}