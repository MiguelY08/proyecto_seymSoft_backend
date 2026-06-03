import { AppError } from '../../../../shared/errors/AppError.js';
import { mapOrder } from '../mappers/orderMapper.js';
import { calculateOrderTotals } from '../helpers/orderHelpers.js';

export class CreateOrderUseCase {
  constructor(repo) {
    this.repo = repo;
  }

  

  async execute(dto) {

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
}
    const calculated = calculateOrderTotals(dto.items);

    const orderData = {
      idClient: dto.idClient,
      deliveryType: dto.deliveryType,
      deliveryAddress: dto.deliveryAddress,
      orderStatusId: dto.orderStatusId || 1,
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