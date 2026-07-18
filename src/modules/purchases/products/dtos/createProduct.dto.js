import { AppError } from "../../../../shared/errors/appError.js";

const firstDefined = (...values) =>
  values.find((value) => value !== undefined && value !== null && value !== "");

const parsePositiveInt = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const normalizeBarcode = (barcode) => ({
  barcode: barcode?.barcode ?? barcode?.codBarras ?? barcode?.code,
  barcode_type: barcode?.barcode_type ?? barcode?.barcodeType ?? "EAN13",
  stock: parseInt(barcode?.stock ?? barcode?.cantidad ?? barcode?.quantity, 10) || 0,
});

export class CreateProductDto {
  constructor(data) {
    this.name = data.nombre ?? data.name;
    this.reference = data.referencia ?? data.reference;
    this.retailPrice = parseFloat(data.precioDetalle ?? data.retailPrice);
    this.wholesalePrice = parseFloat(data.precioMayorista ?? data.wholesalePrice);
    this.partnerPrice = data.precioColegas ? parseFloat(data.precioColegas) : null;
    this.bulkPrice = data.precioPacas ? parseFloat(data.precioPacas) : null;
    this.retailDiscountPct = parseFloat(data.retailDiscountPct) || 0;
    this.wholesaleDiscountPct = parseFloat(data.wholesaleDiscountPct) || 0;
    this.partnerDiscountPct = parseFloat(data.partnerDiscountPct) || 0;
    this.bulkDiscountPct = parseFloat(data.bulkDiscountPct) || 0;
    this.ivaPercentage = parseFloat(data.ivaPercentage) || 0;
    this.idUnitMeasure = parsePositiveInt(firstDefined(
      data.idUnitMeasure,
      data.id_unit_measure,
      data.idUnidadMedida,
      data.id_unidad_medida,
      data.unitMeasureId
    ));
    this.idCategorie = parsePositiveInt(firstDefined(
      data.idCategorie,
      data.id_category,
      data.idCategoria,
      data.categoryId
    ));
    this.description = data.description || null;
    this.quantityPerPack = parseInt(data.quantityPerPack, 10) || 0;
    this.idStatus = parsePositiveInt(data.idStatus) || 1;
    this.categories = data.categories || [];
    this.subcategories = data.subcategories || [];
    this.barcodes = Array.isArray(data.barcodes)
      ? data.barcodes.map(normalizeBarcode).filter((barcode) => barcode.barcode)
      : [];

    if (!this.idUnitMeasure) {
      throw new AppError("Debes seleccionar una unidad de medida valida.", 400);
    }

    if (!this.idCategorie) {
      throw new AppError("Debes seleccionar una categoria valida.", 400);
    }

    if (this.barcodes.length === 0 && data.codBarras) {
      this.barcodes.push({
        barcode: data.codBarras,
        barcode_type: "EAN13",
        stock: parseInt(data.stock, 10) || 0,
      });
    }

    if (this.barcodes.length === 0) {
      throw new AppError("Debes proporcionar al menos un codigo de barras.", 400);
    }
  }
}
