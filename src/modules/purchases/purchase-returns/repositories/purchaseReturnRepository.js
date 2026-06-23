import { prisma } from "../../../../config/prisma.js";
import {
  RETURN_DETAIL_STATUS_IDS,
  RETURN_LIFECYCLE,
  calculatePurchaseDetailReturnAvailability,
  calculatePurchaseStatusFromReturns,
  calculateReturnLifecycle,
} from "../helpers/purchaseReturnHelper.js";
import { PurchaseReturnMapper } from "../mappers/purchaseReturnMapper.js";

const getHeaderStatusFromLifecycle = (lifecycle) =>
  lifecycle === RETURN_LIFECYCLE.COMPLETED
    ? RETURN_DETAIL_STATUS_IDS.READY
    : RETURN_DETAIL_STATUS_IDS.PENDING_SHIPMENT;

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
      select: this.getRawReturnSelect(),
    });
  }

  static async findRawByPurchaseId(idPurchase) {
    return prisma.purchases_returns.findMany({
      where: {
        id_purchase: Number(idPurchase),
      },
      select: this.getRawReturnForPurchaseStatusSelect(),
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
      select: {
        id_purchase_return_details: true,
        id_purchase_return: true,
        quantity: true,
        id_return_method: true,
        id_return_status: true,
        purchase_details: {
          select: {
            id_barcode: true,
          },
        },
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
    const availability =
      await this.getReturnAvailabilityByPurchaseDetail(
        idPurchaseDetail
      );

    return (
      availability.reservedQuantity +
      availability.finalReturnedQuantity
    );
  }

  static async getReturnAvailabilityByPurchaseDetail(
    idPurchaseDetail,
    client = prisma
  ) {
    const purchaseDetail =
      await client.purchase_details.findUnique({
        where: {
          id_purchase_detail: Number(idPurchaseDetail),
        },
        select: {
          quantity: true,
        },
      });

    if (!purchaseDetail) {
      return {
        purchasedQuantity: 0,
        reservedQuantity: 0,
        finalReturnedQuantity: 0,
        availableQuantity: 0,
      };
    }

    const returnDetails =
      await client.prd.findMany({
        where: {
          id_purchase_detail: Number(idPurchaseDetail),
        },
        select: {
          quantity: true,
          id_return_method: true,
          id_return_status: true,
        },
      });

    return calculatePurchaseDetailReturnAvailability({
      purchasedQuantity: purchaseDetail.quantity,
      returnDetails,
    });
  }

  static async getReturnAvailabilityByPurchaseDetails(
    idPurchaseDetails,
    client = prisma
  ) {
    const uniqueIds = [
      ...new Set(
        (idPurchaseDetails ?? [])
          .map((id) => Number(id))
          .filter(Boolean)
      ),
    ];

    if (uniqueIds.length === 0) {
      return new Map();
    }

    const [purchaseDetails, returnDetails] =
      await Promise.all([
        client.purchase_details.findMany({
          where: {
            id_purchase_detail: {
              in: uniqueIds,
            },
          },
          select: {
            id_purchase_detail: true,
            quantity: true,
          },
        }),
        client.prd.findMany({
          where: {
            id_purchase_detail: {
              in: uniqueIds,
            },
          },
          select: {
            id_purchase_detail: true,
            quantity: true,
            id_return_method: true,
            id_return_status: true,
          },
        }),
      ]);

    const returnDetailsByPurchaseDetail =
      returnDetails.reduce((grouped, detail) => {
        const id = Number(detail.id_purchase_detail);
        const details = grouped.get(id) ?? [];
        details.push(detail);
        grouped.set(id, details);
        return grouped;
      }, new Map());

    return purchaseDetails.reduce((availabilityByDetail, detail) => {
      const id = Number(detail.id_purchase_detail);

      availabilityByDetail.set(
        id,
        calculatePurchaseDetailReturnAvailability({
          purchasedQuantity: detail.quantity,
          returnDetails:
            returnDetailsByPurchaseDetail.get(id) ?? [],
        })
      );

      return availabilityByDetail;
    }, new Map());
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

    return this.findById(created.id_purchase_return);
  }

  static async addDetails(idPurchaseReturn, details) {
    return prisma.$transaction(async (tx) => {
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
    });
  }

  static assertValidUpdateChangeset(changeset) {
    if (
      !Number(changeset?.idPurchaseReturn) ||
      !Number(changeset?.idPurchase)
    ) {
      throw new Error("Invalid purchase return update changeset.");
    }
  }

  static createDomainError(message, errorCode, meta = null) {
    const error = new Error(message);
    error.errorCode = errorCode;
    error.meta = meta;
    return error;
  }

  static groupQuantitiesBy(items, key) {
    return items.reduce((grouped, item) => {
      const groupKey = Number(item[key]);
      grouped.set(
        groupKey,
        (grouped.get(groupKey) || 0) + Number(item.quantity)
      );
      return grouped;
    }, new Map());
  }

  static async assertFreshDetailsToAdd(tx, changeset) {
    if (changeset.detailsToAdd.length === 0) {
      return;
    }

    const requestedByPurchaseDetail =
      this.groupQuantitiesBy(
        changeset.detailsToAdd,
        "idPurchaseDetail"
      );

    const requestedByBarcode =
      this.groupQuantitiesBy(
        changeset.detailsToAdd,
        "idBarcode"
      );

    for (const [
      idPurchaseDetail,
      requestedQuantity,
    ] of requestedByPurchaseDetail.entries()) {
      const purchaseDetail =
        await tx.purchase_details.findUnique({
          where: {
            id_purchase_detail: idPurchaseDetail,
          },
          select: {
            id_purchase: true,
            quantity: true,
          },
        });

      if (!purchaseDetail) {
        throw this.createDomainError(
          `El detalle de compra ${idPurchaseDetail} no existe.`,
          "PURCHASE_DETAIL_NOT_FOUND"
        );
      }

      if (
        Number(purchaseDetail.id_purchase) !==
        Number(changeset.idPurchase)
      ) {
        throw this.createDomainError(
          `El detalle de compra ${idPurchaseDetail} no pertenece a la compra de la devolucion.`,
          "PURCHASE_DETAIL_DOES_NOT_BELONG_TO_PURCHASE"
        );
      }

      const returnAvailability =
        await this.getReturnAvailabilityByPurchaseDetail(
          idPurchaseDetail,
          tx
        );

      const availableQuantity =
        returnAvailability.availableQuantity;

      if (requestedQuantity > availableQuantity) {
        throw this.createDomainError(
          `La cantidad a devolver supera la cantidad disponible (${availableQuantity}).`,
          "RETURN_QUANTITY_EXCEEDED",
          {
            idPurchaseDetail,
            availableQuantity,
          }
        );
      }
    }

    for (const [
      idBarcode,
      requestedQuantity,
    ] of requestedByBarcode.entries()) {
      const barcode =
        await tx.barcodes.findUnique({
          where: {
            id_barcode: idBarcode,
          },
          select: {
            stock: true,
          },
        });

      const availableStock =
        Number(barcode?.stock || 0);

      if (requestedQuantity > availableStock) {
        throw this.createDomainError(
          "La cantidad a devolver supera el stock disponible.",
          "INSUFFICIENT_STOCK",
          {
            idBarcode,
            availableStock,
          }
        );
      }
    }
  }

  static async recalculateUpdateStatuses(tx, changeset) {
    const currentReturn =
      await tx.purchases_returns.findUnique({
        where: {
          id_purchase_return:
            changeset.idPurchaseReturn,
        },
        select: {
          prd: {
            select: {
              id_return_status: true,
            },
          },
        },
      });

    const lifecycle =
      calculateReturnLifecycle({
        details: currentReturn?.prd || [],
      });

    const idReturnStatus =
      getHeaderStatusFromLifecycle(lifecycle);

    await tx.purchases_returns.update({
      where: {
        id_purchase_return:
          changeset.idPurchaseReturn,
      },
      data: {
        id_return_status: idReturnStatus,
      },
    });

    const purchaseReturns =
      await tx.purchases_returns.findMany({
        where: {
          id_purchase: changeset.idPurchase,
        },
        select: this.getRawReturnForPurchaseStatusSelect(),
      });

    const idPurchaseStatus =
      calculatePurchaseStatusFromReturns(
        purchaseReturns
      );

    await tx.purchases.update({
      where: {
        id_purchase: changeset.idPurchase,
      },
      data: {
        id_purchase_status: idPurchaseStatus,
      },
    });
  }

  static async applyUpdateChangeset(changeset) {
    this.assertValidUpdateChangeset(changeset);

    const updatedReturn =
      await prisma.$transaction(async (tx) => {
        await this.assertFreshDetailsToAdd(
          tx,
          changeset
        );

        for (const stockIncrement of changeset.stockIncrements) {
          await tx.barcodes.update({
            where: {
              id_barcode: Number(stockIncrement.idBarcode),
            },
            data: {
              stock: {
                increment: Number(stockIncrement.quantity),
              },
            },
          });
        }

        for (const detail of changeset.detailStatusUpdates) {
          await tx.prd.update({
            where: {
              id_purchase_return_details:
                Number(detail.idPurchaseReturnDetail),
            },
            data: {
              id_return_status:
                Number(detail.idReturnStatus),
            },
          });
        }

        if (changeset.detailsToAdd.length > 0) {
          await tx.prd.createMany({
            data: changeset.detailsToAdd.map((detail) => ({
              id_purchase_return:
                changeset.idPurchaseReturn,
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
        }

        for (const stockDecrement of changeset.stockDecrements) {
          await tx.barcodes.update({
            where: {
              id_barcode: Number(stockDecrement.idBarcode),
            },
            data: {
              stock: {
                decrement: Number(stockDecrement.quantity),
              },
            },
          });
        }

        await this.recalculateUpdateStatuses(
          tx,
          changeset
        );

        return tx.purchases_returns.findUnique({
          where: {
            id_purchase_return:
              changeset.idPurchaseReturn,
          },
          select: this.getByIdSelect(),
        });
      });

    return PurchaseReturnMapper.toDetailResponse(
      updatedReturn
    );
  }

  static async updateDetailStatus(idPurchaseReturnDetail, idReturnStatus) {
    return prisma.prd.update({
      where: {
        id_purchase_return_details: idPurchaseReturnDetail,
      },
      data: {
        id_return_status: idReturnStatus,
      },
    });
  }

  static async updateReturnStatus(idPurchaseReturn, idReturnStatus) {
    return prisma.purchases_returns.update({
      where: {
        id_purchase_return: idPurchaseReturn,
      },
      data: {
        id_return_status: idReturnStatus,
      },
    });
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
        const idBarcode =
          detail.purchase_details?.id_barcode;

        if (idBarcode) {
          await tx.barcodes.update({
            where: {
              id_barcode: idBarcode,
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
      ...(await this.findById(cancelled.id_purchase_return)),
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

  static getRawReturnSelect() {
    return {
      id_purchase_return: true,
      id_purchase: true,
      id_return_status: true,
      return_statuses: {
        select: {
          name_status: true,
        },
      },
      purchases: {
        select: {
          purchase_date: true,
          max_return_date: true,
          providers: {
            select: {
              max_return_period: true,
            },
          },
        },
      },
      prd: {
        select: {
          id_purchase_return_details: true,
          barcode: true,
          quantity: true,
          id_return_method: true,
          id_return_status: true,
          purchase_details: {
            select: {
              id_barcode: true,
            },
          },
        },
      },
    };
  }

  static getRawReturnForPurchaseStatusSelect() {
    return {
      id_purchase_return: true,
      id_return_status: true,
      return_statuses: {
        select: {
          name_status: true,
        },
      },
      prd: {
        select: {
          id_return_status: true,
        },
      },
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
