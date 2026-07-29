// src/modules/sales/sales-returns/repositories/returnRepository.js

import { prisma } from '../../../../config/prisma.js';
import { ReturnMapper } from '../mappers/returnMapper.js';
import { processAndSaveImage, deleteImage } from '../../../../shared/utils/imageProcessor.js';
import { calculateReturnStockDelta } from '../helpers/returnHelpers.js';
import { evaluateSaleReturnEligibility } from '../helpers/saleReturnEligibility.js';
import {
  PURCHASE_STATUS_IDS,
  calculatePurchaseDetailReturnAvailability,
  getPurchaseMaxReturnDate,
  validatePurchaseReturnPeriod,
} from '../../../purchases/purchase-returns/helpers/purchaseReturnHelper.js';

const BUCKET_NAME = process.env.SUPABASE_BUCKET_SALES_RETURNS || 'sales_returns';

export class ReturnRepository {

  // ============================================
  // CONSULTAS
  // ============================================

  static async findById(id) {
    const data = await prisma.sales_returns.findUnique({
      where: { id_sales_return: Number(id) },
      include: {
        return_statuses: {
          select: {
            id_return_status: true,
            name_status: true
          }
        },
        sale_return_details: {
          include: {
            return_reasons: {
              select: {
                id_return_reason: true,
                description: true
              }
            },
            return_methods: {
              select: {
                id_return_method: true,
                description: true
              }
            },
            return_statuses: {
              select: {
                id_return_status: true,
                name_status: true
              }
            },
            barcodes: {
              include: {
                products: {
                    select: {
                      id_product: true,
                      name: true,
                      reference: true,
                      retail_price: true,
                      product_images: {
                        orderBy: [
                          { is_primary: 'desc' },
                          { id_image: 'asc' }
                        ],
                        take: 1,
                        select: { image_url: true }
                      }
                  }
                }
              }
            }
          }
        },
        sale_return_evidence: {
          select: {
            id_evidence: true,
            image_path: true,
            image_description: true
          }
        },
        sales: {
          select: {
            sales_orders: {
              select: {
                order_details: {
                  select: {
                    barcode: true,
                    unit_price: true
                  }
                }
              }
            }
          }
        }
      }
    });

    return ReturnMapper.toDto(data);
  }

  static async findRawById(id) {
    return prisma.sales_returns.findUnique({
      where: { id_sales_return: Number(id) },
      include: {
        return_statuses: {
          select: {
            name_status: true
          }
        },
        sale_return_details: {
          include: {
            return_statuses: true,
            return_methods: true,
            barcodes: {
              include: {
                products: {
                  select: {
                    retail_price: true
                  }
                }
              }
            }
          }
        }
      }
    });
  }

// ============================================
// find ALL CON RETAIL_PRICE
// ============================================

static async findAll(filters = {}) {
  const { page = 1, limit = 13, search = '', startDate = '', endDate = '', clientId = null } = filters;
  const skip = (page - 1) * limit;

  const where = {};

  if (clientId) {
    where.sales = {
      sales_orders: {
        id_customer: Number(clientId)
      }
    };
  }

  if (search) {
    where.OR = [
      { return_number: { contains: search, mode: 'insensitive' } },
      { returnable_sale_data: { path: ['invoiceNumber'], string_contains: search } },
      { returnable_sale_data: { path: ['clientName'], string_contains: search } }
    ];
  }

  if (startDate && endDate) {
    where.creation_date = {
      gte: new Date(startDate),
      lte: new Date(endDate)
    };
  } else if (startDate) {
    where.creation_date = { gte: new Date(startDate) };
  } else if (endDate) {
    where.creation_date = { lte: new Date(endDate) };
  }

  const [items, total] = await Promise.all([
    prisma.sales_returns.findMany({
      where,
      skip,
      take: limit,
      orderBy: { creation_date: 'desc' },
      include: {
        return_statuses: {
          select: {
            id_return_status: true,
            name_status: true
          }
        },
        sale_return_details: {
          include: {
            return_reasons: {
              select: {
                id_return_reason: true,
                description: true
              }
            },
            return_methods: {
              select: {
                id_return_method: true,
                description: true
              }
            },
            return_statuses: {
              select: {
                id_return_status: true,
                name_status: true
              }
            },
            barcodes: {
              include: {
                products: {
                    select: {
                      id_product: true,
                      name: true,
                      reference: true,
                      retail_price: true,
                      product_images: {
                        orderBy: [
                          { is_primary: 'desc' },
                          { id_image: 'asc' }
                        ],
                        take: 1,
                        select: { image_url: true }
                      }
                  }
                }
              }
            }
          }
        },
        sale_return_evidence: {
          select: {
            id_evidence: true,
            image_path: true,
            image_description: true
          }
        },
        sales: {
          select: {
            sales_orders: {
              select: {
                order_details: {
                  select: {
                    barcode: true,
                    unit_price: true
                  }
                }
              }
            }
          }
        }
      }
    }),
    prisma.sales_returns.count({ where })
  ]);

  return {
    data: items.map(item => ReturnMapper.toListDto(item)),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

  static async findClientIdByUserId(idUser) {
    const client = await prisma.clients.findUnique({
      where: { id_user: Number(idUser) },
      select: { id_client: true }
    });

    return client?.id_client || null;
  }

  static async belongsToClient(idReturn, idClient) {
    const count = await prisma.sales_returns.count({
      where: {
        id_sales_return: Number(idReturn),
        sales: {
          sales_orders: {
            id_customer: Number(idClient)
          }
        }
      }
    });

    return count > 0;
  }

  // ============================================
  // DEVOLUCIONES DISPONIBLES (INCLUYE ANULADAS)
  // ============================================

  static async getReturnableSales(clientId) {
    const client = await prisma.clients.findUnique({
      where: { id_client: Number(clientId) }
    });

    if (!client) {
      throw new Error('Cliente no encontrado');
    }

    const sales = await prisma.sales.findMany({
      where: {
        sales_orders: {
          id_customer: Number(clientId)
        },
      },
      include: {
        sales_orders: {
          include: {
            hev: {
              select: {
                status_date: true
              }
            },
            order_statuses: {
              select: {
                name_status: true
              }
            },
            order_details: {
              include: {
                products: {
                  include: {
                    product_images: {
                      orderBy: [
                        { is_primary: 'desc' },
                        { id_image: 'asc' }
                      ],
                      take: 1
                    },
                    barcodes: {
                      select: {
                        id_barcode: true,
                        barcode: true,
                        stock: true
                      }
                    }
                  }
                }
              }
            },
            clients: {
              include: {
                users: {
                  select: {
                    full_name: true,
                    phone: true
                  }
                }
              }
            }
          }
        },
        employees: {
          include: {
            users: {
              select: {
                full_name: true
              }
            }
          }
        },
        sale_statuses: {
          select: {
            name_status: true
          }
        }
      },
      orderBy: { sale_date: 'desc' }
    });

    return sales.filter(
      (sale) => evaluateSaleReturnEligibility(sale).canReturn
    ).map(sale => {
      const order = sale.sales_orders;
      const details = [];
      
      order?.order_details?.forEach(orderDetail => {
        const productBarcodes = orderDetail.products?.barcodes || [];
        
        productBarcodes.forEach(barcode => {
          details.push({
            id: orderDetail.id_order_detail,
            idProduct: orderDetail.id_product,
            productName: orderDetail.products?.name || '',
            barcode: barcode.barcode,
            idBarcode: barcode.id_barcode,
            quantity: orderDetail.quantity || 0,
            unitPrice: Number(orderDetail.unit_price || 0),
            subtotal: Number(orderDetail.subtotal || 0),
            ivaAmount: Number(orderDetail.iva_amount || 0),
            stockAvailable: barcode.stock || 0
            ,
            imageUrl: orderDetail.products?.product_images?.[0]?.image_url || null
          });
        });
      });

      const clientUser = order?.clients?.users;
      let clientPhone = clientUser?.phone || null;
      if (clientPhone !== null && clientPhone !== undefined) {
        clientPhone = String(clientPhone);
      }

      return {
        idSale: sale.id_sale,
        idOrder: sale.id_order,
        invoiceNumber: String(sale.id_sale),
        clientName: clientUser?.full_name || '',
        clientId: order?.id_customer || '',
        clientPhone: clientPhone,
        clientAddress: order?.clients?.address || '',
        employeeName: sale.employees?.users?.full_name || '',
        saleDate: sale.sale_date,
        subtotal: Number(sale.subtotal || 0),
        total: Number(order?.total || sale.subtotal || 0),
        details: details,
        statusId: sale.id_sale_status
      };
    });
  }

  // ============================================
  // CREAR
  // ============================================

  static async create(data, evidenceFiles = []) {
    return prisma.$transaction(async (tx) => {
      const saleReturn = await tx.sales_returns.create({
        data: {
          id_sale: data.idSale,
          return_number: data.returnNumber,
          id_return_status: data.idReturnStatus,
          total_amount: data.totalAmount,
          total_products: data.totalProducts,
          total_units: data.totalUnits,
          description: data.description,
          returnable_sale_data: data.returnableSaleData
        }
      });

      const createdDetails = [];
      for (const detail of data.details) {
        const createdDetail = await tx.sale_return_details.create({
          data: {
            id_sales_return: saleReturn.id_sales_return,
            barcode: detail.barcode,
            quantity: detail.quantity,
            id_return_reason: detail.idReturnReason,
            id_return_method: detail.idReturnMethod,
            id_return_status: detail.idReturnStatus,
            id_barcode: detail.idBarcode,
            description: detail.description || null
          }
        });
        createdDetails.push(createdDetail);
      }

      if (Array.isArray(data.returnableSaleData?.details)) {
        const detailsSnapshot = data.returnableSaleData.details.map((detail, index) => ({
          ...detail,
          idSaleReturnDetail: createdDetails[index]?.id_sale_return_detail || null
        }));

        await tx.sales_returns.update({
          where: { id_sales_return: saleReturn.id_sales_return },
          data: {
            returnable_sale_data: {
              ...data.returnableSaleData,
              details: detailsSnapshot,
              creditEvents: []
            }
          }
        });
      }

      if (evidenceFiles && evidenceFiles.length > 0) {
        for (const file of evidenceFiles) {
          try {
            const imageUrl = await processAndSaveImage(file.buffer, {
              bucketName: BUCKET_NAME,
              config: {
                prefix: `return_${saleReturn.id_sales_return}`,
                minWidth: 300,
                minHeight: 300,
                outputWidth: 800,
                outputHeight: 800,
                webpQuality: 80
              }
            });

            await tx.sale_return_evidence.create({
              data: {
                id_sales_return: saleReturn.id_sales_return,
                image_path: imageUrl,
                image_description: data.evidenceDescription || null
              }
            });
          } catch (error) {
            console.error('Error subiendo evidencia a Supabase:', error);
            
            if (error.message && error.message.includes('no es una imagen válida')) {
              throw new Error(`El archivo "${file.originalname || 'sin nombre'}" no es una imagen válida. Por favor, usa JPG, PNG o WebP.`);
            }
          }
        }
      }

      return saleReturn;
    }, { timeout: 30000 });
  }

  // ============================================
  // ACTUALIZAR
  // ============================================

  static async update(id, data, newEvidenceFiles = []) {
    return prisma.$transaction(async (tx) => {
      const updated = await tx.sales_returns.update({
        where: { id_sales_return: Number(id) },
        data: {
          id_return_status: data.idReturnStatus,
          total_amount: data.totalAmount,
          total_products: data.totalProducts,
          total_units: data.totalUnits,
          description: data.description,
          updated_at: new Date()
        }
      });

      if (data.details && data.details.length > 0) {
        for (const detail of data.details) {
          await tx.sale_return_details.update({
            where: { id_sale_return_detail: detail.idSaleReturnDetail },
            data: {
              id_return_status: detail.idReturnStatus,
              id_return_method: detail.idReturnMethod
            }
          });
        }
      }

      if (newEvidenceFiles && newEvidenceFiles.length > 0) {
        for (const file of newEvidenceFiles) {
          try {
            const imageUrl = await processAndSaveImage(file.buffer, {
              bucketName: BUCKET_NAME,
              config: {
                prefix: `return_${id}`,
                minWidth: 300,
                minHeight: 300,
                outputWidth: 800,
                outputHeight: 800,
                webpQuality: 80
              }
            });

            await tx.sale_return_evidence.create({
              data: {
                id_sales_return: Number(id),
                image_path: imageUrl,
                image_description: file.description || data.evidenceDescription || null
              }
            });
          } catch (error) {
            console.error('Error subiendo evidencia a Supabase:', error);
          }
        }
      }

      return updated;
    });
  }

  // ============================================
  // ANULAR
  // ============================================

  static async cancelReturn({
    idReturn,
    idReturnStatus,
    cancellationReason
  }) 
  
  {
    return prisma.$transaction(async (tx) => {
      const returnForCredit = await tx.sales_returns.findUnique({
        where: { id_sales_return: Number(idReturn) },
        include: {
          sales: {
            select: {
              sales_orders: { select: { id_customer: true } }
            }
          }
        }
      });

      const saleData = returnForCredit?.returnable_sale_data || {};
      const snapshotDetails = Array.isArray(saleData.details) ? [...saleData.details] : [];
      const creditEvents = Array.isArray(saleData.creditEvents) ? [...saleData.creditEvents] : [];
      const defectiveResolutions = Array.isArray(saleData.defectiveResolutions)
        ? [...saleData.defectiveResolutions]
        : [];
      const appliedDetails = snapshotDetails.filter(
        detail => detail.creditApplied && !detail.creditReversed
      );

      if (appliedDetails.length > 0) {
        const clientId = returnForCredit.sales?.sales_orders?.id_customer || Number(saleData.clientId);
        const reversalAmount = appliedDetails.reduce(
          (total, detail) => total + Number(detail.creditAmount || 0),
          0
        );
        const client = await tx.clients.findUnique({
          where: { id_client: Number(clientId) },
          select: { credit_balance: true }
        });

        if (Number(client?.credit_balance || 0) < reversalAmount) {
          throw new Error('No se puede anular: el cliente ya utilizó parte del saldo a favor aplicado.');
        }

        await tx.clients.update({
          where: { id_client: Number(clientId) },
          data: { credit_balance: { decrement: reversalAmount } }
        });

        const reversedAt = new Date().toISOString();
        appliedDetails.forEach((appliedDetail) => {
          const index = snapshotDetails.findIndex(
            detail => detail.idSaleReturnDetail === appliedDetail.idSaleReturnDetail
          );
          snapshotDetails[index] = {
            ...snapshotDetails[index],
            creditReversed: true,
            creditReversedAt: reversedAt
          };
          creditEvents.push({
            id: `return-${idReturn}-detail-${appliedDetail.idSaleReturnDetail}-reversal`,
            type: 'REVERSAL',
            clientId: Number(clientId),
            returnId: Number(idReturn),
            returnNumber: returnForCredit.return_number,
            invoiceNumber: saleData.invoiceNumber || String(returnForCredit.id_sale),
            detailId: appliedDetail.idSaleReturnDetail,
            productName: appliedDetail.productName || 'Producto',
            quantity: Number(appliedDetail.quantity || 0),
            unitPrice: Number(appliedDetail.unitPrice || 0),
            amount: Number(appliedDetail.creditAmount || 0),
            reason: 'Reversión de saldo por anulación de devolución',
            processedBy: saleData.employeeName || 'Sistema',
            createdAt: reversedAt
          });
        });
      }

      const stockAppliedDetails = snapshotDetails.filter(detail => detail.stockApplied);
      for (const stockDetail of stockAppliedDetails) {
        const reverseDelta = -Number(stockDetail.stockDelta || 0);
        if (reverseDelta !== 0 && stockDetail.idBarcode) {
          const barcode = await tx.barcodes.findUnique({
            where: { id_barcode: Number(stockDetail.idBarcode) },
            select: { stock: true }
          });
          if (reverseDelta < 0 && Number(barcode?.stock || 0) < Math.abs(reverseDelta)) {
            throw new Error('No se puede anular: el stock recibido en la devolución ya no está disponible.');
          }
          await tx.barcodes.update({
            where: { id_barcode: Number(stockDetail.idBarcode) },
            data: { stock: { increment: reverseDelta } }
          });
        }

        const index = snapshotDetails.findIndex(
          detail => detail.idSaleReturnDetail === stockDetail.idSaleReturnDetail
        );
        snapshotDetails[index] = {
          ...snapshotDetails[index],
          stockApplied: false,
          stockReversed: true,
          stockReversedAt: new Date().toISOString()
        };
      }

      const nonConformingResolutionIds = [
        ...new Set(
          defectiveResolutions
            .filter(resolution =>
              resolution?.type === 'NON_CONFORMING' &&
              resolution?.referenceId &&
              !resolution?.cancelledBySaleReturnCancellation
            )
            .map(resolution => Number(resolution.referenceId))
            .filter(Number.isFinite)
        )
      ];
      const nonConformingCancelledAt = new Date().toISOString();

      if (nonConformingResolutionIds.length > 0) {
        await tx.non_conforming_products.updateMany({
          where: {
            id_ncp: { in: nonConformingResolutionIds },
            id_status: { not: 2 }
          },
          data: { id_status: 2 }
        });
      }

      const nextDefectiveResolutions = defectiveResolutions.map((resolution) => {
        const referenceId = Number(resolution?.referenceId);
        if (
          resolution?.type !== 'NON_CONFORMING' ||
          !nonConformingResolutionIds.includes(referenceId)
        ) {
          return resolution;
        }

        return {
          ...resolution,
          cancelledBySaleReturnCancellation: true,
          cancelledAt: nonConformingCancelledAt,
          cancellationReason: `Producto no conforme anulado porque se anuló la devolución de venta ${returnForCredit.return_number}.`
        };
      });

      const updatedReturn = await tx.sales_returns.update({
        where: {
          id_sales_return: Number(idReturn),
        },
        data: {
          id_return_status: idReturnStatus,
          cancellation_reason: cancellationReason,
          cancelled_at: new Date(),
          returnable_sale_data: {
            ...saleData,
            details: snapshotDetails,
            creditEvents,
            defectiveResolutions: nextDefectiveResolutions
          }
        },
      });

      await tx.sale_return_details.updateMany({
        where: { id_sales_return: Number(idReturn) },
        data: { id_return_status: idReturnStatus }
      });

      return updatedReturn;
    });
  }

  // ============================================
  // ELIMINAR EVIDENCIA INDIVIDUAL
  // ============================================

  static async removeEvidence(evidenceId) {
    return prisma.$transaction(async (tx) => {
      const evidence = await tx.sale_return_evidence.findUnique({
        where: { id_evidence: Number(evidenceId) }
      });

      if (!evidence) {
        throw new Error('Evidencia no encontrada');
      }

      try {
        await deleteImage(evidence.image_path, { bucketName: BUCKET_NAME });
      } catch (error) {
        console.error('[removeEvidence] Error eliminando de Supabase:', error);
      }

      return tx.sale_return_evidence.delete({
        where: { id_evidence: Number(evidenceId) }
      });
    });
  }

  // ============================================
  // HELPERS
  // ============================================

  static async findReturnStatusByName(name) {
    return prisma.return_statuses.findFirst({
      where: { name_status: { equals: name, mode: 'insensitive' } }
    });
  }

  static async findReturnStatusById(id) {
    return prisma.return_statuses.findUnique({
      where: { id_return_status: Number(id) }
    });
  }

  static async findReturnReasonByName(name) {
    return prisma.return_reasons.findFirst({
      where: { description: { contains: name, mode: 'insensitive' } }
    });
  }

  static async findReturnMethodByName(name) {
    return prisma.return_methods.findFirst({
      where: { description: { contains: name, mode: 'insensitive' } }
    });
  }

  static async findSaleById(idSale) {
    return prisma.sales.findUnique({
      where: { id_sale: Number(idSale) },
      include: {
        sales_orders: {
          include: {
            hev: {
              select: {
                status_date: true
              }
            },
            order_statuses: {
              select: {
                name_status: true
              }
            },
            order_details: {
              include: {
                products: true
              }
            },
            clients: {
              include: {
                users: {
                  select: {
                    full_name: true,
                    phone: true,
                    email: true
                  }
                }
              }
            }
          }
        },
        employees: {
          include: {
            users: {
              select: {
                full_name: true
              }
            }
          }
        },
        sale_statuses: {
          select: {
            name_status: true
          }
        }
      }
    });
  }

  static async findClientById(idClient) {
    return prisma.clients.findUnique({
      where: { id_client: Number(idClient) },
      include: {
        users: true
      }
    });
  }

  static async updateClientCreditBalance(idClient, newBalance) {
    return prisma.clients.update({
      where: { id_client: Number(idClient) },
      data: { credit_balance: newBalance }
    });
  }

  static async applyStockForDetailUpdates(idReturn, detailUpdates = []) {
    return prisma.$transaction(async (tx) => {
      const saleReturn = await tx.sales_returns.findUnique({
        where: { id_sales_return: Number(idReturn) },
        include: {
          sale_return_details: {
            include: {
              return_methods: true,
              return_reasons: true,
              barcodes: true
            }
          }
        }
      });

      if (!saleReturn) return [];

      const saleData = saleReturn.returnable_sale_data || {};
      const snapshotDetails = Array.isArray(saleData.details) ? [...saleData.details] : [];
      const stockEvents = [];

      for (const update of detailUpdates) {
        const currentDetail = saleReturn.sale_return_details.find(
          detail => detail.id_sale_return_detail === update.idSaleReturnDetail
        );
        if (!currentDetail?.id_barcode) continue;

        const targetStatus = await tx.return_statuses.findUnique({
          where: { id_return_status: Number(update.idReturnStatus) },
          select: { name_status: true }
        });
        const snapshotIndex = snapshotDetails.findIndex(
          detail => detail.idSaleReturnDetail === update.idSaleReturnDetail
        );
        if (snapshotIndex < 0) continue;

        const snapshot = snapshotDetails[snapshotIndex];
        const quantity = Number(currentDetail.quantity || 0);
        const method = currentDetail.return_methods?.description || '';
        const reason = currentDetail.return_reasons?.description || '';
        const isDefective = snapshot.isDefective === true ||
          ['DEFECTUOSO', 'MAL_ESTADO', 'PRODUCTO_INCOMPLETO'].includes(reason);
        const isReady = targetStatus?.name_status === 'Listo';

        if (!isReady && snapshot.stockApplied) {
          const reverseDelta = -Number(snapshot.stockDelta || 0);
          if (reverseDelta !== 0) {
            const barcode = await tx.barcodes.findUnique({
              where: { id_barcode: currentDetail.id_barcode },
              select: { stock: true }
            });
            if (reverseDelta < 0 && Number(barcode?.stock || 0) < Math.abs(reverseDelta)) {
              throw new Error('No se puede revertir el movimiento: el stock disponible es insuficiente.');
            }
            await tx.barcodes.update({
              where: { id_barcode: currentDetail.id_barcode },
              data: { stock: { increment: reverseDelta } }
            });
          }

          snapshotDetails[snapshotIndex] = {
            ...snapshot,
            stockApplied: false,
            stockRevertedAt: new Date().toISOString()
          };
          stockEvents.push({
            detailId: update.idSaleReturnDetail,
            type: 'REVERTED',
            delta: reverseDelta
          });
          continue;
        }

        if (!isReady || snapshot.stockApplied) continue;

        const stockDelta = calculateReturnStockDelta({
          method,
          isDefective,
          quantity
        });

        if (stockDelta !== 0) {
          const barcode = await tx.barcodes.findUnique({
            where: { id_barcode: currentDetail.id_barcode },
            select: { stock: true }
          });
          if (stockDelta < 0 && Number(barcode?.stock || 0) < Math.abs(stockDelta)) {
            throw new Error('No hay stock suficiente para entregar el producto de reemplazo.');
          }
          await tx.barcodes.update({
            where: { id_barcode: currentDetail.id_barcode },
            data: { stock: { increment: stockDelta } }
          });
        }

        const appliedAt = new Date().toISOString();
        snapshotDetails[snapshotIndex] = {
          ...snapshot,
          isDefective,
          stockApplied: true,
          stockDelta,
          stockAppliedAt: appliedAt
        };
        stockEvents.push({
          detailId: update.idSaleReturnDetail,
          type: 'APPLIED',
          method,
          isDefective,
          delta: stockDelta,
          appliedAt
        });
      }

      if (stockEvents.length > 0) {
        await tx.sales_returns.update({
          where: { id_sales_return: Number(idReturn) },
          data: {
            returnable_sale_data: {
              ...saleData,
              details: snapshotDetails
            }
          }
        });
      }

      return stockEvents;
    });
  }

  static async applyCreditForReadyDetails(idReturn, detailUpdates = []) {
    return prisma.$transaction(async (tx) => {
      const saleReturn = await tx.sales_returns.findUnique({
        where: { id_sales_return: Number(idReturn) },
        include: {
          sales: {
            select: {
              sales_orders: {
                select: { id_customer: true }
              }
            }
          },
          sale_return_details: {
            include: {
              return_methods: true,
              return_statuses: true,
              barcodes: {
                include: {
                  products: { select: { name: true } }
                }
              }
            }
          }
        }
      });

      if (!saleReturn) return [];

      const saleData = saleReturn.returnable_sale_data || {};
      const snapshotDetails = Array.isArray(saleData.details) ? [...saleData.details] : [];
      const creditEvents = Array.isArray(saleData.creditEvents) ? [...saleData.creditEvents] : [];
      const clientId = saleReturn.sales?.sales_orders?.id_customer || Number(saleData.clientId);
      const appliedEvents = [];

      for (const update of detailUpdates) {
        const currentDetail = saleReturn.sale_return_details.find(
          detail => detail.id_sale_return_detail === update.idSaleReturnDetail
        );
        if (!currentDetail) continue;

        const targetStatus = await tx.return_statuses.findUnique({
          where: { id_return_status: update.idReturnStatus }
        });
        const methodName = currentDetail.return_methods?.description || '';
        const snapshotIndex = snapshotDetails.findIndex(
          detail => detail.idSaleReturnDetail === update.idSaleReturnDetail
        );
        const snapshot = snapshotDetails[snapshotIndex];

        if (
          targetStatus?.name_status !== 'Listo' ||
          methodName !== 'Saldo a favor' ||
          !snapshot?.applyCredit ||
          snapshot?.creditApplied
        ) {
          continue;
        }

        const amount = Number(snapshot.unitPrice || 0) * Number(currentDetail.quantity || 0);
        if (!clientId || amount <= 0) continue;

        await tx.clients.update({
          where: { id_client: Number(clientId) },
          data: { credit_balance: { increment: amount } }
        });

        const event = {
          id: `return-${idReturn}-detail-${update.idSaleReturnDetail}-credit`,
          type: 'CREDIT',
          clientId: Number(clientId),
          returnId: Number(idReturn),
          returnNumber: saleReturn.return_number,
          invoiceNumber: saleData.invoiceNumber || String(saleReturn.id_sale),
          detailId: update.idSaleReturnDetail,
          productName: currentDetail.barcodes?.products?.name || snapshot.productName || 'Producto',
          quantity: Number(currentDetail.quantity || 0),
          unitPrice: Number(snapshot.unitPrice || 0),
          amount,
          reason: 'Saldo a favor por devolución de venta',
          processedBy: saleData.employeeName || 'Sistema',
          createdAt: new Date().toISOString()
        };

        snapshotDetails[snapshotIndex] = {
          ...snapshot,
          creditApplied: true,
          creditAppliedAt: event.createdAt,
          creditAmount: amount
        };
        creditEvents.push(event);
        appliedEvents.push(event);
      }

      if (appliedEvents.length > 0) {
        await tx.sales_returns.update({
          where: { id_sales_return: Number(idReturn) },
          data: {
            returnable_sale_data: {
              ...saleData,
              details: snapshotDetails,
              creditEvents
            }
          }
        });
      }

      return appliedEvents;
    });
  }

  // ============================================
  // PRODUCTOS NO CONFORMES Y DEVOLUCIÓN DE COMPRA
  // ============================================

  static async getDefaultNonConformingStatus() {
    return prisma.general_statuses.findFirst({
      where: { name_status: { equals: 'Pendiente', mode: 'insensitive' } }
    });
  }

  static async createNonConformingProduct(data) {
    return prisma.non_conforming_products.create({
      data: {
        affected_quantity: data.quantity,
        detection_date: new Date(),
        report_reason: data.reason,
        id_barcode: data.idBarcode,
        id_status: data.idStatus || 1,
      }
    });
  }

  static async findDefectiveReturnDetailContext(saleReturnId, saleReturnDetailId) {
    const saleReturn = await prisma.sales_returns.findUnique({
      where: { id_sales_return: Number(saleReturnId) },
      select: {
        id_sales_return: true,
        return_number: true,
        returnable_sale_data: true,
        sale_return_details: {
          where: { id_sale_return_detail: Number(saleReturnDetailId) },
          include: {
            return_reasons: true,
            return_methods: true,
            return_statuses: true,
            barcodes: true
          }
        }
      }
    });

    if (!saleReturn || saleReturn.sale_return_details.length === 0) {
      return null;
    }

    const detail = saleReturn.sale_return_details[0];
    const saleData = saleReturn.returnable_sale_data || {};

    return {
      saleReturn,
      detail,
      saleData,
      resolution: this.getDefectiveResolution(saleData, saleReturnDetailId)
    };
  }

  static getDefectiveResolution(returnableSaleData, saleReturnDetailId) {
    const resolutions = Array.isArray(returnableSaleData?.defectiveResolutions)
      ? returnableSaleData.defectiveResolutions
      : [];

    return resolutions.find((resolution) =>
      Number(resolution.detailId) === Number(saleReturnDetailId)
    ) || null;
  }

  static async saveDefectiveResolution(saleReturnId, saleData, resolution) {
    const resolutions = Array.isArray(saleData?.defectiveResolutions)
      ? saleData.defectiveResolutions
      : [];

    const nextResolutions = [
      ...resolutions.filter((item) =>
        Number(item.detailId) !== Number(resolution.detailId)
      ),
      resolution
    ];

    await prisma.sales_returns.update({
      where: { id_sales_return: Number(saleReturnId) },
      data: {
        returnable_sale_data: {
          ...(saleData || {}),
          defectiveResolutions: nextResolutions
        }
      }
    });

    return resolution;
  }

  static async getPurchaseReturnInfo(idBarcode, requestedQuantity = 1) {
    const purchaseDetails = await prisma.purchase_details.findMany({
      where: {
        id_barcode: Number(idBarcode)
      },
      include: {
        prd: true,
        barcodes: true,
        purchases: {
          include: {
            providers: {
              select: {
                id_provider: true,
                name_provider: true,
                max_return_period: true
              }
            },
            purchase_statuses: true
          }
        }
      },
      orderBy: {
        purchases: {
          purchase_date: 'desc'
        }
      }
    });

    if (!purchaseDetails.length) {
      return {
        canReturn: false,
        reason: 'No se encontró una compra asociada a este producto.',
        provider: null,
        purchaseDate: null,
        maxReturnDays: 0,
        maxReturnDate: null,
        daysSincePurchase: 0,
        idPurchase: null,
        idPurchaseDetail: null,
        availableQuantity: 0,
        requestedQuantity: Number(requestedQuantity || 1)
      };
    }

    const requested = Math.max(1, Number(requestedQuantity || 1));
    let bestExpired = null;
    let bestWithoutQuantity = null;
    let bestAnnulled = null;

    const candidates = purchaseDetails.map((purchaseDetail) => {
      const purchase = purchaseDetail.purchases;
      const provider = purchase?.providers || null;
      const availability = calculatePurchaseDetailReturnAvailability({
        purchasedQuantity: purchaseDetail.quantity,
        returnDetails: purchaseDetail.prd || []
      });
      const periodValidation = validatePurchaseReturnPeriod(purchase || {});
      const maxReturnDate = getPurchaseMaxReturnDate(purchase || {});
      const purchaseDate = purchase?.purchase_date || null;
      const daysSincePurchase = purchaseDate
        ? Math.floor((Date.now() - new Date(purchaseDate).getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      const isAnnulled = Number(purchase?.id_purchase_status) === PURCHASE_STATUS_IDS.ANNULLED;

      return {
        purchaseDetail,
        purchase,
        provider,
        availability,
        periodValidation,
        maxReturnDate,
        purchaseDate,
        daysSincePurchase,
        isAnnulled
      };
    });

    const eligible = [];

    for (const candidate of candidates) {
      if (candidate.isAnnulled) {
        bestAnnulled ??= candidate;
        continue;
      }

      if (!candidate.periodValidation.success) {
        bestExpired ??= candidate;
        continue;
      }

      if (candidate.availability.availableQuantity <= 0) {
        bestWithoutQuantity ??= candidate;
        continue;
      }

      eligible.push(candidate);
    }

    const selected =
      eligible.find((candidate) => candidate.availability.availableQuantity >= requested)
      || eligible[0];

    if (selected) {
      const maxReturnDays = selected.provider?.max_return_period || 0;

      return {
        canReturn: true,
        reason: selected.availability.availableQuantity >= requested
          ? 'Compra vigente con cantidad disponible.'
          : `Compra vigente, pero solo hay ${selected.availability.availableQuantity} unidad(es) disponibles.`,
        provider: selected.provider,
        providerName: selected.provider?.name_provider || null,
        purchaseDate: selected.purchaseDate,
        maxReturnDays,
        maxReturnDate: selected.maxReturnDate,
        daysSincePurchase: selected.daysSincePurchase,
        idPurchase: selected.purchaseDetail.id_purchase,
        idPurchaseDetail: selected.purchaseDetail.id_purchase_detail,
        invoiceNumber: selected.purchase?.invoice_number || selected.purchaseDetail.id_purchase,
        unitPrice: selected.purchaseDetail.net_unit_price,
        quantity: selected.purchaseDetail.quantity,
        availableQuantity: selected.availability.availableQuantity,
        requestedQuantity: requested
      };
    }

    const reference = bestWithoutQuantity || bestExpired || bestAnnulled || candidates[0];
    const reason = bestWithoutQuantity
      ? 'La compra asociada no tiene unidades disponibles para devolver.'
      : bestExpired
        ? 'La compra asociada ya está fuera del plazo permitido por el proveedor.'
        : bestAnnulled
          ? 'La compra asociada está anulada.'
          : 'No hay una compra vigente para devolver este producto.';

    return {
      canReturn: false,
      reason,
      provider: reference?.provider || null,
      providerName: reference?.provider?.name_provider || null,
      purchaseDate: reference?.purchaseDate || null,
      maxReturnDays: reference?.provider?.max_return_period || 0,
      maxReturnDate: reference?.maxReturnDate || null,
      daysSincePurchase: reference?.daysSincePurchase || 0,
      idPurchase: reference?.purchaseDetail?.id_purchase || null,
      idPurchaseDetail: reference?.purchaseDetail?.id_purchase_detail || null,
      invoiceNumber: reference?.purchase?.invoice_number || null,
      unitPrice: reference?.purchaseDetail?.net_unit_price || 0,
      quantity: reference?.purchaseDetail?.quantity || 0,
      availableQuantity: reference?.availability?.availableQuantity || 0,
      requestedQuantity: requested
    };
  }

  static async hasNonConformingProduct(idBarcode, saleReturnId) {
    const ncp = await prisma.non_conforming_products.findFirst({
      where: {
        id_barcode: Number(idBarcode),
        report_reason: {
          contains: `Devolución venta #${saleReturnId}`
        }
      }
    });
    return ncp !== null;
  }

  static async hasPurchaseReturn(idBarcode, saleReturnId) {
    const barcode = await prisma.barcodes.findUnique({
      where: { id_barcode: Number(idBarcode) }
    });

    if (!barcode) return false;

    const pr = await prisma.purchase_returns.findFirst({
      where: {
        prd: {
          some: {
            barcode: barcode.barcode
          }
        }
      }
    });
    return pr !== null;
  }

  static async getPurchaseReturnsForBarcode(barcode) {
    return prisma.purchase_returns.findMany({
      where: {
        prd: {
          some: {
            barcode: barcode
          }
        }
      },
      include: {
        prd: {
          include: {
            products: true,
            return_reasons: true,
            return_methods: true,
            return_statuses: true
          }
        },
        purchases: {
          include: {
            providers: true
          }
        },
        return_statuses: true
      },
      orderBy: {
        creation_date: 'desc'
      }
    });
  }
}
