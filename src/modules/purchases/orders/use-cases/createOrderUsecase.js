import { OrderRepository } from '../repositories/orderRepository.js';
import { OrderMapper }     from '../mappers/orderMapper.js';

const orderRepository = new OrderRepository();

export class CreateOrderUseCase {
  async execute(dto) {
    // 1 — Invoice number must be unique
    const duplicate = await orderRepository.findByInvoiceNumber(dto.invoiceNumber);
    if (duplicate) {
      const error = new Error('Ya existe una compra con ese número de factura.');
      error.statusCode = 409;
      throw error;
    }

    // 2 — Provider must exist
    const provider = await orderRepository.findProviderById(dto.idProvider);
    if (!provider) {
      const error = new Error('Proveedor no encontrado.');
      error.statusCode = 404;
      throw error;
    }

    // 3 — Each barcode must exist
    for (const detail of dto.details) {
      const barcode = await orderRepository.findBarcodeById(detail.idBarcode);
      if (!barcode) {
        const error = new Error(`Código de barras con id ${detail.idBarcode} no encontrado.`);
        error.statusCode = 404;
        throw error;
      }
    }

    // 4 — Build order DB data
    const orderData = OrderMapper.toCreateDB(dto);
    const order     = await orderRepository.create(orderData, dto.details);

    return OrderMapper.toDTOWithDetails(order);
  }
}