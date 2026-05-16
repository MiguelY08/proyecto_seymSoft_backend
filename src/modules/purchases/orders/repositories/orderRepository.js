import { prisma } from '../../../../config/prisma.js';

// ─── Reusable includes ────────────────────────────────────────────────────────

const orderInclude = {
  providers:         { select: { name_provider: true } },
  purchase_statuses: { select: { name_puchase_status: true } },
};

const orderWithDetailsInclude = {
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

export class OrderRepository {

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

    const [total, orders] = await Promise.all([
      prisma.purchases.count({ where }),
      prisma.purchases.findMany({
        where,
        skip,
        take:    limit,
        orderBy: { purchase_date: 'desc' },
        include: orderInclude,
      }),
    ]);

    return { orders: orders || [], total: total || 0 };
  }

  async findById(id) {
    return prisma.purchases.findUnique({
      where:   { id_purchase: parseInt(id) },
      include: orderWithDetailsInclude,
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

  async create(orderData, details) {
    return prisma.$transaction(async (tx) => {
      // 1 — Create purchase
      const order = await tx.purchases.create({
        data: orderData,
      });

      // 2 — Create details
      await tx.purchase_details.createMany({
        data: details.map((d) => ({
          id_purchase:      order.id_purchase,
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

      // 3 — Update stock in barcodes
      for (const d of details) {
        await tx.barcodes.update({
          where: { id_barcode: d.idBarcode },
          data:  { stock: { increment: d.quantity } },
        });
      }

      // 4 — Return full order with details
      return tx.purchases.findUnique({
        where:   { id_purchase: order.id_purchase },
        include: orderWithDetailsInclude,
      });
    });
  }

  async annul(id, cancellationReason) {
    return prisma.$transaction(async (tx) => {
      // 1 — Get details to revert stock
      const details = await tx.purchase_details.findMany({
        where: { id_purchase: parseInt(id) },
      });

      // 2 — Update status to 3 (Anulada)
      const order = await tx.purchases.update({
        where:   { id_purchase: parseInt(id) },
        data:    { id_purchase_status: 3 },
        include: orderWithDetailsInclude,
      });

      // 3 — Save cancellation reason in each detail
      await tx.purchase_details.updateMany({
        where: { id_purchase: parseInt(id) },
        data:  { cancellation_reason: cancellationReason },
      });

      // 4 — Revert stock
      for (const d of details) {
        await tx.barcodes.update({
          where: { id_barcode: d.id_barcode },
          data:  { stock: { decrement: d.quantity } },
        });
      }

      return order;
    });
  }
}