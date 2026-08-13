import {
  ORDER_PAYMENT_EXPIRATION,
  ORDER_STATUSES,
  PAYMENT_RECEIPT_STATUSES,
} from '../../../../shared/constants/generalStatuses.js';
import { AppError } from '../../../../shared/errors/appError.js';
import { EmailService } from '../../../../shared/services/emailService.js';
import { mapOrder } from '../mappers/orderMapper.js';
import { RegisterOrderPaymentUseCase } from './registerOrderPaymentUseCase.js';
import { notifyCustomerPaymentReceiptReviewed } from './orderCustomerNotifications.js';

const REVIEWABLE_RECEIPT_STATUSES = [
  PAYMENT_RECEIPT_STATUSES.APPROVED,
  PAYMENT_RECEIPT_STATUSES.REJECTED,
];

const buildPaymentDeadline = () => {
  const now = new Date();
  return new Date(
    now.getTime() + ORDER_PAYMENT_EXPIRATION.HOURS_TO_PAY * 60 * 60 * 1000
  );
};

const roundMoney = (value) =>
  Math.round((Number(value) || 0) * 100) / 100;

const getPaidAmountFromOrderPayments = (payments = []) =>
  roundMoney(
    payments.reduce(
      (total, payment) => total + Number(payment.amount || 0),
      0
    )
  );

const getPendingAmountFromOrder = (order = {}) =>
  roundMoney(
    roundMoney(order.total) -
    getPaidAmountFromOrderPayments(order.order_payments)
  );

const mapReceipt = (receipt) => ({
  id: receipt.id_order_payment_receipt,
  orderId: receipt.id_order,
  imageUrl: receipt.image_url,
  fileName: receipt.file_name || null,
  observations: receipt.observations || null,
  status: receipt.verification_status || PAYMENT_RECEIPT_STATUSES.PENDING,
  uploadedAt: receipt.uploaded_at || null,
  reviewObservations: receipt.review_observations || null,
  reviewedAt: receipt.reviewed_at || null,
  reviewedBy: receipt.reviewed_by || null,
});

export const notifyPaymentReceiptReviewed = async ({
  order,
  receipt,
  paymentSummary,
}) => {
  const mappedOrder =
    order?.id_order
      ? mapOrder(order)
      : order;

  if (!mappedOrder || !receipt) {
    return;
  }

  const customer = mappedOrder.customer;

  if (!customer?.email) {
    return;
  }

  try {
    if (receipt.status === PAYMENT_RECEIPT_STATUSES.APPROVED) {
      await EmailService.sendOrderPaymentReceiptApprovedEmail({
        to: customer.email,
        fullName: customer.name,
        orderId: mappedOrder.id,
        amount: paymentSummary?.paidAfter !== undefined && paymentSummary?.paidBefore !== undefined
          ? Number(paymentSummary.paidAfter) - Number(paymentSummary.paidBefore)
          : 0,
        paidAmount: paymentSummary?.paidAfter || 0,
        pendingAmount: paymentSummary?.pendingAfter || 0,
        isPaid: Boolean(paymentSummary?.isPaid),
        reviewObservations: receipt.reviewObservations,
        shippingAmount: mappedOrder.shippingAmount,
        deliveryType: mappedOrder.deliveryType,
        deliveryAddress: mappedOrder.deliveryAddress,
        deliveryRecipientName: mappedOrder.deliveryRecipientName,
        deliveryDepartment: mappedOrder.deliveryDepartment,
        deliveryCity: mappedOrder.deliveryCity,
      });
    }

    if (receipt.status === PAYMENT_RECEIPT_STATUSES.REJECTED) {
      await EmailService.sendOrderPaymentReceiptRejectedEmail({
        to: customer.email,
        fullName: customer.name,
        orderId: mappedOrder.id,
        reason: receipt.reviewObservations,
        shippingAmount: mappedOrder.shippingAmount,
        deliveryType: mappedOrder.deliveryType,
        deliveryAddress: mappedOrder.deliveryAddress,
        deliveryRecipientName: mappedOrder.deliveryRecipientName,
        deliveryDepartment: mappedOrder.deliveryDepartment,
        deliveryCity: mappedOrder.deliveryCity,
      });
    }
  } catch (error) {
    console.error('[NotifyPaymentReceiptReviewed] Email error:', error.message);
  }

  await notifyCustomerPaymentReceiptReviewed({
    order: mappedOrder,
    receipt,
    paymentSummary,
  });
};

export class ReviewOrderPaymentReceiptUseCase {
  constructor(repo) {
    this.repo = repo;
  }

  async execute(idOrder, receiptId, data, options = {}) {
    const order = await this.repo.findSummaryById(idOrder);

    if (!order) {
      throw new AppError('Pedido no encontrado.', 404);
    }

    if (Number(order.id_order_status) === ORDER_STATUSES[4].id) {
      throw new AppError(
        'No se pueden revisar comprobantes de un pedido cancelado.',
        400
      );
    }

    const receipt = await this.repo.findPaymentReceiptByOrderId(
      idOrder,
      receiptId
    );

    if (!receipt) {
      throw new AppError('Comprobante no encontrado para este pedido.', 404);
    }

    const currentStatus = receipt.verification_status;

    if (currentStatus !== PAYMENT_RECEIPT_STATUSES.PENDING) {
      throw new AppError(
        'Este comprobante ya fue revisado.',
        400
      );
    }

    if (!REVIEWABLE_RECEIPT_STATUSES.includes(data.status)) {
      throw new AppError('El estado del comprobante no es valido.', 400);
    }

    const reviewObservations = String(data.reviewObservations || '').trim();

    if (
      data.status === PAYMENT_RECEIPT_STATUSES.REJECTED &&
      !reviewObservations
    ) {
      throw new AppError('El motivo de rechazo es obligatorio.', 400);
    }

    if (reviewObservations.length > 255) {
      throw new AppError(
        'Las observaciones de revision no pueden exceder 255 caracteres.',
        400
      );
    }

    let paymentResult = null;
    let deadlineResetOrder = null;

    if (data.status === PAYMENT_RECEIPT_STATUSES.APPROVED) {
      const pendingAmount = getPendingAmountFromOrder(order);

      if (pendingAmount <= 0) {
        throw new AppError(
          'El pedido no tiene saldo pendiente para registrar al aprobar el comprobante.',
          400
        );
      }

      const registeredPayment = await new RegisterOrderPaymentUseCase(this.repo).execute(
        idOrder,
        {
          idPaymentMethod: data.idPaymentMethod,
          amount: pendingAmount,
          paymentDate: data.paymentDate,
          reference: data.reference,
          observations:
            reviewObservations ||
            `Abono registrado al aprobar comprobante #${receipt.id_order_payment_receipt}.`,
        },
        {
          ...options,
          receiptReview: {
            idReceipt: receipt.id_order_payment_receipt,
            status: PAYMENT_RECEIPT_STATUSES.APPROVED,
            reviewObservations: reviewObservations || null,
            reviewedBy: options.idUser || null,
          },
        }
      );
      paymentResult = {
        ...registeredPayment,
      };
      delete paymentResult.paymentNotification;
    }

    if (data.status === PAYMENT_RECEIPT_STATUSES.REJECTED) {
      const updatedReceipt = await this.repo.rejectPaymentReceiptAndResetDeadline(
        receipt.id_order_payment_receipt,
        idOrder,
        {
          paymentDeadline: buildPaymentDeadline(),
          reviewObservations: reviewObservations || null,
          reviewedBy: options.idUser || null,
        }
      );

      deadlineResetOrder = await this.repo.findSummaryById(idOrder);

      return {
        paymentReceipt: mapReceipt(updatedReceipt),
        paymentResult: null,
        order: mapOrder(deadlineResetOrder),
        receiptNotification: {
          order: deadlineResetOrder,
          receipt: mapReceipt(updatedReceipt),
          paymentSummary: null,
        },
      };
    }

    const updatedReceipt = await this.repo.findPaymentReceiptById(
      receipt.id_order_payment_receipt
    );

    const mappedReceipt = mapReceipt(updatedReceipt);
    const responseOrder = paymentResult?.order || deadlineResetOrder || null;

    return {
      paymentReceipt: mappedReceipt,
      paymentResult,
      order: responseOrder?.id_order ? mapOrder(responseOrder) : responseOrder,
      receiptNotification: {
        order: responseOrder || order,
        receipt: mappedReceipt,
        paymentSummary: paymentResult?.paymentSummary || null,
      },
    };
  }
}
