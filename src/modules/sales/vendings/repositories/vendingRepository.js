import { prisma } from "../../../../config/prisma.js";
import {
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
          credit_balance: true,
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

const getCreditAmount = (paymentMethods = []) => {
  const creditPayment = paymentMethods.find(
    (paymentMethod) => Number(paymentMethod.idPaymentMethod) === CREDIT_PAYMENT_METHOD_ID
  );

  return Number(creditPayment?.amount || 0);
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
            include: {
              clients: {
                select: {
                  id_client: true,
                  credit_balance: true,
                },
              },
            },
          });

        if (!order) {
          throw new Error("Pedido no encontrado");
        }

        const creditData =
          buildCreditData({
            data,
            idCustomer:
              order.id_customer,
            creditAmount,
          });

        if (creditAmount > 0) {
          const creditBalance =
            Number(order.clients?.credit_balance || 0);

          if (creditAmount > creditBalance) {
            throw new Error("El cupo disponible del cliente no es suficiente para la venta a credito");
          }

          await tx.clients.update({
            where: {
              id_client:
                Number(order.id_customer),
            },
            data: {
              credit_balance: {
                decrement:
                  creditAmount,
              },
            },
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

        if (data.markOrderAsPaid) {
          await tx.sales_orders.update({
            where: {
              id_order:
                Number(data.idOrder),
            },
            data: {
              id_payment_status:
                PAYMENT_STATUSES[2].id,
              payment_status:
                PAYMENT_STATUSES[2].name,
            },
          });
        }

        if (data.decreaseStock) {
          await Promise.all(
            (data.orderDetails || []).map((detail) =>
              tx.barcodes.updateMany({
                where: {
                  barcode:
                    detail.barcode,
                },
                data: {
                  stock: {
                    decrement:
                      detail.quantity,
                  },
                },
              })
            )
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
        include:
          saleInclude,
      });

    return VendingMapper.toDomain(
      sale
    );
  }
  static async update(idSale, data) {
    const sale =
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
                id_order_status:
                  data.idOrderStatus,
              }),
            },
          });
        }

        return await tx.sales.findUnique({
          where: {
            id_sale:
              Number(idSale),
          },
          include:
            saleInclude,
        });
      });

    return VendingMapper.toDomain(
      sale
    );
  }

  static async annular(idSale, data) {
    const sale =
      await prisma.$transaction(async (tx) => {
        const currentSale =
          await tx.sales.findUnique({
            where: {
              id_sale:
                Number(idSale),
            },
            include: {
              credits: true,
              sale_payment_methods: true,
              sales_orders: {
                include: {
                  order_details: true,
                },
              },
            },
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
            id_order_status:
              data.idOrderStatus,
          },
        });

        if (currentSale.credits) {
          await tx.clients.update({
            where: {
              id_client:
                currentSale.credits.id_customer,
            },
            data: {
              credit_balance: {
                increment:
                  Number(currentSale.credits.remaining_balance || 0),
              },
            },
          });
        }

        for (const detail of currentSale.sales_orders.order_details || []) {
          await tx.barcodes.updateMany({
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
          });
        }

        return await tx.sales.findUnique({
          where: {
            id_sale:
              Number(idSale),
          },
          include:
            saleInclude,
        });
      });

    return VendingMapper.toDomain(
      sale
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
          include:
            saleInclude,
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

    for (const detail of details) {
      const barcode =
        await prisma.barcodes.findUnique({
          where: {
            barcode:
              detail.barcode,
          },
          select: {
            barcode: true,
            stock: true,
          },
        });

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



