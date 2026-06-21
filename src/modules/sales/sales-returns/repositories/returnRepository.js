// src/modules/sales/sales-returns/repositories/returnRepository.js

import { prisma } from '../../../../config/prisma.js';
import { ReturnMapper } from '../mappers/returnMapper.js';
import { processAndSaveImage, deleteImage } from '../../../../shared/utils/imageProcessor.js';

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
                    retail_price: true
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

  static async findAll(filters = {}) {
    const { page = 1, limit = 13, search = '', startDate = '', endDate = '' } = filters;
    const skip = (page - 1) * limit;

    const where = {};

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
                      retail_price: true
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
        sale_date: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      },
      include: {
        sales_orders: {
          include: {
            order_details: {
              include: {
                products: {
                  include: {
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
        }
      },
      orderBy: { sale_date: 'desc' }
    });

    return sales.map(sale => {
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

      for (const detail of data.details) {
        await tx.sale_return_details.create({
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
    cancellationReason,
    detailsToRestore = [],
  }) {
    return prisma.$transaction(async (tx) => {
      for (const detail of detailsToRestore) {
        if (detail.id_barcode) {
          await tx.barcodes.update({
            where: {
              id_barcode: detail.id_barcode,
            },
            data: {
              stock: {
                increment: detail.quantity,
              },
            },
          });
        }
      }

      const updatedReturn = await tx.sales_returns.update({
        where: {
          id_sales_return: Number(idReturn),
        },
        data: {
          id_return_status: idReturnStatus,
          cancellation_reason: cancellationReason,
          cancelled_at: new Date(),
        },
      });

      if (detailsToRestore.length > 0) {
        const detailIds = detailsToRestore.map(d => d.id_sale_return_detail);
        
        await tx.sale_return_details.updateMany({
          where: {
            id_sale_return_detail: { in: detailIds },
          },
          data: {
            id_return_status: idReturnStatus,
          },
        });
      }

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

  static async getPurchaseReturnInfo(idBarcode) {
    const purchaseDetail = await prisma.purchase_details.findFirst({
      where: {
        id_barcode: Number(idBarcode)
      },
      include: {
        purchases: {
          include: {
            providers: {
              select: {
                id_provider: true,
                name_provider: true,
                max_return_period: true
              }
            }
          }
        }
      },
      orderBy: {
        purchases: {
          purchase_date: 'desc'
        }
      }
    });

    if (!purchaseDetail) {
      return {
        canReturn: false,
        reason: 'No se encontró compra para este producto',
        provider: null,
        purchaseDate: null,
        maxReturnDays: 0,
        daysSincePurchase: 0,
        idPurchase: null,
        idPurchaseDetail: null
      };
    }

    const provider = purchaseDetail.purchases?.providers;
    const maxReturnDays = provider?.max_return_period || 30;
    const purchaseDate = purchaseDetail.purchases?.purchase_date;
    
    if (!purchaseDate) {
      return {
        canReturn: false,
        reason: 'Fecha de compra no disponible',
        provider,
        purchaseDate: null,
        maxReturnDays,
        daysSincePurchase: 0,
        idPurchase: purchaseDetail.id_purchase,
        idPurchaseDetail: purchaseDetail.id_purchase_detail
      };
    }

    const daysSincePurchase = Math.floor(
      (Date.now() - new Date(purchaseDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    const canReturn = daysSincePurchase <= maxReturnDays;

    return {
      canReturn,
      reason: canReturn 
        ? `Dentro del plazo (${daysSincePurchase}/${maxReturnDays} días)`
        : `Fuera del plazo (${daysSincePurchase}/${maxReturnDays} días)`,
      provider,
      purchaseDate,
      maxReturnDays,
      daysSincePurchase,
      idPurchase: purchaseDetail.id_purchase,
      idPurchaseDetail: purchaseDetail.id_purchase_detail,
      unitPrice: purchaseDetail.net_unit_price,
      quantity: purchaseDetail.quantity
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