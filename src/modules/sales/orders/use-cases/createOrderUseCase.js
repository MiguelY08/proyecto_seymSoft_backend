import {
  ORDER_PAYMENT_EXPIRATION,
  ORDER_STATUSES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
} from '../../../../shared/constants/generalStatuses.js';
import { AppError } from '../../../../shared/errors/appError.js';
import { EmailService } from '../../../../shared/services/emailService.js';
import { mapOrder } from '../mappers/orderMapper.js';
import {
  calculateOrderTotals,
  getPriceByClientType,
} from '../helpers/orderHelpers.js';

const CREDIT_PAYMENT_METHOD_ID = PAYMENT_METHODS[3].id;

const roundMoney = (value) => Math.round(Number(value || 0) * 100) / 100;

const sumPayments = (payments = []) =>
  roundMoney(
    payments.reduce(
      (total, payment) => total + Number(payment.amount || 0),
      0
    )
  );
const buildPaymentDeadline = () => {
  const now = new Date();
  return new Date(
    now.getTime() + ORDER_PAYMENT_EXPIRATION.HOURS_TO_PAY * 60 * 60 * 1000
  );
};

const notifyOrderCreated = async (order) => {
  const mappedOrder = mapOrder(order);
  const customer = mappedOrder.customer;

  if (!customer?.email) {
    return;
  }

  try {
    await EmailService.sendOrderCreatedEmail({
      to: customer.email,
      fullName: customer.name,
      orderId: mappedOrder.id,
      details: mappedOrder.details,
      subtotal: mappedOrder.subtotal,
      ivaAmount: mappedOrder.ivaAmount,
      total: mappedOrder.total,
      paymentDeadline: mappedOrder.paymentDeadline,
      deliveryType: mappedOrder.deliveryType,
      deliveryAddress: mappedOrder.deliveryAddress,
    });
  } catch (error) {
    console.error('[CreateOrderUseCase] Email error:', error.message);
  }
};

export class CreateOrderUseCase {
  constructor(repo) {
    this.repo = repo;
  }

  async prepare(dto) {
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
    const initialPayments = dto.initialPayments || [];

    for (const payment of initialPayments) {
      if (Number(payment.idPaymentMethod) === CREDIT_PAYMENT_METHOD_ID) {
        throw new AppError(
          'El metodo Credito solo puede usarse al crear una venta.',
          400
        );
      }

      const paymentMethod = await this.repo.findPaymentMethodById(
        payment.idPaymentMethod
      );

      if (!paymentMethod) {
        throw new AppError(
          `El metodo de pago ${payment.idPaymentMethod} no existe.`,
          404
        );
      }
    }

    const paidAmount = sumPayments(initialPayments);

    if (paidAmount > calculated.total) {
      throw new AppError(
        'La suma de pagos no puede superar el total del pedido.',
        400
      );
    }

    const isPaid = paidAmount >= calculated.total && calculated.total > 0;
    const paymentStatus = isPaid
      ? PAYMENT_STATUSES[2]
      : PAYMENT_STATUSES[1];

    return {
      idClient: dto.idClient,
      deliveryType: dto.deliveryType,
      deliveryAddress: dto.deliveryAddress,
      idOrderStatus: dto.idOrderStatus || ORDER_STATUSES[1].id,
      idPaymentStatus: paymentStatus.id,
      paymentStatus: paymentStatus.name,
      paymentDeadline: isPaid ? null : dto.paymentDeadline || buildPaymentDeadline(),
      initialPayments,
      items: calculated.items,
      subtotal: calculated.subtotal,
      ivaAmount: calculated.ivaAmount,
      total: calculated.total,
    };
  }

  async createPrepared(orderData) {
    const order = await this.repo.create(orderData);

    void notifyOrderCreated(order);

    return mapOrder(order);
  }

  async execute(dto) {
    const orderData = await this.prepare(dto);

    return this.createPrepared(orderData);
  }
}
