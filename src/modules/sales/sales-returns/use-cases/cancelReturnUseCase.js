// src/modules/sales/sales-returns/use-cases/cancelReturnUseCase.js

import { ReturnRepository } from '../repositories/returnRepository.js';
import { RETURN_STATUS } from '../helpers/returnHelpers.js';
import { salesReturnNotificationService } from '../helpers/salesReturnNotificationService.js';

const CANCELLED_STATUS_NAME = RETURN_STATUS.CANCELLED;

export const cancelReturnUseCase = async (idReturn, cancellationReason, actorUserId = null) => {
  try {
    // 1. Validar motivo
    if (!cancellationReason?.trim() || cancellationReason.trim().length < 10) {
      return {
        success: false,
        data: null,
        error: 'El motivo de anulación debe tener al menos 10 caracteres.',
        errorCode: 'CANCELLATION_REASON_REQUIRED',
      };
    }

    // 2. Verificar que la devolución existe
    const currentReturn = await ReturnRepository.findRawById(idReturn);

    if (!currentReturn) {
      return {
        success: false,
        data: null,
        error: 'Devolución no encontrada.',
        errorCode: 'RETURN_NOT_FOUND',
      };
    }

    // 3. Verificar que no esté ya anulada
    if (currentReturn.return_statuses?.name_status === CANCELLED_STATUS_NAME) {
      return {
        success: false,
        data: null,
        error: 'La devolución ya se encuentra anulada.',
        errorCode: 'RETURN_ALREADY_CANCELLED',
      };
    }

    // 4. Obtener estado "Anulado"
    const cancelledStatus = await ReturnRepository.findReturnStatusByName(
      CANCELLED_STATUS_NAME
    );

    if (!cancelledStatus) {
      return {
        success: false,
        data: null,
        error: 'No existe el estado "Anulado" para devoluciones.',
        errorCode: 'STATUS_NOT_FOUND',
      };
    }

    // 5. Determinar qué detalles deben restaurar stock
    // 6. Anular la devolución
    const cancelled = await ReturnRepository.cancelReturn({
      idReturn,
      idReturnStatus: cancelledStatus.id_return_status,
      cancellationReason: cancellationReason.trim()
    });

    if (cancelled.creditReversalEvents?.length > 0) {
      await salesReturnNotificationService.notifyCreditReversed({
        events: cancelled.creditReversalEvents,
        actorUserId,
        cancellationReason: cancellationReason.trim(),
      });
    }

    await salesReturnNotificationService.notifyReturnCancelled({
      returnId: idReturn,
      actorUserId,
      cancellationReason: cancellationReason.trim(),
    });

    return {
      success: true,
      data: {
        id: cancelled.id_sales_return,
        returnNumber: cancelled.return_number,
        status: CANCELLED_STATUS_NAME,
        cancellationReason: cancellationReason.trim(),
        cancelledAt: cancelled.cancelled_at,
        creditReversed: (cancelled.creditReversalEvents || []).reduce(
          (total, event) => total + Number(event.amount || 0),
          0
        ),
        creditReversalEvents: cancelled.creditReversalEvents || [],
      },
      error: null,
      errorCode: null,
    };

  } catch (error) {
    console.error('[cancelReturnUseCase]', error);

    if (error.message?.includes('ya utilizó parte del saldo a favor')) {
      return {
        success: false,
        data: null,
        error: error.message,
        errorCode: 'CREDIT_BALANCE_ALREADY_USED',
      };
    }

    return {
      success: false,
      data: null,
      error: 'Error anulando la devolución.',
      errorCode: 'DATABASE_ERROR',
    };
  }
};
