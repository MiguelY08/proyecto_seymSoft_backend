import { getMetricsUseCase } from "../use-cases/index.js";

export const GetUserMetricsController = async (req, res) => {
  try {
    const result = await getMetricsUseCase();

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error || "Error obteniendo métricas de usuarios.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Métricas de usuarios obtenidas exitosamente.",
      data: result.data,
    });

  } catch (error) {
    console.error("[GetUserMetricsController] Error:", error);

    return res.status(500).json({
      success: false,
      message: "Error obteniendo métricas de usuarios.",
      error: error.message,
    });
  }
};