const firstDefined = (...values) =>
  values.find((value) => value !== undefined && value !== null && value !== "");

const normalizeBarcode = (barcode) => {
  const code = firstDefined(barcode.barcode, barcode.codBarras, barcode.code);

  return {
    id: firstDefined(barcode.id, barcode.id_barcode),
    barcode: code !== undefined ? String(code) : undefined,
    barcode_type: firstDefined(barcode.barcode_type, barcode.barcodeType) || "EAN13",
    stock: firstDefined(barcode.stock, barcode.cantidad, barcode.quantity),
  };
};

export class UpdateProductDto {
  constructor(data) {
    this.name = firstDefined(data.name, data.nombre);
    this.reference = firstDefined(data.reference, data.referencia);
    this.retailPrice = firstDefined(data.retailPrice, data.precioDetalle, data.retail_price);
    this.wholesalePrice = firstDefined(data.wholesalePrice, data.precioMayorista, data.wholesale_price);
    this.partnerPrice = firstDefined(data.partnerPrice, data.precioColegas, data.partner_price);
    this.bulkPrice = firstDefined(data.bulkPrice, data.precioPacas, data.bulk_price);
    this.supplierPrice = firstDefined(
      data.supplierPrice,
      data.precioProveedor,
      data.precio_proveedor,
      data.supplier_price
    );
    this.retailDiscountPct = firstDefined(data.retailDiscountPct, data.retail_discount_pct);
    this.wholesaleDiscountPct = firstDefined(data.wholesaleDiscountPct, data.wholesale_discount_pct);
    this.partnerDiscountPct = firstDefined(data.partnerDiscountPct, data.partner_discount_pct);
    this.bulkDiscountPct = firstDefined(data.bulkDiscountPct, data.bulk_discount_pct);
    this.ivaPercentage = firstDefined(data.ivaPercentage, data.iva_percentage);
    this.idUnitMeasure = firstDefined(
      data.idUnitMeasure,
      data.id_unit_measure,
      data.idUnidadMedida,
      data.id_unidad_medida,
      data.unitMeasureId
    );
    this.idCategorie = firstDefined(
      data.idCategorie,
      data.id_category,
      data.idCategoria,
      data.categoryId
    );
    this.description = firstDefined(data.description, data.descripcion);
    this.quantityPerPack = firstDefined(data.quantityPerPack, data.cantidadXPaca, data.quantity_per_pack);
    this.idStatus = firstDefined(data.idStatus, data.id_status);
    this.stock = firstDefined(data.stock, data.cantidad, data.quantity);
    this.categories = data.categories ?? [];
    this.subcategories = data.subcategories ?? [];

    this.barcodes = Array.isArray(data.barcodes)
      ? data.barcodes.map(normalizeBarcode)
      : [];

    if (this.barcodes.length === 0) {
      const barcode = firstDefined(data.codBarras, data.barcode);
      if (barcode) {
        this.barcodes = [
          normalizeBarcode({
            barcode,
            barcode_type: firstDefined(data.barcode_type, data.barcodeType),
            stock: this.stock,
          }),
        ];
      }
    }

    if (this.barcodes.length > 0) {
      for (const barcode of this.barcodes) {
        if (!barcode.barcode || String(barcode.barcode).length < 8) {
          throw new Error(`Todos los codigos de barras deben tener minimo 8 caracteres. Recibido: "${barcode.barcode}"`);
        }
      }
    }
  }
}
