import { prisma } from "../../../../config/prisma.js";
import { VendingMapper } from "../mappers/vendingMapper.js";

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

export class VendingRepository {

  static async create(data) {
    const sale =
      await prisma.$transaction(async (tx) => {
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
                        paymentMethod.idPaymentMethod,
                      amount:
                        paymentMethod.amount ?? null,
                    })
                  ),
              },
              ...(data.saleDate && {
                sale_date:
                  data.saleDate,
              }),
            },
            include:
              saleInclude,
          });

        if (data.decreaseStock) {
          for (const detail of data.orderDetails || []) {
            await tx.barcodes.updateMany({
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
            });
          }
        }

        return createdSale;
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
            `El código de barras ${detail.barcode} no existe`,
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
            `Stock insuficiente para el código de barras ${detail.barcode}`,
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

  static async findSaleStatusById(idSaleStatus) {
    return await prisma.sale_statuses.findUnique({
      where: {
        id_sale_status:
          Number(idSaleStatus),
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
    return await prisma.sale_types.findUnique({
      where: {
        sale_type_name:
          saleTypeName,
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
        order_details: true,
      },
    });
  }
}

