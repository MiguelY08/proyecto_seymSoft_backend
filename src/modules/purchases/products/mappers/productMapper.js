// ─── Product mapper ───────────────────────────────────────────────────────────

/**
 * Maps un producto de Prisma al formato que espera el frontend.
 * Ahora el stock está distribuido en los barcodes.
 */
export const mapProduct = (product) => {
  const totalStock = (product.barcodes || []).reduce((sum, b) => sum + (b.stock || 0), 0);

  return {
    id: product.id_product,
    name: product.name,
    reference: product.reference,
    retailPrice: product.retail_price,
    wholesalePrice: product.wholesale_price,
    partnerPrice: product.partner_price,
    bulkPrice: product.bulk_price,
    supplierPrice: product.precio_proveedor,
    retailDiscountPct: product.retail_discount_pct,
    wholesaleDiscountPct: product.wholesale_discount_pct,
    partnerDiscountPct: product.partner_discount_pct,
    bulkDiscountPct: product.bulk_discount_pct,
    ivaPercentage: product.iva_percentage,
    description: product.description,
    quantityPerPack: product.quantity_per_pack,
    totalStock,
    //category: product.categories ? {
      //id: product.categories.id_category,
      //name: product.categories.category_name,
    //} : null,
    unitMeasure: product.unit_measures ? {
      id: product.unit_measures.id_unit_measure,
      name: product.unit_measures.name_unit_measure,
      abbreviation: product.unit_measures.abbreviation,
    } : null,
    status: product.general_statuses?.name_status === 'Activo' ? 'Activo' : 'Inactivo',
    barcodes: (product.barcodes || []).map((b) => ({
      id: b.id_barcode,
      barcode: b.barcode,
      barcodeType: b.barcode_type,
      stock: b.stock,
    })),
    images: (product.product_images || []).map((img) => ({
      id: img.id_image,
      url: img.image_url,
      isPrimary: img.is_primary,
    })),
    // ← AGREGAR ESTO
    categories: (product.product_categories || []).map((pc) => ({
      id: pc.id_category,
      name: pc.categories?.category_name,
    })),
    subcategories: (product.product_subcategories || []).map((ps) => ({
      id: ps.id_subcategory,
      name: ps.subcategories?.name_subcategory,
    })),
  };
};

/**
 * Maps múltiples productos
 */
export const mapProducts = (products) => products.map(mapProduct);
