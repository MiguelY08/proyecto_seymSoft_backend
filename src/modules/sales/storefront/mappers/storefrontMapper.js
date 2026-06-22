const toNumber = (value) => {
  if (value === null || value === undefined) return null;
  return Number(value);
};

export const mapStorefrontProduct = (product) => {
  const totalStock = (product.barcodes || []).reduce(
    (total, barcode) => total + Number(barcode.stock || 0),
    0,
  );

  return {
    id: product.id_product,
    name: product.name,
    reference: product.reference,
    description: product.description,
    retailPrice: toNumber(product.retail_price),
    wholesalePrice: toNumber(product.wholesale_price),
    partnerPrice: toNumber(product.partner_price),
    bulkPrice: toNumber(product.bulk_price),
    retailDiscountPct: toNumber(product.retail_discount_pct) || 0,
    wholesaleDiscountPct: toNumber(product.wholesale_discount_pct) || 0,
    partnerDiscountPct: toNumber(product.partner_discount_pct) || 0,
    bulkDiscountPct: toNumber(product.bulk_discount_pct) || 0,
    ivaPercentage: toNumber(product.iva_percentage) || 0,
    quantityPerPack: product.quantity_per_pack,
    totalStock,
    status: product.general_statuses?.name_status ?? null,
    isActive: product.general_statuses?.name_status === "Activo",
    barcodes: (product.barcodes || []).map((barcode) => ({
      id: barcode.id_barcode,
      barcode: barcode.barcode,
      barcodeType: barcode.barcode_type,
      stock: barcode.stock,
    })),
    unitMeasure: product.unit_measures
      ? {
          id: product.unit_measures.id_unit_measure,
          name: product.unit_measures.name_unit_measure,
          abbreviation: product.unit_measures.abbreviation,
        }
      : null,
    images: (product.product_images || []).map((image) => ({
      id: image.id_image,
      url: image.image_url,
      isPrimary: image.is_primary,
    })),
    categories: (product.product_categories || []).map((relation) => ({
      id: relation.categories.id_category,
      name: relation.categories.category_name,
    })),
    subcategories: (product.product_subcategories || []).map((relation) => ({
      id: relation.subcategories.id_subcategory,
      name: relation.subcategories.name_subcategory,
    })),
  };
};

export const mapFavorite = (favorite) => ({
  idFavorite: favorite.id_favorite,
  createdAt: favorite.created_at,
  product: mapStorefrontProduct(favorite.products),
});

export const mapCartItem = (item) => ({
  idCartItem: item.id_cart_item,
  quantity: item.quantity,
  createdAt: item.created_at,
  updatedAt: item.updated_at,
  product: mapStorefrontProduct(item.products),
});
