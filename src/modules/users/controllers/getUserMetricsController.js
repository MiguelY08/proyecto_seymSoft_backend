import { getMetricsUseCase } from "../use-cases/index.js";
import {
  sendError,
  sendInternalError,
  sendSuccess,
} from "../../../shared/utils/httpResponses.js";
import { userErrorCodes } from "../../../shared/constants/userErrorCodes.js";
import { userErrorPublicMessages } from "../../../shared/constants/userErrorPublicMessages.js";

const statusCodeByError = {
  [userErrorCodes.DATABASE_ERROR]: 500,
  [userErrorCodes.INTERNAL_SERVER_ERROR]: 500,
};

export const GetUserMetricsController = async (req, res) => {
  try {
    const result = await getMetricsUseCase();

    if (!result.success) {
      return sendError(res, {
        status: statusCodeByError[result.errorCode] || 500,
        message:
          userErrorPublicMessages[result.errorCode] ||
          result.error,
        errorCode:
          result.errorCode ||
          userErrorCodes.INTERNAL_SERVER_ERROR,
      });
    }

    return sendSuccess(res, {
      status: 200,
      message: "Metricas de usuarios obtenidas exitosamente.",
      data: result.data,
    });
  } catch (error) {
    console.error("[GetUserMetricsController] Error:", error);

    return sendInternalError(res, {
      status: 500,
    });
  }
};
