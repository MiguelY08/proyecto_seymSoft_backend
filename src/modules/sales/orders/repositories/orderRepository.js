import { prisma } from '../../../../config/prisma.js';
import {
  ORDER_STATUSES,
  PAYMENT_STATUSES,
} from '../../../../shared/constants/generalStatuses.js';

const getPaymentStatusById = (id) =>
  PAYMENT_STATUSES[Number(id)] || PAYMENT_STATUSES[1];

const getPaymentStatusByName = (name) =>
  Object.values(PAYMENT_STATUSES).find(
    (status) => status.name === name
  ) || PAYMENT_STATUSES[1];

const resolvePaymentStatus = (data = {}) => {
  if (data.idPaymentStatus) {
    return getPaymentStatusById(data.idPaymentStatus);
  }

  if (data.paymentStatus) {
    return getPaymentStatusByName(data.paymentStatus);
  }

  return PAYMENT_STATUSES[1];
};

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
    payment_statuses: true,
    order_payments: {
      include: {
        payment_methods: true,
      },
      orderBy: {
        id_order_payment: 'asc',
      },
    },
    sales: {
      select: {
        id_sale: true,
        id_order: true,
        id_sale_status: true,
        id_sale_type: true,
        subtotal: true,
        sale_date: true,
      },
    },
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

    if (filters.paymentStatusId) {
      where.id_payment_status = Number(filters.paymentStatusId);
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
    const paymentStatus = resolvePaymentStatus(data);

    return prisma.$transaction(async (tx) => {
      const order = await tx.sales_orders.create({
        data: {
          id_customer: Number(data.idClient),
          id_order_status: Number(data.idOrderStatus || ORDER_STATUSES[1].id),
          delivery_adress: data.deliveryAddress,
          delivery_type: data.deliveryType || 'Recoge',
          payment_status: paymentStatus.name,
          id_payment_status: paymentStatus.id,
          payment_deadline: data.paymentDeadline || data.payment_deadline || null,
          subtotal: data.subtotal,
          iva_amount: data.ivaAmount,
          total: data.total,
        },
      });

      await tx.order_details.createMany({
        data: data.items.map((item) => ({
          id_order: order.id_order,
          id_product: Number(item.idProduct ?? item.id_product),
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
    const paymentStatus = resolvePaymentStatus(data);

    return prisma.$transaction(async (tx) => {
      await tx.sales_orders.update({
        where: {
          id_order: Number(id),
        },
        data: {
          id_customer: Number(data.idClient),
          id_order_status: Number(data.idOrderStatus || ORDER_STATUSES[1].id),
          delivery_adress: data.deliveryAddress,
          delivery_type: data.deliveryType,
          payment_status: paymentStatus.name,
          id_payment_status: paymentStatus.id,
          payment_deadline: data.paymentDeadline || data.payment_deadline || undefined,
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
        id_order_status: ORDER_STATUSES[4].id,
      },
      ...orderInclude,
    });
  }

  async createPayment(idOrder, data) {
    return prisma.order_payments.create({
      data: {
        id_order: Number(idOrder),
        id_payment_method: Number(data.idPaymentMethod),
        amount: Number(data.amount),
        observations: data.observations || null,
        reference: data.reference || null,
        payment_date: data.paymentDate || data.payment_date || undefined,
      },
      include: {
        payment_methods: true,
      },
    });
  }

  async sumPaymentsByOrderId(idOrder) {
    const result = await prisma.order_payments.aggregate({
      where: {
        id_order: Number(idOrder),
      },
      _sum: {
        amount: true,
      },
    });

    return Number(result._sum.amount || 0);
  }

  async updatePaymentStatus(idOrder, idPaymentStatus) {
    const paymentStatus = getPaymentStatusById(idPaymentStatus);

    return prisma.sales_orders.update({
      where: {
        id_order: Number(idOrder),
      },
      data: {
        id_payment_status: paymentStatus.id,
        payment_status: paymentStatus.name,
      },
      ...orderInclude,
    });
  }

  async findPendingOrdersForPaymentReminders(now = new Date()) {
    const currentDate = new Date(now);
    const reminder6hLimit = new Date(currentDate.getTime() + 6 * 60 * 60 * 1000);
    const reminder1hLimit = new Date(currentDate.getTime() + 1 * 60 * 60 * 1000);

    return prisma.sales_orders.findMany({
      where: {
        id_payment_status: PAYMENT_STATUSES[1].id,
        id_order_status: {
          not: ORDER_STATUSES[4].id,
        },
        payment_deadline: {
          not: null,
          gt: currentDate,
        },
        payment_expired_at: null,
        OR: [
          {
            payment_reminder_6h_sent: false,
            payment_deadline: {
              gt: currentDate,
              lte: reminder6hLimit,
            },
          },
          {
            payment_reminder_1h_sent: false,
            payment_deadline: {
              gt: currentDate,
              lte: reminder1hLimit,
            },
          },
        ],
      },
      ...orderInclude,
      orderBy: {
        payment_deadline: 'asc',
      },
    });
  }

  async findExpiredPendingOrders(now = new Date()) {
    return prisma.sales_orders.findMany({
      where: {
        id_payment_status: PAYMENT_STATUSES[1].id,
        id_order_status: {
          not: ORDER_STATUSES[4].id,
        },
        payment_deadline: {
          not: null,
          lte: new Date(now),
        },
        payment_expired_at: null,
      },
      ...orderInclude,
      orderBy: {
        payment_deadline: 'asc',
      },
    });
  }

  async markPaymentReminder6hSent(idOrder) {
    return prisma.sales_orders.update({
      where: {
        id_order: Number(idOrder),
      },
      data: {
        payment_reminder_6h_sent: true,
      },
      ...orderInclude,
    });
  }

  async markPaymentReminder1hSent(idOrder) {
    return prisma.sales_orders.update({
      where: {
        id_order: Number(idOrder),
      },
      data: {
        payment_reminder_1h_sent: true,
      },
      ...orderInclude,
    });
  }

  async expirePendingOrder(idOrder, reason = 'Pedido cancelado por vencimiento de pago.') {
    return prisma.sales_orders.update({
      where: {
        id_order: Number(idOrder),
      },
      data: {
        id_order_status: ORDER_STATUSES[4].id,
        payment_expired_at: new Date(),
        payment_expiration_reason: reason,
      },
      ...orderInclude,
    });
  }

  async findPaymentMethodById(idPaymentMethod) {
    return prisma.payment_methods.findUnique({
      where: {
        id_payment_method: Number(idPaymentMethod),
      },
    });
  }

  async findSaleByOrderId(idOrder) {
    return prisma.sales.findUnique({
      where: {
        id_order: Number(idOrder),
      },
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
