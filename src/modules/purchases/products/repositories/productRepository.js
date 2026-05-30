import { prisma } from "../../../../config/prisma.js";

// ─── Reusable includes ────────────────────────────────────────────────────────

const productSelect = {
  id_product: true,
  name: true,
  reference: true,
  retail_price: true,
  wholesale_price: true,
  partner_price: true,
  bulk_price: true,
  iva_percentage: true,
  description: true,
  quantity_per_pack: true,
  retail_discount_pct: true,
  wholesale_discount_pct: true,
  partner_discount_pct: true,
  bulk_discount_pct: true,
};

const productInclude = {
  select: {
    ...productSelect,
    categories: { select: { id_category: true, category_name: true } },
    unit_measures: { select: { id_unit_measure: true, name_unit_measure: true } },
    general_statuses: { select: { id_status: true, name_status: true } },
    barcodes: {
      select: { id_barcode: true, barcode: true, barcode_type: true, stock: true },
      orderBy: { id_barcode: "asc" },
    },
    product_images: {
      select: { id_image: true, image_url: true, is_primary: true },
      orderBy: { is_primary: 'desc' },
    },
    // ← AGREGAR ESTO
    product_categories: {
      select: {
        id_product_category: true,
        id_category: true,
        categories: { select: { id_category: true, category_name: true } }
      },
    },
    product_subcategories: {
      select: {
        id_product_subcategory: true,
        id_subcategory: true,
        subcategories: { select: { id_subcategory: true, name_subcategory: true } }
      },
    },
  },
};// ─── Product repository ────────────────────────────────────────────────────────

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
        retail_discount_pct: parseFloat(data.retailDiscountPct) || 0,
        wholesale_discount_pct: parseFloat(data.wholesaleDiscountPct) || 0,
        partner_discount_pct: parseFloat(data.partnerDiscountPct) || 0,
        bulk_discount_pct: parseFloat(data.bulkDiscountPct) || 0,
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

    // ← AGREGAR ESTO: Crear relaciones con categorías adicionales
    if (data.categories && data.categories.length > 0) {
      await tx.product_categories.createMany({
        data: data.categories.map((catId) => ({
          id_product: product.id_product,
          id_category: parseInt(catId),
        })),
      });
    }

    // ← AGREGAR ESTO: Crear relaciones con subcategorías
    if (data.subcategories && data.subcategories.length > 0) {
      await tx.product_subcategories.createMany({
        data: data.subcategories.map((subId) => ({
          id_product: product.id_product,
          id_subcategory: parseInt(subId),
        })),
      });
    }

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
    if (data.retailDiscountPct !== undefined)
    updateData.retail_discount_pct = parseFloat(data.retailDiscountPct);
    if (data.wholesaleDiscountPct !== undefined)
      updateData.wholesale_discount_pct = parseFloat(data.wholesaleDiscountPct);
    if (data.partnerDiscountPct !== undefined)
      updateData.partner_discount_pct = parseFloat(data.partnerDiscountPct);
    if (data.bulkDiscountPct !== undefined)
  updateData.bulk_discount_pct = parseFloat(data.bulkDiscountPct);
    if (data.ivaPercentage !== undefined) updateData.iva_percentage = parseFloat(data.ivaPercentage);
    if (data.idUnitMeasure !== undefined) updateData.id_unit_measure = parseInt(data.idUnitMeasure);
    if (data.idCategorie !== undefined) updateData.id_category = parseInt(data.idCategorie);  // ← Cambiar idCategory a idCategorie
    if (data.idStatus !== undefined) updateData.id_status = data.idStatus;
    if (data.description !== undefined) updateData.description = data.description;  // ← AGREGAR ESTO
    if (data.quantityPerPack !== undefined) updateData.quantity_per_pack = parseInt(data.quantityPerPack);  // ← AGREGAR ESTO

    // Actualizar producto
    const updated = await tx.products.update({
      where: { id_product: parseInt(id) },
      data: updateData,
    });

    // ← AGREGAR ESTO: Actualizar categorías
    if (data.categories !== undefined) {
      await tx.product_categories.deleteMany({ where: { id_product: parseInt(id) } });
      if (data.categories.length > 0) {
        await tx.product_categories.createMany({
          data: data.categories.map((catId) => ({
            id_product: parseInt(id),
            id_category: parseInt(catId),
          })),
        });
      }
    }

    // ← AGREGAR ESTO: Actualizar subcategorías
    if (data.subcategories !== undefined) {
      await tx.product_subcategories.deleteMany({ where: { id_product: parseInt(id) } });
      if (data.subcategories.length > 0) {
        await tx.product_subcategories.createMany({
          data: data.subcategories.map((subId) => ({
            id_product: parseInt(id),
            id_subcategory: parseInt(subId),
          })),
        });
      }
    }

// Si vienen barcodes, actualizar en lugar de eliminar
if (data.barcodes !== undefined && data.barcodes.length > 0) {
  // Obtener barcodes actuales
  const currentBarcodes = await tx.barcodes.findMany({
    where: { id_product: parseInt(id) }
  });

  // Eliminar solo los que no están en la nueva lista
  const newBarcodeCodes = data.barcodes.map(b => b.barcode);
  const codesToDelete = currentBarcodes
    .filter(b => !newBarcodeCodes.includes(b.barcode))
    .map(b => b.id_barcode);

  if (codesToDelete.length > 0) {
    await tx.barcodes.deleteMany({
      where: { id_barcode: { in: codesToDelete } }
    });
  }

  // Crear solo los nuevos
  const existingCodes = currentBarcodes.map(b => b.barcode);
  const newBarcodes = data.barcodes.filter(b => !existingCodes.includes(b.barcode));

  if (newBarcodes.length > 0) {
    await tx.barcodes.createMany({
      data: newBarcodes.map((b) => ({
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

  // Cambiar: product.id_status → product.general_statuses.id_status
  const newStatus = product.general_statuses.id_status === 1 ? 2 : 1;

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

  async createProductImages(productId, imageUrls) {
  return prisma.product_images.createMany({
    data: imageUrls.map((url, idx) => ({
      id_product: productId,
      image_url: url,
      is_primary: idx === 0,  // Primera imagen es principal
    })),
  });
}
}

