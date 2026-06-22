import {
  ORDER_PAYMENT_EXPIRATION,
  ORDER_STATUSES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  SALE_STATUSES,
} from '../../../../shared/constants/generalStatuses.js';
import { AppError } from '../../../../shared/errors/appError.js';
import { EmailService } from '../../../../shared/services/emailService.js';
import { VendingRepository } from '../../vendings/repositories/vendingRepository.js';
import { mapOrder } from '../mappers/orderMapper.js';
import {
  calculateOrderTotals,
  getPriceByClientType,
} from '../helpers/orderHelpers.js';

const CREDIT_PAYMENT_METHOD_ID = PAYMENT_METHODS[3].id;
const IN_PROCESS_ORDER_STATUS_ID = ORDER_STATUSES[1].id;
const READY_ORDER_STATUS_ID = ORDER_STATUSES[2].id;
const DELIVERED_ORDER_STATUS_ID = ORDER_STATUSES[3].id;
const CANCELLED_ORDER_STATUS_ID = ORDER_STATUSES[4].id;
const PAID_PAYMENT_STATUS_ID = PAYMENT_STATUSES[2].id;
const APPROVED_SALE_STATUS_ID = SALE_STATUSES[1].id;
const DIRECT_SALE_TYPE_NAME = 'DIRECTA';
const PAID_ORDER_ALLOWED_STATUS_IDS = [
  READY_ORDER_STATUS_ID,
  DELIVERED_ORDER_STATUS_ID,
];

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

const resolveAssignedEmployeeId = async (repo, dto) => {
  const receivedEmployeeId = Number(dto.idEmployee);

  if (receivedEmployeeId && !Number.isNaN(receivedEmployeeId)) {
    const employeeById = await repo.findEmployeeById(receivedEmployeeId);
    if (employeeById) return employeeById.id_employee;

    const employeeByUser = await repo.findEmployeeByUserId(receivedEmployeeId);
    if (employeeByUser) return employeeByUser.id_employee;
  }

  const userId = Number(dto.idUser);

  if (userId && !Number.isNaN(userId)) {
    const employeeByUser = await repo.findEmployeeByUserId(userId);
    if (employeeByUser) return employeeByUser.id_employee;
  }

  return null;
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
    const idEmployee = await resolveAssignedEmployeeId(this.repo, dto);

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
    const idOrderStatus = Number(dto.idOrderStatus || IN_PROCESS_ORDER_STATUS_ID);

    if (isPaid && !PAID_ORDER_ALLOWED_STATUS_IDS.includes(idOrderStatus)) {
      throw new AppError(
        'Un pedido pagado al registrarse solo puede quedar en estado Listo o Entregado.',
        400
      );
    }

    if (!isPaid && idOrderStatus === DELIVERED_ORDER_STATUS_ID) {
      throw new AppError(
        'Un pedido con pago parcial no puede registrarse como Entregado.',
        400
      );
    }

    if (idOrderStatus === CANCELLED_ORDER_STATUS_ID) {
      throw new AppError(
        'Para cancelar un pedido debe usar la ruta de cancelacion y enviar un motivo.',
        400
      );
    }

    return {
      idClient: dto.idClient,
      idEmployee,
      deliveryType: dto.deliveryType,
      deliveryAddress: dto.deliveryAddress,
      idOrderStatus,
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

  async createPaidOrderWithDirectSale(orderData) {
    if (!orderData.idEmployee) {
      throw new AppError(
        'Debe asociar un empleado para registrar una venta directa desde un pedido pagado.',
        400
      );
    }

    const saleType = await VendingRepository.findSaleTypeByName(
      DIRECT_SALE_TYPE_NAME
    );

    if (!saleType) {
      throw new AppError('El tipo de venta DIRECTA no existe.', 404);
    }

    const order = await this.repo.create(orderData);

    try {
      await VendingRepository.create({
        idOrder: order.id_order,
        idEmployee: orderData.idEmployee,
        subtotal: orderData.subtotal,
        idSaleStatus: APPROVED_SALE_STATUS_ID,
        idSaleType: saleType.id_sale_type,
        paymentMethods: orderData.initialPayments.map((payment) => ({
          idPaymentMethod: payment.idPaymentMethod,
          amount: payment.amount,
        })),
        orderDetails: orderData.items,
        decreaseStock: true,
        markOrderAsPaid: false,
      });
    } catch (error) {
      await this.repo.deleteCreatedOrder(order.id_order);

      if (
        error.code === 'P2002' ||
        error.message?.includes('venta asociada')
      ) {
        throw new AppError(
          'El pedido ya tiene una venta asociada.',
          409
        );
      }

      if (error.message?.includes('Stock insuficiente')) {
        throw new AppError(
          error.message,
          409
        );
      }

      throw error;
    }

    const orderWithSale = await this.repo.findSummaryById(order.id_order);

    void notifyOrderCreated(orderWithSale);

    return mapOrder(orderWithSale);
  }

  async execute(dto) {
    const orderData = await this.prepare(dto);

    if (orderData.idPaymentStatus === PAID_PAYMENT_STATUS_ID) {
      return this.createPaidOrderWithDirectSale(orderData);
    }

    return this.createPrepared(orderData);
  }
}
