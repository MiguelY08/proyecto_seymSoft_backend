import { prisma } from "../../../../config/prisma.js";
import { PurchaseReturnMapper } from "../mappers/purchaseReturnMapper.js";

export class PurchaseReturnRepository {
  static async findById(idPurchaseReturn) {
    const purchaseReturn = await prisma.purchases_returns.findUnique({
      where: {
        id_purchase_return: idPurchaseReturn,
      },
      select: this.getByIdSelect(),
    });

    return PurchaseReturnMapper.toDetailResponse(purchaseReturn);
  }

  static async findRawById(idPurchaseReturn) {
    return prisma.purchases_returns.findUnique({
      where: {
        id_purchase_return: idPurchaseReturn,
      },
      include: this.getDefaultInclude(),
    });
  }

  static async findRawByPurchaseId(idPurchase) {
    return prisma.purchases_returns.findMany({
      where: {
        id_purchase: Number(idPurchase),
      },
      include: this.getDefaultInclude(),
    });
  }

  static async findAll({ skip = 0, take = 10, where = {}, orderBy = {} }) {
    const [items, total] = await Promise.all([
      prisma.purchases_returns.findMany({
        where,
        skip,
        take,
        orderBy,
        include: this.getListInclude(),
      }),
      prisma.purchases_returns.count({ where }),
    ]);

    return {
      items: items.map((item) => PurchaseReturnMapper.toListResponse(item)),
      total,
    };
  }

  static async findPurchaseById(idPurchase) {
    const purchase = await prisma.purchases.findUnique({
      where: {
        id_purchase: idPurchase,
      },
      include: {
        providers: true,
        purchase_statuses: true,
        purchase_details: {
          include: {
            barcodes: {
              include: {
                products: true,
              },
            },
          },
        },
      },
    });

    return PurchaseReturnMapper.toPurchase(purchase);
  }

  static async findRawPurchaseById(idPurchase) {
    return prisma.purchases.findUnique({
      where: {
        id_purchase: idPurchase,
      },
      include: {
        providers: true,
        purchase_statuses: true,
        purchase_details: {
          include: {
            barcodes: {
              include: {
                products: true,
              },
            },
          },
        },
      },
    });
  }

  static async findPurchaseDetailById(idPurchaseDetail) {
    const detail = await prisma.purchase_details.findUnique({
      where: {
        id_purchase_detail: idPurchaseDetail,
      },
      include: {
        barcodes: {
          include: {
            products: true,
          },
        },
        purchases: true,
      },
    });

    return PurchaseReturnMapper.toPurchaseDetail(detail);
  }

  static async findRawPurchaseDetailById(idPurchaseDetail) {
    return prisma.purchase_details.findUnique({
      where: {
        id_purchase_detail: idPurchaseDetail,
      },
      include: {
        barcodes: {
          include: {
            products: true,
          },
        },
        purchases: true,
      },
    });
  }

  static async findRawReturnDetailById(idPurchaseReturnDetail) {
    return prisma.prd.findUnique({
      where: {
        id_purchase_return_details:
          Number(idPurchaseReturnDetail),
      },
      include: {
        purchases_returns: true,
        return_reasons: true,
        return_methods: true,
        return_statuses: true,
        products: true,
        purchase_details: {
          include: {
            purchases: true,
            barcodes: {
              include: {
                products: true,
              },
            },
          },
        },
        prsh: true,
      },
    });
  }

  static async findReturnStatusById(idReturnStatus) {
    return prisma.return_statuses.findUnique({
      where: {
        id_return_status: idReturnStatus,
      },
    });
  }

  static async findReturnStatusByName(nameStatus) {
    return prisma.return_statuses.findFirst({
      where: {
        name_status: {
          equals: nameStatus,
          mode: "insensitive",
        },
      },
    });
  }

  static async findReturnMethodById(idReturnMethod) {
    return prisma.return_methods.findUnique({
      where: {
        id_return_method: idReturnMethod,
      },
    });
  }

  static async findReturnMethodByDescription(description) {
    return prisma.return_methods.findFirst({
      where: {
        description: {
          equals: description,
          mode: "insensitive",
        },
      },
    });
  }

  static async findReturnReasonById(idReturnReason) {
    return prisma.return_reasons.findUnique({
      where: {
        id_return_reason: idReturnReason,
      },
    });
  }

  static async findBarcodeById(idBarcode) {
    return prisma.barcodes.findUnique({
      where: {
        id_barcode: idBarcode,
      },
      include: {
        products: true,
      },
    });
  }

  static async getReturnedQuantityByPurchaseDetail(idPurchaseDetail) {
    const result = await prisma.prd.aggregate({
      _sum: {
        quantity: true,
      },
      where: {
        id_purchase_detail: Number(idPurchaseDetail),
      },
    });

    return result._sum.quantity ?? 0;
  }

  static async create(data) {
    const created = await prisma.$transaction(async (tx) => {
      const purchaseReturn = await tx.purchases_returns.create({
        data: {
          id_purchase: data.idPurchase,
          id_return_status: data.idReturnStatus,
          prd: {
            create: data.details.map((detail) => ({
              barcode: detail.barcode,
              quantity: detail.quantity,
              supplier_date: detail.supplierDate ?? null,
              id_return_reason: detail.idReturnReason,
              id_return_method: detail.idReturnMethod,
              id_return_status: detail.idReturnStatus,
              id_product: detail.idProduct,
              id_purchase_detail: detail.idPurchaseDetail,
            })),
          },
        },
        include: this.getDefaultInclude(),
      });

      for (const detail of data.details) {
        await tx.barcodes.update({
          where: {
            id_barcode: detail.idBarcode,
          },
          data: {
            stock: {
              decrement: detail.quantity,
            },
          },
        });
      }

      if (data.idPurchaseStatus) {
        await tx.purchases.update({
          where: {
            id_purchase: data.idPurchase,
          },
          data: {
            id_purchase_status: data.idPurchaseStatus,
          },
        });
      }

      return purchaseReturn;
    });

    return PurchaseReturnMapper.toResponse(created);
  }

  static async addDetails(idPurchaseReturn, details) {
    const updated = await prisma.$transaction(async (tx) => {
      await tx.prd.createMany({
        data: details.map((detail) => ({
          id_purchase_return: idPurchaseReturn,
          barcode: detail.barcode,
          quantity: detail.quantity,
          supplier_date: detail.supplierDate ?? null,
          id_return_reason: detail.idReturnReason,
          id_return_method: detail.idReturnMethod,
          id_return_status: detail.idReturnStatus,
          id_product: detail.idProduct,
          id_purchase_detail: detail.idPurchaseDetail,
        })),
      });

      for (const detail of details) {
        await tx.barcodes.update({
          where: {
            id_barcode: detail.idBarcode,
          },
          data: {
            stock: {
              decrement: detail.quantity,
            },
          },
        });
      }

      return tx.purchases_returns.findUnique({
        where: {
          id_purchase_return: idPurchaseReturn,
        },
        include: this.getDefaultInclude(),
      });
    });

    return PurchaseReturnMapper.toResponse(updated);
  }

  static async updateDetailStatus(idPurchaseReturnDetail, idReturnStatus) {
    const updated = await prisma.prd.update({
      where: {
        id_purchase_return_details: idPurchaseReturnDetail,
      },
      data: {
        id_return_status: idReturnStatus,
      },
      include: {
        return_reasons: true,
        return_methods: true,
        return_statuses: true,
        products: true,
        purchase_details: {
          include: {
            barcodes: {
              include: {
                products: true,
              },
            },
          },
        },
        prsh: true,
      },
    });

    return PurchaseReturnMapper.toPurchaseReturnDetail(updated);
  }

  static async updateReturnStatus(idPurchaseReturn, idReturnStatus) {
    const updated = await prisma.purchases_returns.update({
      where: {
        id_purchase_return: idPurchaseReturn,
      },
      data: {
        id_return_status: idReturnStatus,
      },
      include: this.getDefaultInclude(),
    });

    return PurchaseReturnMapper.toResponse(updated);
  }

  static async updatePurchaseStatus(idPurchase, idPurchaseStatus) {
    return prisma.purchases.update({
      where: {
        id_purchase: idPurchase,
      },
      data: {
        id_purchase_status: idPurchaseStatus,
      },
    });
  }

  static async incrementBarcodeStock(idBarcode, quantity) {
    return prisma.barcodes.update({
      where: {
        id_barcode: Number(idBarcode),
      },
      data: {
        stock: {
          increment: Number(quantity),
        },
      },
    });
  }

  static async cancelPurchaseReturn({
    idPurchaseReturn,
    idReturnStatus,
    cancellationReason,
    idPurchaseStatus,
    detailsToRestore = null,
  }) {
    const cancelled = await prisma.$transaction(async (tx) => {
      const purchaseReturn = await tx.purchases_returns.findUnique({
        where: {
          id_purchase_return: idPurchaseReturn,
        },
        include: {
          prd: true,
        },
      });

      const stockDetails =
        detailsToRestore || purchaseReturn.prd;

      for (const detail of stockDetails) {
        const barcode = await tx.barcodes.findUnique({
          where: {
            barcode: detail.barcode,
          },
        });

        if (barcode) {
          await tx.barcodes.update({
            where: {
              id_barcode: barcode.id_barcode,
            },
            data: {
              stock: {
                increment: detail.quantity,
              },
            },
          });
        }
      }

      await tx.prd.updateMany({
        where: {
          id_purchase_return: idPurchaseReturn,
        },
        data: {
          id_return_status: idReturnStatus,
        },
      });

      const updatedReturn = await tx.purchases_returns.update({
        where: {
          id_purchase_return: idPurchaseReturn,
        },
        data: {
          id_return_status: idReturnStatus,
        },
        include: this.getDefaultInclude(),
      });

      if (idPurchaseStatus) {
        await tx.purchases.update({
          where: {
            id_purchase: updatedReturn.id_purchase,
          },
          data: {
            id_purchase_status: idPurchaseStatus,
          },
        });
      }

      return updatedReturn;
    });

    return {
      ...PurchaseReturnMapper.toResponse(cancelled),
      cancellationReason,
    };
  }

  static async getMetrics() {
    const groupedByStatus =
      await prisma.purchases_returns.groupBy({
        by: ["id_return_status"],
        _count: {
          id_purchase_return: true,
        },
      });

    const byStatus =
      groupedByStatus.reduce((acc, item) => {
        acc[item.id_return_status] =
          item._count.id_purchase_return;

        return acc;
      }, {});

    const total =
      Object.values(byStatus).reduce(
        (sum, count) => sum + count,
        0
      );

    return {
      total,
      byStatus,
    };
  }

  static getDefaultInclude() {
    return {
      return_statuses: true,
      purchases: {
        include: {
          providers: true,
          purchase_statuses: true,
          purchase_details: {
            include: {
              barcodes: {
                include: {
                  products: true,
                },
              },
            },
          },
        },
      },
      prd: {
        include: {
          return_reasons: true,
          return_methods: true,
          return_statuses: true,
          products: true,
          purchase_details: {
            include: {
              barcodes: {
                include: {
                  products: true,
                },
              },
            },
          },
          prsh: true,
        },
      },
      hsp: true,
    };
  }

  static getByIdSelect() {
    return {
      id_purchase_return: true,
      id_purchase: true,
      creation_date: true,
      id_return_status: true,
      return_statuses: {
        select: {
          id_return_status: true,
          name_status: true,
        },
      },
      purchases: {
        select: {
          id_purchase: true,
          invoice_number: true,
          purchase_date: true,
          max_return_date: true,
          total_amount: true,
          id_provider: true,
          id_purchase_status: true,
          providers: {
            select: {
              id_provider: true,
              name_provider: true,
              max_return_period: true,
            },
          },
          purchase_statuses: {
            select: {
              id_purchase_status: true,
              name_puchase_status: true,
            },
          },
        },
      },
      prd: {
        select: {
          id_purchase_return_details: true,
          id_purchase_return: true,
          id_purchase_detail: true,
          barcode: true,
          quantity: true,
          supplier_date: true,
          id_return_reason: true,
          id_return_method: true,
          id_return_status: true,
          id_product: true,
          return_reasons: {
            select: {
              id_return_reason: true,
              description: true,
            },
          },
          return_methods: {
            select: {
              id_return_method: true,
              description: true,
            },
          },
          return_statuses: {
            select: {
              id_return_status: true,
              name_status: true,
            },
          },
          products: {
            select: {
              id_product: true,
              name: true,
              reference: true,
            },
          },
          purchase_details: {
            select: {
              id_purchase_detail: true,
              id_barcode: true,
              barcodes: {
                select: {
                  id_barcode: true,
                  stock: true,
                },
              },
            },
          },
          prsh: {
            select: {
              id_status_history: true,
              id_detail: true,
              status: true,
              status_date: true,
            },
          },
        },
      },
      hsp: {
        select: {
          id_history_status_purchase: true,
          id_purchase_return: true,
          id_purchase_status: true,
          id_purchase_detail: true,
          status_date: true,
        },
      },
    };
  }

  static getListInclude() {
    return {
      return_statuses: {
        select: {
          id_return_status: true,
          name_status: true,
        },
      },
      purchases: {
        select: {
          invoice_number: true,
          providers: {
            select: {
              id_provider: true,
              name_provider: true,
            },
          },
        },
      },
      prd: {
        select: {
          id_return_status: true,
        },
      },
    };
  }
}
