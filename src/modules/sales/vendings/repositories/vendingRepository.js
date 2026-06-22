import { prisma } from "../../../../config/prisma.js";
import {
  CREDIT_STATUSES,
  GENERAL_STATUSES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
} from "../../../../shared/constants/generalStatuses.js";
import { VendingMapper } from "../mappers/vendingMapper.js";

const CREDIT_PAYMENT_METHOD_ID = PAYMENT_METHODS[3].id;

const saleInclude = {
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
  credits: true,
  sale_payment_methods: {
    include: {
      payment_methods: true,
    },
  },
  sale_statuses: true,
  sale_types: true,
  sales_orders: {
    include: {
      clients: {
        select: {
          id_client: true,
          person_type: true,
          client_type: true,
          credit: true,
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
      },
      order_details: {
        include: {
          products: {
            select: {
              id_product: true,
              name: true,
              reference: true,
              retail_price: true,
              wholesale_price: true,
              partner_price: true,
              bulk_price: true,
              iva_percentage: true,
            },
          },
        },
      },
    },
  },
};

const saleSummarySelect = {
  id_sale: true,
  id_order: true,
  id_employe: true,
  subtotal: true,
  sale_date: true,
  id_sale_status: true,
  id_sale_type: true,
  credits: {
    select: {
      id_credit: true,
      id_customer: true,
      credit_amount: true,
      remaining_balance: true,
      due_date: true,
      id_credit_status: true,
    },
  },
  sale_payment_methods: {
    select: {
      id_payment_method: true,
      amount: true,
    },
  },
  sales_orders: {
    select: {
      id_order: true,
      id_order_status: true,
      delivery_type: true,
      delivery_adress: true,
      subtotal: true,
      iva_amount: true,
      total: true,
      payment_status: true,
      id_payment_status: true,
    },
  },
};

const saleListSelect = {
  id_sale: true,
  id_order: true,
  id_employe: true,
  subtotal: true,
  sale_date: true,
  id_sale_status: true,
  id_sale_type: true,
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
  credits: {
    select: {
      id_credit: true,
      id_sale: true,
      id_customer: true,
      due_date: true,
      id_credit_status: true,
      credit_amount: true,
      remaining_balance: true,
    },
  },
  sale_payment_methods: {
    select: {
      id_sale_payment_method: true,
      id_sale: true,
      id_payment_method: true,
      amount: true,
      creation_date: true,
      payment_methods: {
        select: {
          id_payment_method: true,
          name_payment_method: true,
        },
      },
    },
  },
  sale_statuses: true,
  sale_types: true,
  sales_orders: {
    select: {
      id_order: true,
      id_customer: true,
      order_date: true,
      id_order_status: true,
      delivery_adress: true,
      delivery_type: true,
      payment_status: true,
      payment_deadline: true,
      payment_reminder_6h_sent: true,
      payment_reminder_1h_sent: true,
      payment_expired_at: true,
      payment_expiration_reason: true,
      cancellation_reason: true,
      cancelled_at: true,
      subtotal: true,
      iva_amount: true,
      total: true,
      clients: {
        select: {
          id_client: true,
          person_type: true,
          client_type: true,
          credit: true,
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
    },
  },
};

const mapSaleSummary = (sale) => {
  if (!sale) return null;

  return {
    idSale: sale.id_sale,
    idOrder: sale.id_order,
    idEmployee: sale.id_employe,
    idSaleStatus: sale.id_sale_status,
    idSaleType: sale.id_sale_type,
    subtotal: Number(sale.subtotal || 0),
    saleDate: sale.sale_date || null,
    paymentMethods: (sale.sale_payment_methods || []).map((paymentMethod) => ({
      idPaymentMethod: paymentMethod.id_payment_method,
      amount: Number(paymentMethod.amount || 0),
    })),
    credit: sale.credits
      ? {
          idCredit: sale.credits.id_credit,
          idCustomer: sale.credits.id_customer,
          creditAmount: Number(sale.credits.credit_amount || 0),
          remainingBalance: Number(sale.credits.remaining_balance || 0),
          dueDate: sale.credits.due_date || null,
          idCreditStatus: sale.credits.id_credit_status,
        }
      : null,
    order: {
      idOrder: sale.sales_orders?.id_order || sale.id_order,
      idOrderStatus: sale.sales_orders?.id_order_status || null,
      deliveryType: sale.sales_orders?.delivery_type || null,
      deliveryAddress: sale.sales_orders?.delivery_adress || null,
      subtotal: Number(sale.sales_orders?.subtotal || sale.subtotal || 0),
      ivaAmount: Number(sale.sales_orders?.iva_amount || 0),
      total: Number(sale.sales_orders?.total || sale.subtotal || 0),
      paymentStatus: sale.sales_orders?.payment_status || null,
      idPaymentStatus: sale.sales_orders?.id_payment_status || null,
    },
  };
};

const getCreditAmount = (paymentMethods = []) => {
  const creditPayment = paymentMethods.find(
    (paymentMethod) => Number(paymentMethod.idPaymentMethod) === CREDIT_PAYMENT_METHOD_ID
  );

  return Number(creditPayment?.amount || 0);
};

const groupQuantitiesByBarcode = (details = []) =>
  Array.from(
    details.reduce((grouped, detail) => {
      const barcode = String(detail.barcode || "").trim();
      const quantity = Number(detail.quantity || 0);

      if (!barcode || quantity <= 0) {
        return grouped;
      }

      grouped.set(
        barcode,
        (grouped.get(barcode) || 0) + quantity
      );

      return grouped;
    }, new Map()),
    ([barcode, quantity]) => ({
      barcode,
      quantity,
    })
  );

const decreaseStockAtomically = async (tx, details = []) => {
  const groupedDetails =
    groupQuantitiesByBarcode(details);

  for (const detail of groupedDetails) {
    const result =
      await tx.barcodes.updateMany({
        where: {
          barcode:
            detail.barcode,
          stock: {
            gte:
              detail.quantity,
          },
        },
        data: {
          stock: {
            decrement:
              detail.quantity,
          },
        },
      });

    if (result.count !== 1) {
      throw new Error(
        `Stock insuficiente para el codigo de barras ${detail.barcode}`
      );
    }
  }
};

const buildCreditData = ({ data, idCustomer, creditAmount }) => {
  if (creditAmount <= 0) {
    return null;
  }

  const creditData = data.credit || {};

  if (!creditData.dueDate && !data.creditDueDate) {
    throw new Error("La fecha de vencimiento del credito es obligatoria");
  }

  if (!creditData.idCreditStatus && !data.idCreditStatus) {
    throw new Error("El estado inicial del credito es obligatorio");
  }

  return {
    due_date: creditData.dueDate || data.creditDueDate,
    id_credit_status: Number(creditData.idCreditStatus || data.idCreditStatus),
    id_customer: Number(idCustomer),
    credit_amount: creditAmount,
    remaining_balance: creditAmount,
  };
};
const annulmentSaleSelect = {
  id_sale: true,
  id_order: true,
  id_sale_status: true,
  subtotal: true,
  credits: {
    select: {
      id_credit: true,
      id_customer: true,
      remaining_balance: true,
    },
  },
  sales_orders: {
    select: {
      id_order: true,
      id_order_status: true,
      total: true,
      cancellation_reason: true,
      cancelled_at: true,
      clients: {
        select: {
          users: {
            select: {
              full_name: true,
              email: true,
            },
          },
        },
      },
      order_details: {
        select: {
          barcode: true,
          quantity: true,
        },
      },
    },
  },
};

const mapAnnulledSaleSummary = (sale) => {
  if (!sale) return null;

  return {
    idSale: sale.id_sale,
    idOrder: sale.id_order,
    idSaleStatus: sale.id_sale_status,
    subtotal: Number(sale.subtotal || 0),
    annulmentReason: sale.sales_orders?.cancellation_reason || null,
    annulledAt: sale.sales_orders?.cancelled_at || null,
    credit: sale.credits
      ? {
          idCustomer: sale.credits.id_customer,
          remainingBalance: Number(sale.credits.remaining_balance || 0),
        }
      : null,
    order: {
      idOrder: sale.sales_orders?.id_order || sale.id_order,
      idOrderStatus: sale.sales_orders?.id_order_status || null,
      total: Number(sale.sales_orders?.total || sale.subtotal || 0),
      cancellationReason: sale.sales_orders?.cancellation_reason || null,
      cancelledAt: sale.sales_orders?.cancelled_at || null,
      customer: sale.sales_orders?.clients
        ? {
            user: sale.sales_orders.clients.users
              ? {
                  fullName: sale.sales_orders.clients.users.full_name,
                  email: sale.sales_orders.clients.users.email,
                }
              : null,
          }
        : null,
    },
  };
};
const getTodayAtStart = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const buildCreditCapacity = (client) => {
  if (!client) return null;

  const activeCredits = (client.credits || []).filter(
    (credit) => Number(credit.remaining_balance || 0) > 0
  );

  const usedCredit = activeCredits.reduce(
    (total, credit) => total + Number(credit.remaining_balance || 0),
    0
  );

  const assignedCredit = Number(client.credit || 0);
  const today = getTodayAtStart();
  const hasOverdueCredit = activeCredits.some((credit) => {
    const dueDate = credit.due_date ? new Date(credit.due_date) : null;

    if (Number(credit.id_credit_status) === CREDIT_STATUSES[3].id) {
      return true;
    }

    return Boolean(dueDate && dueDate < today);
  });

  return {
    idCustomer: client.id_client,
    isActive: Number(client.users?.id_status || 0) === GENERAL_STATUSES[1].id,
    assignedCredit,
    usedCredit,
    availableCredit: Math.max(assignedCredit - usedCredit, 0),
    activeCredits: activeCredits.length,
    hasOverdueCredit,
  };
};

const validateCreditCapacity = ({ capacity, creditAmount }) => {
  if (!capacity) {
    throw new Error("Cliente no encontrado");
  }

  if (!capacity.isActive) {
    throw new Error("El cliente no se encuentra activo");
  }

  if (capacity.hasOverdueCredit) {
    throw new Error("El cliente tiene creditos vencidos y no puede realizar nuevas compras a credito");
  }

  if (capacity.assignedCredit <= 0) {
    throw new Error("El cliente no tiene cupo de credito asignado");
  }

  if (Number(creditAmount || 0) > capacity.availableCredit) {
    throw new Error("El cupo disponible calculado del cliente no es suficiente para la venta a credito");
  }
};

export class VendingRepository {

  static async create(data) {
    const createdSaleId =
      await prisma.$transaction(async (tx) => {
        const creditAmount =
          getCreditAmount(data.paymentMethods);

        const order =
          await tx.sales_orders.findUnique({
            where: {
              id_order:
                Number(data.idOrder),
            },
            select: {
              id_customer: true,
              sales: {
                select: {
                  id_sale: true,
                },
              },
              clients: {
                select: {
                  id_client: true,
                  credit: true,
                  users: {
                    select: {
                      id_status: true,
                    },
                  },
                  credits: {
                    where: {
                      remaining_balance: {
                        gt: 0,
                      },
                    },
                    select: {
                      remaining_balance: true,
                      id_credit_status: true,
                      due_date: true,
                    },
                  },
                },
              },
            },
          });

        if (!order) {
          throw new Error("Pedido no encontrado");
        }

        if (order.sales) {
          throw new Error("El pedido ya tiene una venta asociada");
        }

        const creditData =
          buildCreditData({
            data,
            idCustomer:
              order.id_customer,
            creditAmount,
          });

        if (creditAmount > 0) {
          validateCreditCapacity({
            capacity:
              buildCreditCapacity(order.clients),
            creditAmount,
          });
        }

        const createdSale =
          await tx.sales.create({
            data: {
              id_order:
                data.idOrder,
              id_employe:
                data.idEmployee,
              subtotal:
                data.subtotal,
              id_sale_status:
                data.idSaleStatus,
              id_sale_type:
                data.idSaleType,
              sale_payment_methods: {
                create:
                  data.paymentMethods.map(
                    (paymentMethod) => ({
                      id_payment_method:
                        Number(paymentMethod.idPaymentMethod),
                      amount:
                        paymentMethod.amount ?? null,
                    })
                  ),
              },
              ...(creditData && {
                credits: {
                  create:
                    creditData,
                },
              }),
              ...(data.saleDate && {
                sale_date:
                  data.saleDate,
              }),
            },
            select: {
              id_sale: true,
            },
          });

        if (data.markOrderAsPaid || data.idOrderStatus) {
          await tx.sales_orders.update({
            where: {
              id_order:
                Number(data.idOrder),
            },
            data: {
              ...(data.markOrderAsPaid && {
                payment_statuses: {
                  connect: {
                    id_payment_status:
                      PAYMENT_STATUSES[2].id,
                  },
                },
                payment_status:
                  PAYMENT_STATUSES[2].name,
              }),
              ...(data.idOrderStatus && {
                order_statuses: {
                  connect: {
                    id_order_status:
                      Number(data.idOrderStatus),
                  },
                },
              }),
            },
          });
        }

        if (data.decreaseStock) {
          await decreaseStockAtomically(
            tx,
            data.orderDetails || []
          );
        }

        return createdSale.id_sale;
      }, {
        timeout: 15000,
      });

    const sale =
      await prisma.sales.findUnique({
        where: {
          id_sale:
            createdSaleId,
        },
        select:
          saleSummarySelect,
      });

    return mapSaleSummary(
      sale
    );
  }
  static async update(idSale, data) {
    const updatedSaleId =
      await prisma.$transaction(async (tx) => {
        const currentSale =
          await tx.sales.findUnique({
            where: {
              id_sale:
                Number(idSale),
            },
            select: {
              id_order: true,
            },
          });

        if (!currentSale) {
          return null;
        }

        if (data.idSaleStatus) {
          await tx.sales.update({
            where: {
              id_sale:
                Number(idSale),
            },
            data: {
              id_sale_status:
                data.idSaleStatus,
            },
          });
        }

        if (
          data.deliveryAdress !== undefined ||
          data.deliveryType !== undefined ||
          data.idOrderStatus !== undefined
        ) {
          await tx.sales_orders.update({
            where: {
              id_order:
                currentSale.id_order,
            },
            data: {
              ...(data.deliveryAdress !== undefined && {
                delivery_adress:
                  data.deliveryAdress,
              }),
              ...(data.deliveryType !== undefined && {
                delivery_type:
                  data.deliveryType,
              }),
              ...(data.idOrderStatus !== undefined && {
                order_statuses: {
                  connect: {
                    id_order_status:
                      data.idOrderStatus,
                  },
                },
              }),
            },
          });
        }

        return Number(idSale);
      });

    if (!updatedSaleId) {
      return null;
    }

    const sale =
      await prisma.sales.findUnique({
        where: {
          id_sale:
            updatedSaleId,
        },
        select:
          saleSummarySelect,
      });

    return mapSaleSummary(
      sale
    );
  }

  static async findSaleEmailPayloadById(idSale) {
    const sale =
      await prisma.sales.findUnique({
        where: {
          id_sale:
            Number(idSale),
        },
        select: {
          id_sale: true,
          id_order: true,
          subtotal: true,
          credits: {
            select: {
              credit_amount: true,
              remaining_balance: true,
              due_date: true,
            },
          },
          sale_payment_methods: {
            select: {
              amount: true,
              payment_methods: {
                select: {
                  name_payment_method: true,
                },
              },
            },
          },
          sales_orders: {
            select: {
              total: true,
              clients: {
                select: {
                  users: {
                    select: {
                      full_name: true,
                      email: true,
                    },
                  },
                },
              },
              order_details: {
                select: {
                  barcode: true,
                  quantity: true,
                  unit_price: true,
                  subtotal: true,
                  products: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

    if (!sale) return null;

    const user =
      sale.sales_orders?.clients?.users;

    return {
      idSale:
        sale.id_sale,
      idOrder:
        sale.id_order,
      subtotal:
        Number(sale.subtotal || 0),
      total:
        Number(sale.sales_orders?.total || sale.subtotal || 0),
      customer: {
        user: user
          ? {
              fullName:
                user.full_name,
              email:
                user.email,
            }
          : null,
      },
      paymentMethods:
        (sale.sale_payment_methods || []).map((paymentMethod) => ({
          amount:
            Number(paymentMethod.amount || 0),
          paymentMethod: {
            namePaymentMethod:
              paymentMethod.payment_methods?.name_payment_method || null,
          },
        })),
      details:
        (sale.sales_orders?.order_details || []).map((detail) => ({
          productName:
            detail.products?.name || null,
          barcode:
            detail.barcode,
          quantity:
            detail.quantity,
          unitPrice:
            Number(detail.unit_price || 0),
          subtotal:
            Number(detail.subtotal || 0),
        })),
      credit: sale.credits
        ? {
            creditAmount:
              Number(sale.credits.credit_amount || 0),
            remainingBalance:
              Number(sale.credits.remaining_balance || 0),
            dueDate:
              sale.credits.due_date || null,
          }
        : null,
    };
  }

  static async findUpdateStateById(idSale) {
    const sale =
      await prisma.sales.findUnique({
        where: {
          id_sale:
            Number(idSale),
        },
        select: {
          id_sale: true,
          sale_statuses: {
            select: {
              id_sale_status: true,
              name_status: true,
            },
          },
          sales_orders: {
            select: {
              id_order: true,
              id_order_status: true,
              order_statuses: {
                select: {
                  name_status: true,
                },
              },
            },
          },
        },
      });

    if (!sale) return null;

    return {
      idSale:
        sale.id_sale,
      saleStatus: sale.sale_statuses
        ? {
            idSaleStatus:
              sale.sale_statuses.id_sale_status,
            nameStatus:
              sale.sale_statuses.name_status,
          }
        : null,
      order: sale.sales_orders
        ? {
            idOrder:
              sale.sales_orders.id_order,
            idOrderStatus:
              sale.sales_orders.id_order_status,
            nameStatus:
              sale.sales_orders.order_statuses?.name_status || null,
          }
        : null,
    };
  }
  static async findAnnulmentStateById(idSale) {
    const sale =
      await prisma.sales.findUnique({
        where: {
          id_sale:
            Number(idSale),
        },
        select: {
          id_sale: true,
          id_sale_status: true,
        },
      });

    if (!sale) return null;

    return {
      idSale:
        sale.id_sale,
      saleStatus: {
        idSaleStatus:
          sale.id_sale_status,
      },
    };
  }

  static async annular(idSale, data) {
    const annulledSale =
      await prisma.$transaction(async (tx) => {
        const currentSale =
          await tx.sales.findUnique({
            where: {
              id_sale:
                Number(idSale),
            },
            select: annulmentSaleSelect,
          });

        if (!currentSale) {
          return null;
        }

        await tx.sales.update({
          where: {
            id_sale:
              Number(idSale),
          },
          data: {
            id_sale_status:
              data.idSaleStatus,
          },
        });

        await tx.sales_orders.update({
          where: {
            id_order:
              currentSale.id_order,
          },
          data: {
            order_statuses: {
              connect: {
                id_order_status:
                  data.idOrderStatus,
              },
            },
            cancellation_reason:
              data.annulmentReason,
            cancelled_at:
              new Date(),
          },
        });

        if (currentSale.credits) {
          await tx.credits.update({
            where: {
              id_credit:
                currentSale.credits.id_credit,
            },
            data: {
              remaining_balance:
                0,
              id_credit_status:
                CREDIT_STATUSES[2].id,
            },
          });
        }

        await Promise.all(
          (currentSale.sales_orders.order_details || []).map((detail) =>
            tx.barcodes.updateMany({
              where: {
                barcode:
                  detail.barcode,
              },
              data: {
                stock: {
                  increment:
                    detail.quantity,
                },
              },
            })
          )
        );

        return await tx.sales.findUnique({
          where: {
            id_sale:
              Number(idSale),
          },
          select: annulmentSaleSelect,
        });
      }, {
        timeout: 15000,
      });

    return mapAnnulledSaleSummary(
      annulledSale
    );
  }
  static async findById(idSale) {
    const sale =
      await prisma.sales.findUnique({
        where: {
          id_sale:
            Number(idSale),
        },
        include:
          saleInclude,
      });

    return VendingMapper.toDomain(
      sale
    );
  }

  static async findByOrderId(idOrder) {
    const sale =
      await prisma.sales.findUnique({
        where: {
          id_order:
            Number(idOrder),
        },
        include:
          saleInclude,
      });

    return VendingMapper.toDomain(
      sale
    );
  }

  static async findAllWithFilters(filters = {}) {
    const {
      page = 1,
      limit = 10,
      idSaleStatus,
      idSaleType,
      idPaymentMethod,
      idEmployee,
      idOrder,
      search,
      dateFrom,
      dateTo,
      sortBy = "date",
      order = "desc",
    } = filters;

    const parsedPage =
      Number(page);
    const parsedLimit =
      Number(limit);

    const skip =
      (parsedPage - 1) * parsedLimit;
    const searchTerm =
      String(search || "").trim();
    const numericSearch =
      searchTerm && /^\d+(\.\d+)?$/.test(searchTerm)
        ? Number(searchTerm)
        : null;

    const where = {
      ...(idSaleStatus && {
        id_sale_status:
          Number(idSaleStatus),
      }),
      ...(idSaleType && {
        id_sale_type:
          Number(idSaleType),
      }),
      ...(idPaymentMethod && {
        sale_payment_methods: {
          some: {
            id_payment_method:
              Number(idPaymentMethod),
          },
        },
      }),
      ...(idEmployee && {
        id_employe:
          Number(idEmployee),
      }),
      ...(idOrder && {
        id_order:
          Number(idOrder),
      }),
      ...(searchTerm && {
        OR: [
          ...(numericSearch !== null
            ? [
                {
                  id_sale:
                    Number(numericSearch),
                },
                {
                  id_order:
                    Number(numericSearch),
                },
                {
                  subtotal:
                    numericSearch,
                },
                {
                  sales_orders: {
                    total:
                      numericSearch,
                  },
                },
              ]
            : []),
          {
            employees: {
              users: {
                full_name: {
                  contains:
                    searchTerm,
                  mode:
                    "insensitive",
                },
              },
            },
          },
          {
            sales_orders: {
              clients: {
                users: {
                  full_name: {
                    contains:
                      searchTerm,
                    mode:
                      "insensitive",
                  },
                },
              },
            },
          },
          {
            sales_orders: {
              clients: {
                users: {
                  email: {
                    contains:
                      searchTerm,
                    mode:
                      "insensitive",
                  },
                },
              },
            },
          },
          {
            sale_payment_methods: {
              some: {
                payment_methods: {
                  name_payment_method: {
                    contains:
                      searchTerm,
                    mode:
                      "insensitive",
                  },
                },
              },
            },
          },
          {
            sale_statuses: {
              name_status: {
                contains:
                  searchTerm,
                mode:
                  "insensitive",
              },
            },
          },
          {
            sale_types: {
              sale_type_name: {
                contains:
                  searchTerm,
                mode:
                  "insensitive",
              },
            },
          },
        ],
      }),
      ...((dateFrom || dateTo) && {
        sale_date: {
          ...(dateFrom && {
            gte:
              new Date(`${dateFrom}T00:00:00.000Z`),
          }),
          ...(dateTo && {
            lte:
              new Date(`${dateTo}T00:00:00.000Z`),
          }),
        },
      }),
    };

    let orderBy = {
      sale_date:
        order,
    };

    if (sortBy === "subtotal") {
      orderBy = {
        subtotal:
          order,
      };
    }

    if (sortBy === "id") {
      orderBy = {
        id_sale:
          order,
      };
    }

    const [sales, total] =
      await Promise.all([
        prisma.sales.findMany({
          where,
          select:
            saleListSelect,
          orderBy,
          skip,
          take:
            parsedLimit,
        }),
        prisma.sales.count({
          where,
        }),
      ]);

    const totalPages =
      Math.ceil(total / parsedLimit);

    return {
      sales:
        VendingMapper.toDomainList(sales),
      total,
      page:
        parsedPage,
      limit:
        parsedLimit,
      totalPages,
      hasNextPage:
        parsedPage < totalPages,
      hasPrevPage:
        parsedPage > 1,
    };
  }

  static async getMetrics() {
    const [
      totalSales,
      salesByType,
      salesByStatus,
    ] = await Promise.all([
      prisma.sales.count(),

      prisma.sales.groupBy({
        by: [
          "id_sale_type",
        ],
        _count: {
          id_sale: true,
        },
      }),

      prisma.sales.groupBy({
        by: [
          "id_sale_status",
        ],
        _count: {
          id_sale: true,
        },
      }),
    ]);

    const [
      saleTypes,
      saleStatuses,
    ] = await Promise.all([
      prisma.sale_types.findMany({
        select: {
          id_sale_type: true,
          sale_type_name: true,
        },
      }),
      prisma.sale_statuses.findMany({
        select: {
          id_sale_status: true,
          name_status: true,
          description: true,
        },
      }),
    ]);

    const typeMap =
      new Map(
        saleTypes.map(
          (type) => [
            type.id_sale_type,
            type,
          ]
        )
      );

    const statusMap =
      new Map(
        saleStatuses.map(
          (status) => [
            status.id_sale_status,
            status,
          ]
        )
      );

    return {
      totalSales,
      byType:
        salesByType.map(
          (item) => {
            const type =
              typeMap.get(
                item.id_sale_type
              );

            return {
              idSaleType:
                item.id_sale_type,
              saleTypeName:
                type?.sale_type_name ||
                "Desconocido",
              total:
                item._count.id_sale,
            };
          }
        ),
      byStatus:
        salesByStatus.map(
          (item) => {
            const status =
              statusMap.get(
                item.id_sale_status
              );

            return {
              idSaleStatus:
                item.id_sale_status,
              nameStatus:
                status?.name_status ||
                "Desconocido",
              description:
                status?.description ||
                null,
              total:
                item._count.id_sale,
            };
          }
        ),
    };
  }

  static async validateStockForOrder(order) {
    const details =
      order?.details || [];

    if (!details.length) {
      return {
        success: true,
        error: null,
        errorCode: null,
      };
    }

    const barcodes =
      await prisma.barcodes.findMany({
        where: {
          barcode: {
            in:
              [...new Set(details.map((detail) => detail.barcode))],
          },
        },
        select: {
          barcode: true,
          stock: true,
        },
      });

    const barcodeMap =
      new Map(
        barcodes.map((barcode) => [
          barcode.barcode,
          barcode,
        ])
      );

    for (const detail of details) {
      const barcode =
        barcodeMap.get(detail.barcode);

      if (!barcode) {
        return {
          success: false,
          error:
            `El codigo de barras ${detail.barcode} no existe`,
          errorCode:
            "BARCODE_NOT_FOUND",
        };
      }

      if (
        barcode.stock !== null &&
        barcode.stock !== undefined &&
        barcode.stock < detail.quantity
      ) {
        return {
          success: false,
          error:
            `Stock insuficiente para el codigo de barras ${detail.barcode}`,
          errorCode:
            "INSUFFICIENT_STOCK",
        };
      }
    }

    return {
      success: true,
      error: null,
      errorCode: null,
    };
  }

  static async existsByOrderId(idOrder) {
    const sale =
      await prisma.sales.findUnique({
        where: {
          id_order:
            Number(idOrder),
        },
        select: {
          id_sale: true,
        },
      });

    return Boolean(sale);
  }

  static async findPaymentMethodById(idPaymentMethod) {
    return await prisma.payment_methods.findUnique({
      where: {
        id_payment_method:
          Number(idPaymentMethod),
      },
    });
  }

  static async findClientById(idClient) {
    return await prisma.clients.findUnique({
      where: {
        id_client:
          Number(idClient),
      },
      include: {
        users: true,
      },
    });
  }

  static async getClientCreditCapacity(idClient) {
    const client =
      await prisma.clients.findUnique({
        where: {
          id_client:
            Number(idClient),
        },
        select: {
          id_client: true,
          credit: true,
          users: {
            select: {
              id_status: true,
            },
          },
          credits: {
            where: {
              remaining_balance: {
                gt: 0,
              },
            },
            select: {
              remaining_balance: true,
              id_credit_status: true,
              due_date: true,
            },
          },
        },
      });

    return buildCreditCapacity(client);
  }

  static async findSaleStatusById(idSaleStatus) {
    return await prisma.sale_statuses.findUnique({
      where: {
        id_sale_status:
          Number(idSaleStatus),
      },
    });
  }
  static async findCreditStatusById(idCreditStatus) {
    return await prisma.credit_statuses.findUnique({
      where: {
        id_credit_status:
          Number(idCreditStatus),
      },
    });
  }

  static async findSaleStatusByName(nameStatus) {
    return await prisma.sale_statuses.findUnique({
      where: {
        name_status:
          nameStatus,
      },
    });
  }

  static async findOrderStatusById(idOrderStatus) {
    return await prisma.order_statuses.findUnique({
      where: {
        id_order_status:
          Number(idOrderStatus),
      },
    });
  }

  static async findOrderStatusByName(nameStatus) {
    return await prisma.order_statuses.findUnique({
      where: {
        name_status:
          nameStatus,
      },
    });
  }

  static async findSaleTypeById(idSaleType) {
    return await prisma.sale_types.findUnique({
      where: {
        id_sale_type:
          Number(idSaleType),
      },
    });
  }

  static async findSaleTypeByName(saleTypeName) {
    return await prisma.sale_types.findFirst({
      where: {
        sale_type_name: {
          equals:
            saleTypeName,
          mode:
            "insensitive",
        },
      },
    });
  }

  static async findEmployeeById(idEmployee) {
    return await prisma.employees.findUnique({
      where: {
        id_employee:
          Number(idEmployee),
      },
    });
  }

  static async findEmployeeByUserId(idUser) {
    return await prisma.employees.findUnique({
      where: {
        id_user:
          Number(idUser),
      },
    });
  }

  static async findOrderById(idOrder) {
    return await prisma.sales_orders.findUnique({
      where: {
        id_order:
          Number(idOrder),
      },
      include: {
        sales: true,
        clients: {
          include: {
            users: true,
          },
        },
        order_details: true,
        order_statuses: true,
        payment_statuses: true,
        order_payments: {
          include: {
            payment_methods: true,
          },
        },
      },
    });
  }
}
