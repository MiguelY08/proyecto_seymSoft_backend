import {
  ORDER_STATUSES,
  PAYMENT_STATUSES,
} from '../../../../shared/constants/generalStatuses.js';
import { AppError } from '../../../../shared/errors/appError.js';
import { EmailService } from '../../../../shared/services/emailService.js';
import { mapOrder } from '../mappers/orderMapper.js';
import {
  calculateOrderTotals,
  getPriceByClientType,
} from '../helpers/orderHelpers.js';

const getOrderStatusName = (order) =>
  order?.order_statuses?.name_status || null;

const notifyOrderStatusChanged = async ({ order, previousStatus }) => {
  const mappedOrder = mapOrder(order);
  const customer = mappedOrder.customer;

  if (!customer?.email) {
    return;
  }

  try {
    await EmailService.sendOrderStatusChangedEmail({
      to: customer.email,
      fullName: customer.name,
      orderId: mappedOrder.id,
      previousStatus,
      newStatus: mappedOrder.status?.name,
      deliveryType: mappedOrder.deliveryType,
      deliveryAddress: mappedOrder.deliveryAddress,
    });
  } catch (error) {
    console.error('[UpdateOrderUseCase] Email error:', error.message);
  }
};

export class UpdateOrderUseCase {
  constructor(repo) {
    this.repo = repo;
  }

  async execute(id, dto) {
    const order = await this.repo.findById(id);

    if (!order) {
      throw new AppError('Pedido no encontrado.', 404);
    }

    // Un pedido cancelado no debe volver a cambiar productos, cliente ni entrega.
    if (order.id_order_status === ORDER_STATUSES[4].id) {
      throw new AppError(
        'No se puede editar un pedido cancelado.',
        400
      );
    }

    const client = await this.repo.findClientById(dto.idClient);

    if (!client) {
      throw new AppError('Cliente no encontrado.', 404);
    }

    // Validar productos, codigos de barras y stock en paralelo antes de crear el pedido.
    const enrichedItems = await Promise.all(
      dto.items.map(async (item) => {
        const barcodeRecord = await this.repo.findBarcodeByProduct(
          item.idProduct,
          item.barcode
        );

        if (!barcodeRecord) {
          throw new AppError(
            `El codigo de barras "${item.barcode}" no pertenece al producto seleccionado.`,
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

        return {
          ...item,
          unitPrice: Number(unitPrice),
          ivaPercentage: Number(
            barcodeRecord.products.iva_percentage || 0
          ),
        };
      })
    );
    const calculated = calculateOrderTotals(enrichedItems);

    const orderData = {
      idClient: dto.idClient,
      deliveryType: dto.deliveryType,
      deliveryAddress: dto.deliveryAddress,
      idOrderStatus: dto.idOrderStatus || ORDER_STATUSES[1].id,
      idPaymentStatus: dto.idPaymentStatus || PAYMENT_STATUSES[1].id,
      paymentStatus: dto.paymentStatus || PAYMENT_STATUSES[1].name,
      items: calculated.items,
      subtotal: calculated.subtotal,
      ivaAmount: calculated.ivaAmount,
      total: calculated.total,
    };

    const updated = await this.repo.update(id, orderData);

    if (order.id_order_status !== updated.id_order_status) {
      void notifyOrderStatusChanged({
        order: updated,
        previousStatus: getOrderStatusName(order),
      });
    }

    return mapOrder(updated);
  }
}
