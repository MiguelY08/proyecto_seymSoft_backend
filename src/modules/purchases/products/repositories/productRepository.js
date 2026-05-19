import { prisma } from "../../../../config/prisma.js";

// ─── Reusable includes ────────────────────────────────────────────────────────

const productInclude = {
  include: {
    categories: { select: { id_category: true, category_name: true } },
    unit_measures: { select: { id_unit_measure: true, name_unit_measure: true } },
    general_statuses: { select: { id_status: true, name_status: true } },
    barcodes: {
      select: { id_barcode: true, barcode: true, barcode_type: true, stock: true },
      orderBy: { id_barcode: "asc" },
    },
  },
};

// ─── Product repository ────────────────────────────────────────────────────────

export class ProductRepository {

  async findAll(filters = {}) {
    const where = {};

    if (filters.active !== undefined) {
      where.id_status = filters.active ? 1 : 2;
    }

    if (filters.categoryId) {
      where.id_category = parseInt(filters.categoryId);
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { reference: { contains: filters.search, mode: "insensitive" } },
        { barcodes: { some: { barcode: { contains: filters.search } } } },
      ];
    }

    return prisma.products.findMany({
      where,
      ...productInclude,
      orderBy: { id_product: "desc" },
    });
  }

  async findById(id) {
    return prisma.products.findUnique({
      where: { id_product: parseInt(id) },
      ...productInclude,
    });
  }

  async findByReference(reference, excludeId = null) {
    return prisma.products.findFirst({
      where: {
        reference: { equals: reference, mode: "insensitive" },
        ...(excludeId ? { NOT: { id_product: excludeId } } : {}),
      },
    });
  }

  async findByBarcode(barcode, excludeProductId = null) {
    return prisma.barcodes.findFirst({
      where: {
        barcode: { equals: barcode, mode: "insensitive" },
        ...(excludeProductId ? { NOT: { id_product: excludeProductId } } : {}),
      },
      include: { products: true },
    });
  }

  async create(data) {
  return prisma.$transaction(async (tx) => {
const product = await tx.products.create({
  data: {
    name: data.name,
    reference: data.reference,
    retail_price: parseFloat(data.retailPrice),
    wholesale_price: parseFloat(data.wholesalePrice),
    partner_price: data.partnerPrice ? parseFloat(data.partnerPrice) : null,
    bulk_price: data.bulkPrice ? parseFloat(data.bulkPrice) : null,
    iva_percentage: parseFloat(data.ivaPercentage) || 0,
    description: data.description || null,
    quantity_per_pack: parseInt(data.quantityPerPack) || 0,
    categories: {
      connect: { id_category: parseInt(data.idCategorie) }
    },
    general_statuses: {
      connect: { id_status: data.idStatus || 1 }
    },
    unit_measures: {
      connect: { id_unit_measure: parseInt(data.idUnitMeasure) }
    }
  },
});

      // Crear barcodes asociados
      if (data.barcodes && data.barcodes.length > 0) {
        await tx.barcodes.createMany({
          data: data.barcodes.map((b) => ({
            barcode: b.barcode,
            barcode_type: b.barcode_type || "EAN13",
            stock: parseInt(b.stock) || 0,
            id_product: product.id_product,
          })),
        });
      }

      // Retornar con includes
      return tx.products.findUnique({
        where: { id_product: product.id_product },
        ...productInclude,
      });
    });
  }

  async update(id, data) {
    return prisma.$transaction(async (tx) => {
      const updateData = {};

      if (data.name !== undefined) updateData.name = data.name;
      if (data.reference !== undefined) updateData.reference = data.reference;
      if (data.retailPrice !== undefined) updateData.retail_price = parseFloat(data.retailPrice);
      if (data.wholesalePrice !== undefined) updateData.wholesale_price = parseFloat(data.wholesalePrice);
      if (data.partnerPrice !== undefined) updateData.partner_price = data.partnerPrice ? parseFloat(data.partnerPrice) : null;
      if (data.bulkPrice !== undefined) updateData.bulk_price = data.bulkPrice ? parseFloat(data.bulkPrice) : null;
      if (data.ivaPercentage !== undefined) updateData.iva_percentage = parseFloat(data.ivaPercentage);
      if (data.idUnitMeasure !== undefined) updateData.id_unit_measure = parseInt(data.idUnitMeasure);
      if (data.idCategory !== undefined) updateData.id_category = parseInt(data.idCategory);
      if (data.idStatus !== undefined) updateData.id_status = data.idStatus;

      // Actualizar producto
      const updated = await tx.products.update({
        where: { id_product: parseInt(id) },
        data: updateData,
      });

      // Si vienen barcodes, reemplazar completamente
      if (data.barcodes !== undefined) {
        await tx.barcodes.deleteMany({ where: { id_product: parseInt(id) } });

        if (data.barcodes.length > 0) {
          await tx.barcodes.createMany({
            data: data.barcodes.map((b) => ({
              barcode: b.barcode,
              barcode_type: b.barcode_type || "EAN13",
              stock: parseInt(b.stock) || 0,
              id_product: parseInt(id),
            })),
          });
        }
      }

      return tx.products.findUnique({
        where: { id_product: parseInt(id) },
        ...productInclude,
      });
    });
  }

  async toggleStatus(id) {
    const product = await this.findById(id);
    if (!product) throw new Error("Producto no encontrado");

    const newStatus = product.id_status === 1 ? 2 : 1;

    return prisma.products.update({
      where: { id_product: parseInt(id) },
      data: { id_status: newStatus },
      ...productInclude,
    });
  }

  async delete(id) {
    return prisma.$transaction(async (tx) => {
      // Eliminar barcodes primero
      await tx.barcodes.deleteMany({ where: { id_product: parseInt(id) } });

      // Luego el producto
      return tx.products.delete({ where: { id_product: parseInt(id) } });
    });
  }

  // ── Stock management ────────────────────────────────────────────────────────

  async updateBarcodeStock(barcodeId, newStock) {
    return prisma.barcodes.update({
      where: { id_barcode: parseInt(barcodeId) },
      data: { stock: Math.max(0, parseInt(newStock)) },
    });
  }

  async getTotalStock(productId) {
    const barcodes = await prisma.barcodes.findMany({
      where: { id_product: parseInt(productId) },
      select: { stock: true },
    });

    return barcodes.reduce((total, b) => total + (b.stock || 0), 0);
  }
}