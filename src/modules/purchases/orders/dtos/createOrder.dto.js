export class CreateOrderDto {
  constructor(data) {
    this.invoiceNumber = data.invoiceNumber.trim();
    this.purchaseDate  = new Date(data.purchaseDate);
    this.idProvider    = Number(data.idProvider);
    this.details       = (data.details || []).map((d) => ({
      idBarcode:      Number(d.idBarcode),
      quantity:       Number(d.quantity),
      grossUnitPrice: Number(d.grossUnitPrice),
      taxPercentage:  Number(d.taxPercentage),
      batchCode:      d.batchCode.trim(),
      // ── Derived calculations ──────────────────────────────────────────────
      taxUnitPrice:  +(Number(d.grossUnitPrice) * (Number(d.taxPercentage) / 100)).toFixed(2),
      netUnitPrice:  +(Number(d.grossUnitPrice) + +(Number(d.grossUnitPrice) * (Number(d.taxPercentage) / 100)).toFixed(2)).toFixed(2),
      grossSubtotal: +(Number(d.grossUnitPrice) * Number(d.quantity)).toFixed(2),
      ivaSubtotal:   +(+(Number(d.grossUnitPrice) * (Number(d.taxPercentage) / 100)).toFixed(2) * Number(d.quantity)).toFixed(2),
      netSubtotal:   +(+(Number(d.grossUnitPrice) + +(Number(d.grossUnitPrice) * (Number(d.taxPercentage) / 100)).toFixed(2)).toFixed(2) * Number(d.quantity)).toFixed(2),
    }));
  }
}