import { AppError } from "../../../../shared/errors/appError.js";
import { hasCompleteSalePrices } from "../use-cases/productCommercialStatus.js";
import { validateProductPercentages } from "../use-cases/productPercentageValidation.js";

const firstDefined = (...values) =>
  values.find((value) => value !== undefined && value !== null && value !== "");

const parsePositiveInt = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const parseOptionalDecimal = (value) => {
  if (value === undefined || value === null || value === "") return null;

  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const normalizeBarcode = (barcode) => ({
  barcode: barcode?.barcode ?? barcode?.codBarras ?? barcode?.code,
  barcode_type: barcode?.barcode_type ?? barcode?.barcodeType ?? "EAN13",
  stock: parseInt(barcode?.stock ?? barcode?.cantidad ?? barcode?.quantity, 10) || 0,
});

const assertBarcodeLengths = (barcodes) => {
  for (const barcode of barcodes) {
    const length = String(barcode.barcode ?? "").trim().length;
    if (length < 8 || length > 13) {
      throw new AppError("Todos los codigos de barras deben tener entre 8 y 13 caracteres.", 400);
    }
  }
};

export class CreateProductDto {
  constructor(data) {
    this.name = data.nombre ?? data.name;
    this.reference = data.referencia ?? data.reference;
    if (String(this.reference ?? "").trim().length > 50) {
      throw new AppError("La referencia no puede superar los 50 caracteres.", 400);
    }
    this.retailPrice = parseFloat(data.precioDetalle ?? data.retailPrice) || 0;
    this.wholesalePrice = parseFloat(data.precioMayorista ?? data.wholesalePrice) || 0;
    this.partnerPrice = parseFloat(data.precioColegas ?? data.partnerPrice) || 0;
    this.bulkPrice = parseFloat(data.precioPacas ?? data.bulkPrice) || 0;
    this.supplierPrice = parseOptionalDecimal(firstDefined(
      data.supplierPrice,
      data.precioProveedor,
      data.precio_proveedor,
      data.supplier_price
    ));
    this.retailDiscountPct = parseFloat(data.retailDiscountPct) || 0;
    this.wholesaleDiscountPct = parseFloat(data.wholesaleDiscountPct) || 0;
    this.partnerDiscountPct = parseFloat(data.partnerDiscountPct) || 0;
    this.bulkDiscountPct = parseFloat(data.bulkDiscountPct) || 0;
    this.ivaPercentage = parseFloat(data.ivaPercentage) || 0;
    validateProductPercentages(this);
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
    const requestedStatus = parsePositiveInt(data.idStatus) || 1;
    this.idStatus = hasCompleteSalePrices(this) ? requestedStatus : 2;
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

    assertBarcodeLengths(this.barcodes);
  }
}
