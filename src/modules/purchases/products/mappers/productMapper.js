// ─── Product mapper ───────────────────────────────────────────────────────────

/**
 * Maps un producto de Prisma al formato que espera el frontend.
 * Ahora el stock está distribuido en los barcodes.
 */
export const mapProduct = (product) => {
  // Calcular stock total desde barcodes
  const totalStock = product.barcodes
    ? product.barcodes.reduce((sum, b) => sum + (b.stock || 0), 0)
    : 0;

  return {
    id: product.id_product,
    name: product.name,
    reference: product.reference,
    retailPrice: parseFloat(product.retail_price),
    wholesalePrice: parseFloat(product.wholesale_price),
    partnerPrice: product.partner_price ? parseFloat(product.partner_price) : null,
    bulkPrice: product.bulk_price ? parseFloat(product.bulk_price) : null,
    ivaPercentage: parseFloat(product.iva_percentage || 0),
    totalStock: totalStock,

    // Relaciones
    category: product.categories
      ? {
          id: product.categories.id_category,
          name: product.categories.category_name,
        }
      : null,

    unitMeasure: product.unit_measures
      ? {
          id: product.unit_measures.id_unit_measure,
          name: product.unit_measures.measure_name,
        }
      : null,

    status: product.general_statuses?.name_status ?? (product.id_status === 1 ? "Active" : "Inactive"),

    // Barcodes con stock individual
    barcodes: (product.barcodes || []).map((b) => ({
      id: b.id_barcode,
      barcode: b.barcode,
      barcodeType: b.barcode_type,
      stock: b.stock || 0,
    })),
  };
};

/**
 * Maps múltiples productos
 */
export const mapProducts = (products) => products.map(mapProduct);