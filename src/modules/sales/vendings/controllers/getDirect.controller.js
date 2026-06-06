import { getVendingsByTypeUseCase } from "../use-cases/index.js";
import { validateGetAllVendings } from "../validators/index.js";

export const GetDirectVendingsController = async (req, res) => {
  try {
    // Validar query parameters con Zod
    const validation =
      validateGetAllVendings(
        req.query
      );

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message:
          "Errores de validacion.",
        errors:
          validation.errors,
      });
    }

    const filters =
      validation.data;

    // Ejecutar use-case con tipo fijo
    const result =
      await getVendingsByTypeUseCase(
        "direct",
        filters
      );

    if (!result.success) {
      const statusCodeByError = {
        INVALID_SALE_TYPE: 400,
        SALE_TYPE_NOT_FOUND: 404,
        INVALID_REPOSITORY_RESPONSE: 500,
        DATABASE_ERROR: 500,
      };

      return res.status(statusCodeByError[result.errorCode] || 500).json({
        success: false,
        message:
          result.error,
        errorCode:
          result.errorCode,
      });
    }

    const {
      type,
      sales,
      total,
      page,
      limit,
      totalPages,
      hasNextPage,
      hasPrevPage,
    } = result.data;

    return res.status(200).json({
      success: true,
      message:
        "Ventas directas recuperadas exitosamente.",
      type,
      data:
        sales,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    });

  } catch (error) {
    console.error(
      "[GetDirectVendingsController] Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Error recuperando las ventas directas.",
      error:
        error.message,
    });
  }
};
