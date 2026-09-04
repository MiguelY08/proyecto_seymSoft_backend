import { ReturnRepository } from '../repositories/returnRepository.js';
import { RETURN_STATUS } from '../helpers/returnHelpers.js';
import { salesReturnNotificationService } from '../helpers/salesReturnNotificationService.js';

export const cancelReturnDetailUseCase = async (
  idReturn,
  idDetail,
  cancellationReason,
  actorUserId = null
) => {
  try {
    const normalizedReason = cancellationReason?.trim() || '';

    if (normalizedReason.length < 10) {
      return {
        success: false,
        data: null,
        error: 'El motivo de anulación debe tener al menos 10 caracteres.',
        errorCode: 'CANCELLATION_REASON_REQUIRED',
      };
    }

    if (normalizedReason.length > 250) {
      return {
        success: false,
        data: null,
        error: 'El motivo de anulación no puede exceder 250 caracteres.',
        errorCode: 'VALIDATION_ERROR',
      };
    }

    const cancelledStatus = await ReturnRepository.findReturnStatusByName(
      RETURN_STATUS.CANCELLED
    );

    if (!cancelledStatus) {
      return {
        success: false,
        data: null,
        error: 'No existe el estado "Anulado" para devoluciones.',
        errorCode: 'STATUS_NOT_FOUND',
      };
    }

    const cancelled = await ReturnRepository.cancelReturnDetail({
      idReturn,
      idDetail,
      idReturnStatus: cancelledStatus.id_return_status,
      cancellationReason: normalizedReason
    });

    if (cancelled.creditReversalEvents?.length > 0) {
      await salesReturnNotificationService.notifyCreditReversed({
        events: cancelled.creditReversalEvents,
        actorUserId,
        cancellationReason: normalizedReason,
      });
    }

    return {
      success: true,
      data: {
        id: cancelled.id_sales_return,
        returnNumber: cancelled.return_number,
        status: cancelled.newStatusName,
        cancelledDetailId: cancelled.cancelledDetailId,
        cancellationReason: normalizedReason,
        creditReversed: (cancelled.creditReversalEvents || []).reduce(
          (total, event) => total + Number(event.amount || 0),
          0
        ),
        creditReversalEvents: cancelled.creditReversalEvents || [],
        stockEvents: cancelled.stockEvents || [],
      },
      error: null,
      errorCode: null,
    };
  } catch (error) {
    console.error('[cancelReturnDetailUseCase]', error);

    if (error.message?.includes('ya utilizó parte del saldo a favor')) {
      return {
        success: false,
        data: null,
        error: error.message,
        errorCode: 'CREDIT_BALANCE_ALREADY_USED',
      };
    }

    if (error.message?.includes('stock recibido')) {
      return {
        success: false,
        data: null,
        error: error.message,
        errorCode: 'RETURNED_STOCK_ALREADY_USED',
      };
    }

    if (error.message?.includes('no encontrada') || error.message?.includes('no pertenece')) {
      return {
        success: false,
        data: null,
        error: error.message,
        errorCode: 'RETURN_NOT_FOUND',
      };
    }

    if (error.message?.includes('ya se encuentra anulado')) {
      return {
        success: false,
        data: null,
        error: error.message,
        errorCode: 'DETAIL_ALREADY_CANCELLED',
      };
    }

    return {
      success: false,
      data: null,
      error: error.message || 'Error anulando el producto devuelto.',
      errorCode: 'DATABASE_ERROR',
    };
  }
};
