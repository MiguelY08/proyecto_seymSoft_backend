/**
 * CreateSupplierPurchaseDto
 *
 * El frontend solo manda idProduct, quantity y extraBarcodes (opcionales).
 * Los precios e impuestos se toman del producto en la BD — no del frontend.
 */
export class CreateSupplierPurchaseDto {
  constructor(data) {
    this.invoiceNumber = data.invoiceNumber.trim();
    this.purchaseDate  = new Date(data.purchaseDate);
    this.idProvider    = Number(data.idProvider);
    this.details       = (data.details || []).map((d) => ({
      idProduct:     Number(d.idProduct),
      quantity:      Number(d.quantity),
      extraBarcodes: (d.extraBarcodes || []).map((b) => b.trim()).filter(Boolean),
    }));
  }
}