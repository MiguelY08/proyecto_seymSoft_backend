export class UpdateProductDto {
  constructor(data) {
    this.name = data.name ?? data.nombre;
    this.reference = data.reference ?? data.referencia;
    this.retailPrice = data.retailPrice ?? data.precioDetalle;
    this.wholesalePrice = data.wholesalePrice ?? data.precioMayorista;
    this.partnerPrice = data.partnerPrice ?? data.precioColegas;
    this.bulkPrice = data.bulkPrice ?? data.precioPacas;
    this.retailDiscountPct = parseFloat(data.retailDiscountPct) || 0;
    this.wholesaleDiscountPct = parseFloat(data.wholesaleDiscountPct) || 0;
    this.partnerDiscountPct = parseFloat(data.partnerDiscountPct) || 0;
    this.bulkDiscountPct = parseFloat(data.bulkDiscountPct) || 0;
    this.ivaPercentage = data.ivaPercentage ?? data.iva_percentage;
    this.idUnitMeasure = data.idUnitMeasure ?? data.id_unit_measure;
    this.idCategorie = data.idCategorie ?? data.id_category;
    this.description = data.description ?? data.descripcion;
    this.quantityPerPack = data.quantityPerPack ?? data.cantidadXPaca;
    this.idStatus = data.idStatus ?? data.id_status;
    this.categories = data.categories ?? [];
    this.subcategories = data.subcategories ?? [];

    // Barcodes (opcional en actualización)
    this.barcodes = data.barcodes ?? [];
    if (!Array.isArray(this.barcodes)) {
      this.barcodes = [];
    }

    // Validar que TODOS los barcodes tengan mínimo 8 caracteres
    if (this.barcodes.length > 0) {
      for (const barcode of this.barcodes) {
        if (!barcode.barcode || barcode.barcode.length < 8) {
          throw new Error(`Todos los códigos de barras deben tener mínimo 8 caracteres. Recibido: "${barcode.barcode}"`);
        }
      }
    }
  }
}