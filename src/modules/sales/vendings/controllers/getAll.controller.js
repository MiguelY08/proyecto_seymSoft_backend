import { getAllVendingsUseCase } from "../use-cases/index.js";
import { validateGetAllVendings } from "../validators/index.js";

export const GetAllVendingsController = async (req, res) => {
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
          "Errores de validación.",
        errors:
          validation.errors,
      });
    }

    const filters =
      validation.data;

    // Ejecutar use-case con filtros validados
    const result =
      await getAllVendingsUseCase(
        filters
      );

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message:
          result.error,
        errorCode:
          result.errorCode,
      });
    }

    const {
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
        "Ventas recuperadas exitosamente.",
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
      "[GetAllVendingsController] Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Error recuperando las ventas.",
      error:
        error.message,
    });
  }
};
