import { RETURN_STATUSES } from "../../../../shared/constants/generalStatuses.js";
import { PurchaseReturnRepository } from "../repositories/purchaseReturnRepository.js";

export const getPurchaseReturnMetricsUseCase = async () => {
  try {
    const metrics =
      await PurchaseReturnRepository.getMetrics();

    if (!metrics) {
      return {
        success: false,
        data: null,
        error: "Respuesta invalida del repositorio.",
        errorCode: "INVALID_REPOSITORY_RESPONSE",
      };
    }

    const byStatus =
      await Promise.all(
        Object.values(RETURN_STATUSES).map(
          async (status) => ({
            id: status.id,
            name: status.name,
            total:
              await PurchaseReturnRepository.countByStatus(
                status.id
              ),
          })
        )
      );

    return {
      success: true,
      data: {
        total: metrics.total || 0,
        byStatus,
      },
      error: null,
      errorCode: null,
    };

  } catch (error) {
    console.error(
      "[GetPurchaseReturnMetricsUseCase]",
      error
    );

    return {
      success: false,
      data: null,
      error: "Error obteniendo metricas de devoluciones de compra.",
      errorCode: "DATABASE_ERROR",
    };
  }
};

export const getMetrics =
  getPurchaseReturnMetricsUseCase;
