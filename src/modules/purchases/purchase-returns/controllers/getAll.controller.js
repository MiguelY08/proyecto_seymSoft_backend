import { getAllPurchaseReturnsUseCase } from "../use-cases/index.js";
import { validateGetPurchaseReturns } from "../validators/index.js";

const statusCodeByError = {
  INVALID_REPOSITORY_RESPONSE: 500,
  DATABASE_ERROR: 500,
};

export const GetAllPurchaseReturnsController = async (
  req,
  res
) => {
  try {
    const validation =
      validateGetPurchaseReturns({
        query: req.query,
      });

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Errores de validacion.",
        errors: validation.errors,
      });
    }

    const result =
      await getAllPurchaseReturnsUseCase(
        validation.data
      );

    if (!result.success) {
      return res
        .status(
          statusCodeByError[result.errorCode] || 500
        )
        .json({
          success: false,
          message: result.error,
          errorCode: result.errorCode,
        });
    }

    const {
      items,
      page,
      limit,
      total,
      totalPages,
      hasNextPage,
      hasPrevPage,
    } = result.data;

    return res.status(200).json({
      success: true,
      message: "Devoluciones de compra obtenidas exitosamente.",
      data: items,
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
      "[GetAllPurchaseReturnsController]",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Error obteniendo las devoluciones de compra.",
      error: error.message,
    });
  }
};
