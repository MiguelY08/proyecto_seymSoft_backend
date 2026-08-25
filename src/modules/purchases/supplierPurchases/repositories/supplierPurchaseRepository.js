// backend/src/modules/supplier-purchases/repositories/supplierPurchaseRepository.js
import { prisma } from '../../../../config/prisma.js';
import { calculatePurchaseDetailsReturnAvailability } from '../../purchase-returns/helpers/purchaseReturnHelper.js';

const purchaseInclude = {
  providers:         { select: { name_provider: true, max_return_period: true } },
  purchase_statuses: { select: { name_puchase_status: true } },
  purchase_details: {
    select: { quantity: true }
  },
};

const purchaseWithDetailsInclude = {
  providers:         { select: { name_provider: true, max_return_period: true } },
  purchase_statuses: { select: { name_puchase_status: true } },
  purchase_details: {
    include: {
      barcodes: {
        include: {
          products: {
            select: {
              id_product: true,
              name:        true,
              barcodes: { select: { id_barcode: true, barcode: true } },
            },
          },
        },
      },
    },
  },
};

export const buildPurchaseStockReverts = (details = []) => {
  const grouped = new Map();

  for (const detail of details) {
    const idBarcode = Number(detail.id_barcode);
    const quantity = Number(detail.stock_added ?? detail.quantity);

    if (!Number.isInteger(idBarcode) || idBarcode <= 0 || !Number.isFinite(quantity) || quantity <= 0) continue;
    grouped.set(idBarcode, (grouped.get(idBarcode) || 0) + quantity);
  }

  return [...grouped.entries()].map(([idBarcode, quantity]) => ({ idBarcode, quantity }));
};

export const decrementPurchaseStockAtomically = async (tx, stockReverts, idPurchase) => {
  for (const { idBarcode, quantity } of stockReverts) {
    const current = await tx.barcodes.findUnique({
      where: { id_barcode: idBarcode },
      select: { stock: true, barcode: true },
    });
    const result = await tx.barcodes.updateMany({
      where: { id_barcode: idBarcode, stock: { gte: quantity } },
      data: { stock: { decrement: quantity } },
    });

    if (result.count !== 1) {
      const error = new Error(
        `No se puede anular la compra: stock insuficiente para el codigo ${current?.barcode || idBarcode}. ` +
        `Disponible: ${current?.stock ?? 0}, requerido: ${quantity}.`
      );
      error.statusCode = 409;
      throw error;
    }

    const updated = await tx.barcodes.findUnique({
      where: { id_barcode: idBarcode },
      select: { stock: true },
    });

    await tx.inventory_stock_movements.create({
      data: {
        id_barcode: idBarcode,
        quantity_delta: -quantity,
        stock_before: updated.stock + quantity,
        stock_after: updated.stock,
        movement_type: 'PURCHASE_ANNULMENT',
        reference_type: 'PURCHASE',
        reference_id: Number(idPurchase),
      },
    });
  }
};

export class SupplierPurchaseRepository {

  async findAll({ page, limit, search, startDate, endDate, sortField = 'id_purchase', sortOrder = 'desc' }) {
    const skip  = (page - 1) * limit;
    const where = {};

    if (search) {
      where.OR = [
        { invoice_number: { contains: search, mode: 'insensitive' } },
        { providers: { name_provider: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (startDate || endDate) {
      where.purchase_date = {};
      if (startDate) where.purchase_date.gte = startDate;
      if (endDate)   where.purchase_date.lte = endDate;
    }

    const orderBy = {};
    const fieldMapping = {
      'id_purchase': 'id_purchase',
      'purchase_date': 'purchase_date',
      'invoice_number': 'invoice_number',
      'total_amount': 'total_amount',
      'id_provider': 'id_provider',
      'id_purchase_status': 'id_purchase_status',
    };
    
    const dbField = fieldMapping[sortField] || 'id_purchase';
    orderBy[dbField] = sortOrder === 'asc' ? 'asc' : 'desc';

    const [total, purchases] = await Promise.all([
      prisma.purchases.count({ where }),
      prisma.purchases.findMany({
        where,
        skip,
        take:    limit,
        orderBy,
        include: purchaseInclude,
      }),
    ]);

    const purchasesWithCount = purchases.map(purchase => ({
      ...purchase,
      total_quantity: purchase.purchase_details?.reduce((sum, d) => sum + (d.quantity || 0), 0) || 0
    }));

    return { purchases: purchasesWithCount || [], total: total || 0 };
  }

  async findById(id) {
    const purchase = await prisma.purchases.findUnique({
      where:   { id_purchase: parseInt(id) },
      include: purchaseWithDetailsInclude,
    });

    if (!purchase) return null;

    const purchaseDetailIds = purchase.purchase_details.map((detail) => detail.id_purchase_detail);

    const returnDetails = purchaseDetailIds.length > 0
      ? await prisma.prd.findMany({
          where: { id_purchase_detail: { in: purchaseDetailIds } },
          select: { id_purchase_detail: true, quantity: true, id_return_method: true, id_return_status: true },
        })
      : [];

    const availabilityByDetail = calculatePurchaseDetailsReturnAvailability({
      purchaseDetails: purchase.purchase_details,
      returnDetails,
    });

    return {
      ...purchase,
      purchase_details: purchase.purchase_details.map((detail) => ({
        ...detail,
        returnAvailability: availabilityByDetail.get(detail.id_purchase_detail) ?? {
          purchasedQuantity: detail.quantity,
          reservedQuantity: 0,
          finalReturnedQuantity: 0,
          availableQuantity: detail.quantity,
        },
      })),
    };
  }

  async findByInvoiceNumber(invoiceNumber, excludeId = null) {
    const where = { invoice_number: { equals: invoiceNumber, mode: 'insensitive' } };
    if (excludeId) where.id_purchase = { not: parseInt(excludeId) };
    return prisma.purchases.findFirst({ where });
  }

  async findProviderById(id) {
    return prisma.providers.findUnique({
      where:  { id_provider: parseInt(id) },
      select: { id_provider: true, name_provider: true, max_return_period: true },
    });
  }

  async findProductById(id) {
    return prisma.products.findUnique({
      where:  { id_product: parseInt(id) },
      select: {
        id_product:      true,
        name:            true,
        wholesale_price: true,
        precio_proveedor: true,
        iva_percentage:  true,
        quantity_per_pack: true, // ← NECESARIO PARA CALCULAR STOCK
        barcodes: {
          select:  { id_barcode: true, barcode: true },
          orderBy: { id_barcode: 'asc' },
        },
      },
    });
  }

  async findBarcodeByCode(barcode) {
    return prisma.barcodes.findUnique({
      where:  { barcode },
      select: { id_barcode: true, barcode: true, id_product: true },
    });
  }

  async createExtraBarcodes(details) {
    for (const detail of details) {
      for (const extraCode of detail.extraBarcodes) {
        const existing = await prisma.barcodes.findUnique({ where: { barcode: extraCode } });
        if (!existing) {
          await prisma.barcodes.create({
            data: {
              barcode:      extraCode,
              barcode_type: 'extra',
              stock:        0,
              id_product:   detail.idProduct,
            },
          });
        }
      }
    }
  }

  async create(purchaseData, details) {
    await this.createExtraBarcodes(details);

    const detailsWithExtraIds = await Promise.all(
      details.map(async (detail) => {
        const extraIds = [];
        for (const extraCode of detail.extraBarcodes) {
          const b = await prisma.barcodes.findUnique({
            where:  { barcode: extraCode },
            select: { id_barcode: true },
          });
          if (b) extraIds.push(b.id_barcode);
        }
        return { ...detail, extraBarcodeIds: extraIds };
      })
    );

    return prisma.$transaction(async (tx) => {
      const purchase = await tx.purchases.create({ data: purchaseData });

      await tx.purchase_details.createMany({
        data: detailsWithExtraIds.map((d) => ({
          id_purchase:      purchase.id_purchase,
          id_barcode:       d.primaryBarcodeId,
          quantity:         d.quantity,
          // ========== NUEVOS CAMPOS ==========
          purchase_type:    d.purchaseType || "Unidad",
          quantity_per_pack: d.quantityPerPack || 0,
          stock_added:      d.stockAdded || d.quantity,
          // ========== FIN NUEVOS CAMPOS ==========
          gross_unit_price: d.grossUnitPrice,
          tax_unit_price:   d.taxUnitPrice,
          net_unit_price:   d.netUnitPrice,
          gross_subtotal:   d.grossSubtotal,
          iva_subtotal:     d.ivaSubtotal,
          net_subtotal:     d.netSubtotal,
          tax_percentage:   d.taxPercentage,
          batch_code:       d.batchCode,
        })),
      });

      // ========== USAR stockAdded PARA EL INCREMENTO ==========
      const allBarcodeIds = detailsWithExtraIds.flatMap((d) => [
        { id: d.primaryBarcodeId, qty: d.stockAdded || d.quantity },
        ...d.extraBarcodeIds.map((eid) => ({ id: eid, qty: d.stockAdded || d.quantity })),
      ]);

      await Promise.all(
        allBarcodeIds.map(({ id, qty }) =>
          tx.barcodes.update({
            where: { id_barcode: id },
            data:  { stock: { increment: qty } },
          })
        )
      );

      return tx.purchases.findUnique({
        where:   { id_purchase: purchase.id_purchase },
        include: purchaseWithDetailsInclude,
      });
    }, { timeout: 30000 });
  }

  async annul(id, cancellationReason) {
    return prisma.$transaction(async (tx) => {
      const purchaseId = parseInt(id);
      const details = await tx.purchase_details.findMany({
        where: { id_purchase: purchaseId },
        select: {
          id_barcode: true,
          quantity: true,
          stock_added: true,
        },
      });

      const relatedReturn = await tx.purchases_returns.findFirst({
        where: { id_purchase: purchaseId, id_return_status: { not: 5 } },
        select: { id_purchase_return: true },
      });

      if (relatedReturn) {
        const error = new Error(
          `Esta compra tiene la devolucion #${relatedReturn.id_purchase_return} sin anular y no puede anularse.`
        );
        error.statusCode = 409;
        throw error;
      }

      const stockReverts = buildPurchaseStockReverts(details);
      await decrementPurchaseStockAtomically(tx, stockReverts, purchaseId);

      const purchase = await tx.purchases.update({
        where:   { id_purchase: purchaseId },
        data:    { id_purchase_status: 3 },
        include: purchaseWithDetailsInclude,
      });

      await tx.purchase_details.updateMany({
        where: { id_purchase: purchaseId },
        data:  { cancellation_reason: cancellationReason },
      });

      return purchase;
    }, { timeout: 30000 });
  }
}
