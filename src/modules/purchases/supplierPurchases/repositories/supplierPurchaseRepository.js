// backend/src/modules/supplier-purchases/repositories/supplierPurchaseRepository.js
import { prisma } from '../../../../config/prisma.js';
import { calculatePurchaseDetailsReturnAvailability } from '../../purchase-returns/helpers/purchaseReturnHelper.js';

// ─── Reusable includes ────────────────────────────────────────────────────────

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

export class SupplierPurchaseRepository {

  // ── Lookups ───────────────────────────────────────────────────────────────

  async findAll({ page, limit, search, startDate, endDate }) {
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

    const [total, purchases] = await Promise.all([
      prisma.purchases.count({ where }),
      prisma.purchases.findMany({
        where,
        skip,
        take:    limit,
        orderBy: { purchase_date: 'desc' },
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

    if (!purchase) {
      return null;
    }

    const purchaseDetailIds =
      purchase.purchase_details.map((detail) =>
        detail.id_purchase_detail
      );

    const returnDetails =
      purchaseDetailIds.length > 0
        ? await prisma.prd.findMany({
            where: {
              id_purchase_detail: {
                in: purchaseDetailIds,
              },
            },
            select: {
              id_purchase_detail: true,
              quantity: true,
              id_return_method: true,
              id_return_status: true,
            },
          })
        : [];

    const availabilityByDetail =
      calculatePurchaseDetailsReturnAvailability({
        purchaseDetails: purchase.purchase_details,
        returnDetails,
      });

    return {
      ...purchase,
      purchase_details: purchase.purchase_details.map((detail) => ({
        ...detail,
        returnAvailability:
          availabilityByDetail.get(detail.id_purchase_detail) ?? {
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
      select: { 
        id_provider: true, 
        name_provider: true,
        max_return_period: true,
      },
    });
  }


async findProductById(id) {
  return prisma.products.findUnique({
    where:  { id_product: parseInt(id) },
    select: {
      id_product:      true,
      name:            true,
      wholesale_price: true,
      precio_proveedor: true, // ← AGREGAR: precio de compra al proveedor
      iva_percentage:  true,
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

  // ── Create ────────────────────────────────────────────────────────────────

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

      const allBarcodeIds = detailsWithExtraIds.flatMap((d) => [
        { id: d.primaryBarcodeId, qty: d.quantity },
        ...d.extraBarcodeIds.map((eid) => ({ id: eid, qty: d.quantity })),
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

  // ── Annul ─────────────────────────────────────────────────────────────────

  async annul(id, cancellationReason) {
    return prisma.$transaction(async (tx) => {

      const details = await tx.purchase_details.findMany({
        where:   { id_purchase: parseInt(id) },
        include: {
          barcodes: {
            include: {
              products: {
                select: { barcodes: { select: { id_barcode: true } } },
              },
            },
          },
        },
      });

      const purchase = await tx.purchases.update({
        where:   { id_purchase: parseInt(id) },
        data:    { id_purchase_status: 3 },
        include: purchaseWithDetailsInclude,
      });

      await tx.purchase_details.updateMany({
        where: { id_purchase: parseInt(id) },
        data:  { cancellation_reason: cancellationReason },
      });

      const stockReverts = details.flatMap((d) => {
        const ids = d.barcodes?.products?.barcodes?.map((b) => b.id_barcode) ?? [];
        return ids.map((barcodeId) => ({ id: barcodeId, qty: d.quantity }));
      });

      await Promise.all(
        stockReverts.map(({ id, qty }) =>
          tx.barcodes.update({
            where: { id_barcode: id },
            data:  { stock: { decrement: qty } },
          })
        )
      );

      return purchase;

    }, { timeout: 30000 });
  }
}
