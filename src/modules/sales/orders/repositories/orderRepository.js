import { prisma } from '../../../../config/prisma.js';
import {
  ORDER_STATUSES,
  PAYMENT_RECEIPT_STATUSES,
  PAYMENT_STATUSES,
} from '../../../../shared/constants/generalStatuses.js';
import { normalizeDeliveryType } from '../../shared/deliveryTypes.js';
import {
  decrementClientFavorBalance,
  getFavorBalancePaymentAmount,
  isFavorBalancePayment,
  restoreClientFavorBalance as restoreClientFavorBalanceAmount,
} from '../../shared/favorBalance.js';

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

const getRefundableFavorBalanceAmount = (order) => {
  if (!order || order.sales) {
    return 0;
  }

  return getFavorBalancePaymentAmount(order.order_payments || []);
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
  },
};

const orderSummarySelect = {
  id_order: true,
  id_customer: true,
  order_date: true,
  id_order_status: true,
  delivery_adress: true,
  delivery_recipient_name: true,
  delivery_recipient_phone: true,
  delivery_department_code: true,
  delivery_department_name: true,
  delivery_city_code: true,
  delivery_city_name: true,
  subtotal: true,
  iva_amount: true,
  shipping_amount: true,
  total: true,
  payment_status: true,
  delivery_type: true,
  sale_type: true,
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
      doc_type: true,
      doc_number: true,
      address: true,
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
      review_observations: true,
      reviewed_at: true,
      reviewed_by: true,
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

const orderPaymentResultSelect = {
  id_order: true,
  id_customer: true,
  order_date: true,
  id_order_status: true,
  delivery_adress: true,
  delivery_recipient_name: true,
  delivery_recipient_phone: true,
  delivery_department_code: true,
  delivery_department_name: true,
  delivery_city_code: true,
  delivery_city_name: true,
  subtotal: true,
  iva_amount: true,
  shipping_amount: true,
  total: true,
  payment_status: true,
  delivery_type: true,
  sale_type: true,
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
      doc_type: true,
      doc_number: true,
      address: true,
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
};

const orderListSelect = {
  id_order: true,
  id_customer: true,
  order_date: true,
  id_order_status: true,
  delivery_adress: true,
  delivery_recipient_name: true,
  delivery_recipient_phone: true,
  delivery_department_code: true,
  delivery_department_name: true,
  delivery_city_code: true,
  delivery_city_name: true,
  subtotal: true,
  iva_amount: true,
  shipping_amount: true,
  total: true,
  payment_status: true,
  delivery_type: true,
  sale_type: true,
  id_payment_status: true,
  assigned_employee: true,
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
      doc_type: true,
      doc_number: true,
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
  order_statuses: {
    select: {
      id_order_status: true,
      name_status: true,
    },
  },
  payment_statuses: {
    select: {
      id_payment_status: true,
      name_payment_status: true,
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
};

const paymentReceiptSelect = {
  id_order_payment_receipt: true,
  id_order: true,
  image_url: true,
  file_name: true,
  observations: true,
  verification_status: true,
  uploaded_at: true,
  review_observations: true,
  reviewed_at: true,
  reviewed_by: true,
};

export class OrderRepository {
  async findAll(filters = {}) {
    const where = {};
    const page = Math.max(Number(filters.page) || 1, 1);
    const limit = Math.min(Math.max(Number(filters.limit) || 10, 1), 100);
    const skip = (page - 1) * limit;
    const searchTerm = String(filters.search || '').trim();
    const numericSearch =
      searchTerm && /^\d+$/.test(searchTerm)
        ? Number(searchTerm)
        : null;

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

    if (searchTerm) {
      where.OR = [
        ...(numericSearch !== null
          ? [
              {
                id_order: numericSearch,
              },
            ]
          : []),
        {
          clients: {
            doc_number: {
              contains: searchTerm,
            },
          },
        },
        {
          clients: {
            users: {
              full_name: {
                contains: searchTerm,
                mode: 'insensitive',
              },
            },
          },
        },
        {
          clients: {
            users: {
              email: {
                contains: searchTerm,
                mode: 'insensitive',
              },
            },
          },
        },
      ];
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

    const orderIds = orders.map((order) => order.id_order);
    const paymentTotals =
      orderIds.length > 0
        ? await prisma.order_payments.groupBy({
            by: ['id_order'],
            where: {
              id_order: {
                in: orderIds,
              },
            },
            _sum: {
              amount: true,
            },
          })
        : [];

    const paymentTotalByOrder = new Map(
      paymentTotals.map((paymentTotal) => [
        paymentTotal.id_order,
        Number(paymentTotal._sum.amount || 0),
      ])
    );

    const receiptTotals =
      orderIds.length > 0
        ? await prisma.order_payment_receipts.groupBy({
            by: [
              'id_order',
              'verification_status',
            ],
            where: {
              id_order: {
                in: orderIds,
              },
            },
            _count: {
              id_order_payment_receipt: true,
            },
          })
        : [];

    const receiptSummaryByOrder = new Map();

    for (const receiptTotal of receiptTotals) {
      const currentSummary =
        receiptSummaryByOrder.get(receiptTotal.id_order) || {
          totalReceipts: 0,
          pendingReceipts: 0,
          approvedReceipts: 0,
          rejectedReceipts: 0,
        };
      const count =
        receiptTotal._count.id_order_payment_receipt || 0;
      const status =
        String(receiptTotal.verification_status || '').trim().toLowerCase();

      currentSummary.totalReceipts += count;

      if (status === PAYMENT_RECEIPT_STATUSES.PENDING.toLowerCase()) {
        currentSummary.pendingReceipts += count;
      } else if (status === PAYMENT_RECEIPT_STATUSES.APPROVED.toLowerCase()) {
        currentSummary.approvedReceipts += count;
      } else if (status === PAYMENT_RECEIPT_STATUSES.REJECTED.toLowerCase()) {
        currentSummary.rejectedReceipts += count;
      }

      receiptSummaryByOrder.set(
        receiptTotal.id_order,
        currentSummary
      );
    }

    const ordersWithPaidAmount = orders.map((order) => ({
      ...order,
      _paidAmount:
        paymentTotalByOrder.get(order.id_order) || 0,
      _paymentReceiptSummary:
        receiptSummaryByOrder.get(order.id_order) || {
          totalReceipts: 0,
          pendingReceipts: 0,
          approvedReceipts: 0,
          rejectedReceipts: 0,
        },
    }));

    const totalPages = Math.ceil(total / limit);

    return {
      orders:
        ordersWithPaidAmount,
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

  async findPaymentResultById(id) {
    return prisma.sales_orders.findUnique({
      where: {
        id_order: Number(id),
      },
      select:
        orderPaymentResultSelect,
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
        sale_type: true,
        subtotal: true,
        iva_amount: true,
        shipping_amount: true,
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
            unit_price: true,
            subtotal: true,
            iva_amount: true,
          },
        },
      },
    });
  }

  async findShippingUpdateStateById(id) {
    return prisma.sales_orders.findUnique({
      where: {
        id_order: Number(id),
      },
      select: {
        id_order: true,
        id_order_status: true,
        id_payment_status: true,
        delivery_type: true,
        subtotal: true,
        iva_amount: true,
        shipping_amount: true,
        total: true,
        sales: {
          select: {
            id_sale: true,
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
        sale_type: true,
        delivery_type: true,
        shipping_amount: true,
        total: true,
        id_customer: true,
        clients: {
          select: {
            id_client: true,
            credit_balance: true,
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
          delivery_department_code: data.deliveryDepartmentCode,
          delivery_department_name: data.deliveryDepartmentName,
          delivery_city_code: data.deliveryCityCode,
          delivery_city_name: data.deliveryCityName,
          delivery_recipient_name: data.deliveryRecipientName,
          delivery_recipient_phone: data.deliveryRecipientPhone,
          sale_type: data.saleType || 'manual',
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
          shipping_amount: data.shippingAmount,
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

      if (Number(data.favorBalanceAmount || 0) > 0) {
        await decrementClientFavorBalance(tx, {
          idClient: data.idClient,
          amount: data.favorBalanceAmount,
          insufficientMessage: 'Saldo a favor insuficiente para completar el pedido.',
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

  async restoreClientFavorBalance(idClient, amount) {
    const value = Number(amount || 0);

    if (!Number.isFinite(value) || value <= 0) {
      return;
    }

    await restoreClientFavorBalanceAmount(prisma, {
      idClient,
      amount: value,
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
          delivery_department_code: data.deliveryDepartmentCode,
          delivery_department_name: data.deliveryDepartmentName,
          delivery_city_code: data.deliveryCityCode,
          delivery_city_name: data.deliveryCityName,
          delivery_recipient_name: data.deliveryRecipientName,
          delivery_recipient_phone: data.deliveryRecipientPhone,
          payment_status: paymentStatus.name,
          payment_statuses: {
            connect: {
              id_payment_status: paymentStatus.id,
            },
          },
          payment_deadline: data.paymentDeadline || data.payment_deadline || undefined,
          subtotal: data.subtotal,
          iva_amount: data.ivaAmount,
          shipping_amount: data.shippingAmount,
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

  async updateShippingAmount(idOrder, data) {
    const orderId = Number(idOrder);

    await prisma.sales_orders.update({
      where: {
        id_order: orderId,
      },
      data: {
        shipping_amount: data.shippingAmount,
        total: data.total,
      },
    });

    return this.findSummaryById(orderId);
  }

  async cancel(id, reason = 'Pedido cancelado.') {
    const orderId = Number(id);
    let favorBalanceRestoredAmount = 0;

    await prisma.$transaction(async (tx) => {
      const order = await tx.sales_orders.findUnique({
        where: {
          id_order: orderId,
        },
        select: {
          id_customer: true,
          sales: {
            select: {
              id_sale: true,
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

      const refundableFavorBalance = getRefundableFavorBalanceAmount(order);
      favorBalanceRestoredAmount = refundableFavorBalance;

      await tx.sales_orders.update({
        where: {
          id_order: orderId,
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
      });

      if (refundableFavorBalance > 0) {
        await restoreClientFavorBalanceAmount(tx, {
          idClient: order.id_customer,
          amount: refundableFavorBalance,
        });
      }
    });

    const cancelledOrder = await this.findSummaryById(orderId);

    return {
      ...cancelledOrder,
      favorBalanceRestoredAmount,
    };
  }

  async createPayment(idOrder, data) {
    return prisma.$transaction(async (tx) => {
      if (isFavorBalancePayment(data)) {
        await decrementClientFavorBalance(tx, {
          idClient: data.idClient,
          amount: data.amount,
          insufficientMessage: 'Saldo a favor insuficiente para registrar el pago.',
        });
      }

      return tx.order_payments.create({
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
        delivery_type: true,
        shipping_amount: true,
        order_payment_receipts: {
          where: {
            verification_status: PAYMENT_RECEIPT_STATUSES.PENDING,
          },
          select: {
            id_order_payment_receipt: true,
          },
          take: 1,
        },
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
        verification_status: PAYMENT_RECEIPT_STATUSES.PENDING,
      },
    });
  }

  async findPaymentReceiptById(receiptId) {
    return prisma.order_payment_receipts.findUnique({
      where: {
        id_order_payment_receipt: Number(receiptId),
      },
      select: paymentReceiptSelect,
    });
  }

  async findPaymentReceiptByOrderId(idOrder, receiptId) {
    return prisma.order_payment_receipts.findFirst({
      where: {
        id_order: Number(idOrder),
        id_order_payment_receipt: Number(receiptId),
      },
      select: paymentReceiptSelect,
    });
  }

  async updatePaymentReceiptReview(receiptId, data) {
    return prisma.order_payment_receipts.update({
      where: {
        id_order_payment_receipt: Number(receiptId),
      },
      data: {
        verification_status: data.status,
        review_observations: data.reviewObservations || null,
        reviewed_at: data.reviewedAt || new Date(),
        reviewed_by: data.reviewedBy ? Number(data.reviewedBy) : null,
      },
      select: paymentReceiptSelect,
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

  async resetPaymentDeadline(idOrder, paymentDeadline) {
    return prisma.sales_orders.update({
      where: {
        id_order: Number(idOrder),
      },
      data: {
        payment_deadline: paymentDeadline,
        payment_reminder_6h_sent: false,
        payment_reminder_1h_sent: false,
        payment_expired_at: null,
        payment_expiration_reason: null,
      },
      select:
        orderSummarySelect,
    });
  }

  async expirePendingOrder(idOrder, reason = 'Pedido cancelado por vencimiento de pago.') {
    const orderId = Number(idOrder);
    let favorBalanceRestoredAmount = 0;

    await prisma.$transaction(async (tx) => {
      const order = await tx.sales_orders.findUnique({
        where: {
          id_order: orderId,
        },
        select: {
          id_customer: true,
          sales: {
            select: {
              id_sale: true,
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

      const refundableFavorBalance = getRefundableFavorBalanceAmount(order);
      favorBalanceRestoredAmount = refundableFavorBalance;

      await tx.sales_orders.update({
        where: {
          id_order: orderId,
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
      });

      if (refundableFavorBalance > 0) {
        await restoreClientFavorBalanceAmount(tx, {
          idClient: order.id_customer,
          amount: refundableFavorBalance,
        });
      }
    });

    const expiredOrder = await this.findSummaryById(orderId);

    return {
      ...expiredOrder,
      favorBalanceRestoredAmount,
    };
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

  async findBarcodesByProducts(items = []) {
    const normalizedItems = items
      .map((item) => ({
        idProduct: Number(item.idProduct ?? item.id_product),
        barcode: String(item.barcode || '').trim(),
      }))
      .filter((item) => item.idProduct && item.barcode);

    if (!normalizedItems.length) {
      return [];
    }

    return prisma.barcodes.findMany({
      where: {
        OR: normalizedItems.map((item) => ({
          id_product: item.idProduct,
          barcode: item.barcode,
        })),
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
