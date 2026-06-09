import { AppError } from '../../../../shared/errors/AppError.js';
import { mapOrder } from '../mappers/orderMapper.js';
import {
  calculateOrderTotals,
  getPriceByClientType,
} from '../helpers/orderHelpers.js';

export class CreateOrderUseCase {
  constructor(repo) {
    this.repo = repo;
  }

  async execute(dto) {
    const client = await this.repo.findClientById(dto.idClient);

    if (!client) {
      throw new AppError('Cliente no encontrado.', 404);
    }

    const enrichedItems = [];

    for (const item of dto.items) {
      const barcodeRecord = await this.repo.findBarcodeByProduct(
        item.idProduct,
        item.barcode
      );

      if (!barcodeRecord) {
        throw new AppError(
          `El código de barras "${item.barcode}" no pertenece al producto seleccionado.`,
          400
        );
      }

      if ((barcodeRecord.stock || 0) < item.quantity) {
        throw new AppError(
          `Stock insuficiente para el producto "${barcodeRecord.products.name}". Stock disponible: ${barcodeRecord.stock}.`,
          400
        );
      }

      const unitPrice = getPriceByClientType(
        barcodeRecord.products,
        client.client_type
      );

      if (!unitPrice || Number(unitPrice) <= 0) {
        throw new AppError(
          `El producto "${barcodeRecord.products.name}" no tiene precio configurado para el tipo de cliente "${client.client_type || 'Detal'}".`,
          400
        );
      }

      enrichedItems.push({
        ...item,
        unitPrice: Number(unitPrice),
        ivaPercentage: Number(
          barcodeRecord.products.iva_percentage || 0
        ),
      });
    }

    const calculated = calculateOrderTotals(enrichedItems);

    const orderData = {
      idClient: dto.idClient,
      deliveryType: dto.deliveryType,
      deliveryAddress: dto.deliveryAddress,
      idOrderStatus: dto.idOrderStatus || 1,
      idPaymentStatus: dto.idPaymentStatus || 1,
      paymentStatus: dto.paymentStatus || 'Pendiente',
      items: calculated.items,
      subtotal: calculated.subtotal,
      ivaAmount: calculated.ivaAmount,
      total: calculated.total,
    };

    const order = await this.repo.create(orderData);

    return mapOrder(order);
  }
}