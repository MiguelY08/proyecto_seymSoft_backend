import { prisma } from "../../../../config/prisma.js";

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
    unit_measures: { select: { id_unit_measure: true, name_unit_measure: true, abbreviation: true } },
    general_statuses: { select: { id_status: true, name_status: true } },
    barcodes: {
      select: { id_barcode: true, barcode: true, barcode_type: true, stock: true },
      orderBy: { id_barcode: "asc" },
    },
    product_images: {
      select: { id_image: true, image_url: true, is_primary: true },
      orderBy: { is_primary: "desc" },
    },
    product_categories: {
      select: {
        id_product_category: true,
        id_category: true,
        categories: { select: { id_category: true, category_name: true } },
      },
    },
    product_subcategories: {
      select: {
        id_product_subcategory: true,
        id_subcategory: true,
        subcategories: { select: { id_subcategory: true, name_subcategory: true } },
      },
    },
  },
};

const parseNumberOrNull = (value) => {
  if (value === null || value === "") return null;
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const parseNumber = (value) => {
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const parseIntOrZero = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
};

export class ProductRepository {
  async findAll(filters = {}) {
    const where = {};

    if (filters.active !== undefined) {
      const isActive = filters.active === true || filters.active === "true" || filters.active === "1";
      where.id_status = isActive ? 1 : 2;
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

  async findUnitMeasureById(id) {
    return prisma.unit_measures.findUnique({
      where: { id_unit_measure: parseInt(id) },
      select: { id_unit_measure: true },
    });
  }

  async findAllUnitMeasures() {
    return prisma.unit_measures.findMany({
      select: {
        id_unit_measure: true,
        name_unit_measure: true,
        abbreviation: true,
      },
      orderBy: { id_unit_measure: "asc" },
    });
  }

  async findCategoryById(id) {
    return prisma.categories.findUnique({
      where: { id_category: parseInt(id) },
      select: { id_category: true },
    });
  }

  async findStatusById(id) {
    return prisma.general_statuses.findUnique({
      where: { id_status: parseInt(id) },
      select: { id_status: true },
    });
  }

  async create(data) {
    return prisma.$transaction(async (tx) => {
      const product = await tx.products.create({
        data: {
          name: data.name,
          reference: data.reference,
          retail_price: parseNumber(data.retailPrice),
          wholesale_price: parseNumber(data.wholesalePrice),
          partner_price: parseNumberOrNull(data.partnerPrice),
          bulk_price: parseNumberOrNull(data.bulkPrice),
          iva_percentage: parseNumber(data.ivaPercentage),
          retail_discount_pct: parseNumber(data.retailDiscountPct),
          wholesale_discount_pct: parseNumber(data.wholesaleDiscountPct),
          partner_discount_pct: parseNumber(data.partnerDiscountPct),
          bulk_discount_pct: parseNumber(data.bulkDiscountPct),
          description: data.description || null,
          quantity_per_pack: parseIntOrZero(data.quantityPerPack),
          categories: {
            connect: { id_category: parseInt(data.idCategorie) },
          },
          general_statuses: {
            connect: { id_status: data.idStatus || 1 },
          },
          unit_measures: {
            connect: { id_unit_measure: parseInt(data.idUnitMeasure) },
          },
        },
      });

      if (data.barcodes && data.barcodes.length > 0) {
        await tx.barcodes.createMany({
          data: data.barcodes.map((b) => ({
            barcode: String(b.barcode),
            barcode_type: b.barcode_type || "EAN13",
            stock: parseIntOrZero(b.stock),
            id_product: product.id_product,
          })),
        });
      }

      if (data.categories && data.categories.length > 0) {
        await tx.product_categories.createMany({
          data: data.categories.map((catId) => ({
            id_product: product.id_product,
            id_category: parseInt(catId),
          })),
        });
      }

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
      const productId = parseInt(id);
      const updateData = {};

      if (data.name !== undefined) updateData.name = data.name;
      if (data.reference !== undefined) updateData.reference = data.reference;
      if (data.retailPrice !== undefined) updateData.retail_price = parseNumber(data.retailPrice);
      if (data.wholesalePrice !== undefined) updateData.wholesale_price = parseNumber(data.wholesalePrice);
      if (data.partnerPrice !== undefined) updateData.partner_price = parseNumberOrNull(data.partnerPrice);
      if (data.bulkPrice !== undefined) updateData.bulk_price = parseNumberOrNull(data.bulkPrice);
      if (data.retailDiscountPct !== undefined) updateData.retail_discount_pct = parseNumber(data.retailDiscountPct);
      if (data.wholesaleDiscountPct !== undefined) updateData.wholesale_discount_pct = parseNumber(data.wholesaleDiscountPct);
      if (data.partnerDiscountPct !== undefined) updateData.partner_discount_pct = parseNumber(data.partnerDiscountPct);
      if (data.bulkDiscountPct !== undefined) updateData.bulk_discount_pct = parseNumber(data.bulkDiscountPct);
      if (data.ivaPercentage !== undefined) updateData.iva_percentage = parseNumber(data.ivaPercentage);
      if (data.idUnitMeasure !== undefined) updateData.id_unit_measure = parseInt(data.idUnitMeasure);
      if (data.idCategorie !== undefined) updateData.id_category = parseInt(data.idCategorie);
      if (data.idStatus !== undefined) updateData.id_status = parseInt(data.idStatus);
      if (data.description !== undefined) updateData.description = data.description || null;
      if (data.quantityPerPack !== undefined) updateData.quantity_per_pack = parseIntOrZero(data.quantityPerPack);

      await tx.products.update({
        where: { id_product: productId },
        data: updateData,
      });

      if (data.categories !== undefined) {
        await tx.product_categories.deleteMany({ where: { id_product: productId } });
        if (data.categories.length > 0) {
          await tx.product_categories.createMany({
            data: data.categories.map((catId) => ({
              id_product: productId,
              id_category: parseInt(catId),
            })),
          });
        }
      }

      if (data.subcategories !== undefined) {
        await tx.product_subcategories.deleteMany({ where: { id_product: productId } });
        if (data.subcategories.length > 0) {
          await tx.product_subcategories.createMany({
            data: data.subcategories.map((subId) => ({
              id_product: productId,
              id_subcategory: parseInt(subId),
            })),
          });
        }
      }

      if (data.barcodes !== undefined && data.barcodes.length > 0) {
        const currentBarcodes = await tx.barcodes.findMany({
          where: { id_product: productId },
        });
        const incomingCodes = data.barcodes.map((b) => String(b.barcode));
        const codesToDelete = currentBarcodes
          .filter((b) => !incomingCodes.includes(b.barcode))
          .map((b) => b.id_barcode);

        if (codesToDelete.length > 0) {
          await tx.barcodes.deleteMany({
            where: { id_barcode: { in: codesToDelete } },
          });
        }

        const currentByCode = new Map(currentBarcodes.map((b) => [b.barcode, b]));

        for (const barcode of data.barcodes) {
          const code = String(barcode.barcode);
          const existing = currentByCode.get(code);
          const barcodeData = {
            barcode_type: barcode.barcode_type || "EAN13",
            stock: Math.max(0, parseIntOrZero(barcode.stock)),
          };

          if (existing) {
            await tx.barcodes.update({
              where: { id_barcode: existing.id_barcode },
              data: barcodeData,
            });
          } else {
            await tx.barcodes.create({
              data: {
                barcode: code,
                ...barcodeData,
                id_product: productId,
              },
            });
          }
        }
      } else if (data.stock !== undefined) {
        const firstBarcode = await tx.barcodes.findFirst({
          where: { id_product: productId },
          orderBy: { id_barcode: "asc" },
        });

        if (firstBarcode) {
          await tx.barcodes.update({
            where: { id_barcode: firstBarcode.id_barcode },
            data: { stock: Math.max(0, parseIntOrZero(data.stock)) },
          });
        }
      }

      return tx.products.findUnique({
        where: { id_product: productId },
        ...productInclude,
      });
    });
  }

  async toggleStatus(id) {
    const product = await this.findById(id);
    if (!product) throw new Error("Producto no encontrado");

    const newStatus = product.general_statuses.id_status === 1 ? 2 : 1;

    return prisma.products.update({
      where: { id_product: parseInt(id) },
      data: { id_status: newStatus },
      ...productInclude,
    });
  }

  async delete(id) {
    return prisma.$transaction(async (tx) => {
      await tx.barcodes.deleteMany({ where: { id_product: parseInt(id) } });
      return tx.products.delete({ where: { id_product: parseInt(id) } });
    });
  }

  async updateBarcodeStock(barcodeId, newStock) {
    return prisma.barcodes.update({
      where: { id_barcode: parseInt(barcodeId) },
      data: { stock: Math.max(0, parseIntOrZero(newStock)) },
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
        is_primary: idx === 0,
      })),
    });
  }
}
