import { prisma } from '../../../../config/prisma.js';

// ─── Reusable includes ────────────────────────────────────────────────────────

const supplierPurchaseInclude = {
  providers:         { select: { name_provider: true } },
  purchase_statuses: { select: { name_puchase_status: true } },
};

const supplierPurchaseWithDetailsInclude = {
  providers:         { select: { name_provider: true } },
  purchase_statuses: { select: { name_puchase_status: true } },
  purchase_details: {
    include: {
      barcodes: {
        include: {
          products: { select: { name: true } },
        },
      },
    },
  },
};

export class SupplierPurchaseRepository {

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

    const [total, supplierPurchases] = await Promise.all([
      prisma.purchases.count({ where }),
      prisma.purchases.findMany({
        where,
        skip,
        take:    limit,
        orderBy: { purchase_date: 'desc' },
        include: supplierPurchaseInclude,
      }),
    ]);

    return { supplierPurchases: supplierPurchases || [], total: total || 0 };
  }

  async findById(id) {
    return prisma.purchases.findUnique({
      where:   { id_purchase: parseInt(id) },
      include: supplierPurchaseWithDetailsInclude,
    });
  }

  async findByInvoiceNumber(invoiceNumber, excludeId = null) {
    const where = { invoice_number: { equals: invoiceNumber, mode: 'insensitive' } };
    if (excludeId) where.id_purchase = { not: parseInt(excludeId) };
    return prisma.purchases.findFirst({ where });
  }

  async findProviderById(id) {
    return prisma.providers.findUnique({
      where:  { id_provider: parseInt(id) },
      select: { id_provider: true, name_provider: true },
    });
  }

  async findBarcodeById(id) {
    return prisma.barcodes.findUnique({
      where:  { id_barcode: parseInt(id) },
      select: { id_barcode: true, barcode: true, id_product: true },
    });
  }

  async create(purchaseData, details) {
    return prisma.$transaction(async (tx) => {
      const purchase = await tx.purchases.create({
        data: purchaseData,
      });

      await tx.purchase_details.createMany({
        data: details.map((d) => ({
          id_purchase:      purchase.id_purchase,
          id_barcode:       d.idBarcode,
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

      for (const d of details) {
        await tx.barcodes.update({
          where: { id_barcode: d.idBarcode },
          data:  { stock: { increment: d.quantity } },
        });
      }

      return tx.purchases.findUnique({
        where:   { id_purchase: purchase.id_purchase },
        include: supplierPurchaseWithDetailsInclude,
      });
    });
  }

  async annul(id, cancellationReason) {
    return prisma.$transaction(async (tx) => {
      const details = await tx.purchase_details.findMany({
        where: { id_purchase: parseInt(id) },
      });

      const purchase = await tx.purchases.update({
        where:   { id_purchase: parseInt(id) },
        data:    { id_purchase_status: 3 },
        include: supplierPurchaseWithDetailsInclude,
      });

      await tx.purchase_details.updateMany({
        where: { id_purchase: parseInt(id) },
        data:  { cancellation_reason: cancellationReason },
      });

      for (const d of details) {
        await tx.barcodes.update({
          where: { id_barcode: d.id_barcode },
          data:  { stock: { decrement: d.quantity } },
        });
      }

      return purchase;
    });
  }
}
