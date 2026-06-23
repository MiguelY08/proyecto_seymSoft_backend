import { prisma } from '../../../../config/prisma.js';
import {
  ORDER_STATUSES,
  PAYMENT_STATUSES,
} from '../../../../shared/constants/generalStatuses.js';
import { normalizeDeliveryType } from '../../shared/deliveryTypes.js';

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

const normalizeDeliveryTypeFilter = (value) => {
  try {
    return normalizeDeliveryType(value);
  } catch {
    return null;
  }
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
    order_payment_receipts: {
      orderBy: {
        id_order_payment_receipt: 'desc',
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
    employees: {
      select: {
        id_employee: true,
        users: {
          select: {
            id_user: true,
            full_name: true,
            email: true,
          },
        },
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
            product_images: {
              select: {
                id_image: true,
                image_url: true,
                is_primary: true,
              },
              orderBy: [
                {
                  is_primary: 'desc',
                },
                {
                  id_image: 'asc',
                },
              ],
            },
          },
        },
      },
      orderBy: {
        id_order_detail: 'asc',
      },
    },
  },
};

const orderSummarySelect = {
  id_order: true,
  id_customer: true,
  order_date: true,
  id_order_status: true,
  delivery_adress: true,
  subtotal: true,
  iva_amount: true,
  total: true,
  payment_status: true,
  delivery_type: true,
  payment_deadline: true,
  payment_reminder_6h_sent: true,
  payment_reminder_1h_sent: true,
  payment_expired_at: true,
  payment_expiration_reason: true,
  id_payment_status: true,
  assigned_employee: true,
  cancellation_reason: true,
  cancelled_at: true,
  employees: {
    select: {
      id_employee: true,
      users: {
        select: {
          id_user: true,
          full_name: true,
          email: true,
        },
      },
    },
  },
  clients: {
    select: {
      id_client: true,
      client_type: true,
      credit: true,
      address: true,
      users: {
        select: {
          full_name: true,
          email: true,
          phone: true,
        },
      },
    },
  },
  order_statuses: true,
  payment_statuses: true,
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
  order_payments: {
    select: {
      id_order_payment: true,
      id_payment_method: true,
      amount: true,
      payment_date: true,
      observations: true,
      reference: true,
      created_at: true,
      payment_methods: true,
    },
    orderBy: {
      id_order_payment: 'asc',
    },
  },
  order_payment_receipts: {
    select: {
      id_order_payment_receipt: true,
      id_order: true,
      image_url: true,
      file_name: true,
      observations: true,
      verification_status: true,
      uploaded_at: true,
    },
    orderBy: {
      id_order_payment_receipt: 'desc',
    },
  },
  order_details: {
    select: {
      id_order_detail: true,
      id_product: true,
      barcode: true,
      quantity: true,
      unit_price: true,
      subtotal: true,
      iva_amount: true,
      products: {
        select: {
          name: true,
          product_images: {
            select: {
              id_image: true,
              image_url: true,
              is_primary: true,
            },
            orderBy: [
              {
                is_primary: 'desc',
              },
              {
                id_image: 'asc',
              },
            ],
          },
        },
      },
    },
    orderBy: {
      id_order_detail: 'asc',
    },
  },
};

const orderListSelect = {
  id_order: true,
  id_customer: true,
  order_date: true,
  id_order_status: true,
  delivery_adress: true,
  subtotal: true,
  iva_amount: true,
  total: true,
  payment_status: true,
  delivery_type: true,
  payment_deadline: true,
  payment_reminder_6h_sent: true,
  payment_reminder_1h_sent: true,
  payment_expired_at: true,
  payment_expiration_reason: true,
  id_payment_status: true,
  assigned_employee: true,
  cancellation_reason: true,
  cancelled_at: true,
  employees: {
    select: {
      id_employee: true,
      users: {
        select: {
          id_user: true,
          full_name: true,
          email: true,
        },
      },
    },
  },
  clients: {
    select: {
      id_client: true,
      client_type: true,
      credit: true,
      address: true,
      users: {
        select: {
          full_name: true,
          email: true,
          phone: true,
        },
      },
    },
  },
  order_statuses: true,
  payment_statuses: true,
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
  order_payments: {
    select: {
      id_order_payment: true,
      id_payment_method: true,
      amount: true,
      payment_date: true,
      observations: true,
      reference: true,  
      created_at: true,
      payment_methods: {
        select: {
          id_payment_method: true,
          name_payment_method: true,
        },
      },
    },
    orderBy: {
      id_order_payment: 'asc',
    },
  },
  order_payment_receipts: {
    select: {
      id_order_payment_receipt: true,
      id_order: true,
      image_url: true,
      file_name: true,
      observations: true,
      verification_status: true,
      uploaded_at: true,
    },
    orderBy: {
      id_order_payment_receipt: 'desc',
    },
  },
  order_details: {
    select: {
      id_order_detail: true,
      id_product: true,
      barcode: true,
      quantity: true,
      unit_price: true,
      subtotal: true,
      iva_amount: true,
      products: {
        select: {
          name: true,
          product_images: {
            select: {
              id_image: true,
              image_url: true,
              is_primary: true,
            },
            orderBy: [
              {
                is_primary: 'desc',
              },
              {
                id_image: 'asc',
              },
            ],
          },
        },
      },
    },
    orderBy: {
      id_order_detail: 'asc',
    },
  },
};
export class OrderRepository {
  async findAll(filters = {}) {
    const where = {};
    const page = Math.max(Number(filters.page) || 1, 1);
    const limit = Math.min(Math.max(Number(filters.limit) || 10, 1), 100);
    const skip = (page - 1) * limit;

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
      const deliveryType = normalizeDeliveryTypeFilter(filters.deliveryType);

      if (deliveryType) {
        where.delivery_type = deliveryType;
      }
    }

    if (filters.startDate || filters.endDate) {
      where.order_date = {};

      if (filters.startDate) {
        where.order_date.gte = new Date(`${filters.startDate}T00:00:00.000Z`);
      }

      if (filters.endDate) {
        where.order_date.lte = new Date(`${filters.endDate}T23:59:59.999Z`);
      }
    }

    const [orders, total] = await Promise.all([
      prisma.sales_orders.findMany({
        where,
        select:
          orderListSelect,
        orderBy: {
          id_order: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.sales_orders.count({
        where,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      orders,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }

  async findById(id) {
    return prisma.sales_orders.findUnique({
      where: {
        id_order: Number(id),
      },
      ...orderInclude,
    });
  }

  async findSummaryById(id) {
    return prisma.sales_orders.findUnique({
      where: {
        id_order: Number(id),
      },
      select:
        orderSummarySelect,
    });
  }

  async findUpdateStateById(id) {
    return prisma.sales_orders.findUnique({
      where: {
        id_order: Number(id),
      },
      select: {
        id_order: true,
        id_order_status: true,
        id_payment_status: true,
        order_statuses: {
          select: {
            name_status: true,
          },
        },
        sales: {
          select: {
            id_sale: true,
          },
        },
        order_details: {
          select: {
            id_product: true,
            barcode: true,
            quantity: true,
          },
        },
      },
    });
  }

  async findPaymentStateById(id) {
    return prisma.sales_orders.findUnique({
      where: {
        id_order: Number(id),
      },
      select: {
        id_order: true,
        id_order_status: true,
        id_payment_status: true,
        total: true,
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
        order_payments: {
          select: {
            id_payment_method: true,
            amount: true,
          },
        },
      },
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

    const idOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.sales_orders.create({
        data: {
          clients: {
            connect: {
              id_client: Number(data.idClient),
            },
          },
          order_statuses: {
            connect: {
              id_order_status: Number(data.idOrderStatus || ORDER_STATUSES[1].id),
            },
          },
          delivery_adress: data.deliveryAddress,
          delivery_type: data.deliveryType || 'Recoge',
          payment_status: paymentStatus.name,
          payment_statuses: {
            connect: {
              id_payment_status: paymentStatus.id,
            },
          },
          payment_deadline: data.paymentDeadline || data.payment_deadline || null,
          ...(data.idEmployee && {
            employees: {
              connect: {
                id_employee: Number(data.idEmployee),
              },
            },
          }),
          subtotal: data.subtotal,
          iva_amount: data.ivaAmount,
          total: data.total,
        },
        select: {
          id_order: true,
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

      if (data.initialPayments?.length) {
        await tx.order_payments.createMany({
          data: data.initialPayments.map((payment) => ({
            id_order: order.id_order,
            id_payment_method: Number(payment.idPaymentMethod),
            amount: Number(payment.amount),
            observations: payment.observations || 'Pago registrado desde ventas.',
            reference: payment.reference || null,
            payment_date: payment.paymentDate || undefined,
          })),
        });
      }

      return order.id_order;
    });

    return this.findSummaryById(idOrder);
  }

  async deleteCreatedOrder(idOrder) {
    const orderId = Number(idOrder);

    await prisma.$transaction(async (tx) => {
      await tx.order_payments.deleteMany({
        where: {
          id_order: orderId,
        },
      });

      await tx.order_payment_receipts.deleteMany({
        where: {
          id_order: orderId,
        },
      });

      await tx.order_details.deleteMany({
        where: {
          id_order: orderId,
        },
      });

      await tx.sales_orders.delete({
        where: {
          id_order: orderId,
        },
      });
    });
  }

  async update(id, data) {
    const paymentStatus = resolvePaymentStatus(data);
    const idOrder = Number(id);

    await prisma.$transaction(async (tx) => {
      await tx.sales_orders.update({
        where: {
          id_order: idOrder,
        },
        data: {
          clients: {
            connect: {
              id_client: Number(data.idClient),
            },
          },
          order_statuses: {
            connect: {
              id_order_status: Number(data.idOrderStatus || ORDER_STATUSES[1].id),
            },
          },
          delivery_adress: data.deliveryAddress,
          delivery_type: data.deliveryType,
          payment_status: paymentStatus.name,
          payment_statuses: {
            connect: {
              id_payment_status: paymentStatus.id,
            },
          },
          payment_deadline: data.paymentDeadline || data.payment_deadline || undefined,
          subtotal: data.subtotal,
          iva_amount: data.ivaAmount,
          total: data.total,
        },
      });

      await tx.order_details.deleteMany({
        where: {
          id_order: idOrder,
        },
      });

      await tx.order_details.createMany({
        data: data.items.map((item) => ({
          id_order: idOrder,
          id_product: Number(item.idProduct),
          barcode: item.barcode,
          quantity: Number(item.quantity),
          unit_price: item.unitPrice,
          subtotal: item.subtotal,
          iva_amount: item.ivaAmount,
        })),
      });
    });

    return this.findSummaryById(idOrder);
  }

  async cancel(id, reason = 'Pedido cancelado.') {
    return prisma.sales_orders.update({
      where: {
        id_order: Number(id),
      },
      data: {
        order_statuses: {
          connect: {
            id_order_status: ORDER_STATUSES[4].id,
          },
        },
        cancellation_reason: reason,
        cancelled_at: new Date(),
      },
      select:
        orderSummarySelect,
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

  async findReceiptUploadContextById(idOrder) {
    return prisma.sales_orders.findUnique({
      where: {
        id_order: Number(idOrder),
      },
      select: {
        id_order: true,
        id_order_status: true,
        id_payment_status: true,
        clients: {
          select: {
            id_user: true,
          },
        },
      },
    });
  }

  async createPaymentReceipt(idOrder, data) {
    return prisma.order_payment_receipts.create({
      data: {
        id_order: Number(idOrder),
        image_url: data.imageUrl,
        file_name: data.fileName || null,
        observations: data.observations || null,
        verification_status: 'Pendiente',
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
        payment_statuses: {
          connect: {
            id_payment_status: paymentStatus.id,
          },
        },
        payment_status: paymentStatus.name,
      },
      select:
        orderSummarySelect,
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
      select:
        orderSummarySelect,
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
      select:
        orderSummarySelect,
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
      select:
        orderSummarySelect,
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
      select:
        orderSummarySelect,
    });
  }

  async expirePendingOrder(idOrder, reason = 'Pedido cancelado por vencimiento de pago.') {
    return prisma.sales_orders.update({
      where: {
        id_order: Number(idOrder),
      },
      data: {
        order_statuses: {
          connect: {
            id_order_status: ORDER_STATUSES[4].id,
          },
        },
        payment_expired_at: new Date(),
        payment_expiration_reason: reason,
        cancellation_reason: reason,
        cancelled_at: new Date(),
      },
      select:
        orderSummarySelect,
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

  async findEmployeeById(idEmployee) {
    return prisma.employees.findUnique({
      where: {
        id_employee: Number(idEmployee),
      },
    });
  }

  async findEmployeeByUserId(idUser) {
    return prisma.employees.findUnique({
      where: {
        id_user: Number(idUser),
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
