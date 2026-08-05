import { getUserByIdUseCase } from "../use-cases/index.js";
import {
  sendError,
  sendInternalError,
  sendSuccess,
} from "../../../shared/utils/httpResponses.js";
import { userErrorCodes } from "../../../shared/constants/userErrorCodes.js";
import { userErrorPublicMessages } from "../../../shared/constants/userErrorPublicMessages.js";

const statusCodeByError = {
  [userErrorCodes.VALIDATION_ERROR]: 400,
  [userErrorCodes.USER_NOT_FOUND]: 404,
  [userErrorCodes.DATABASE_ERROR]: 500,
  [userErrorCodes.INTERNAL_SERVER_ERROR]: 500,
};

export const GetUserByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    const idUser = Number(id);

    if (!id || isNaN(idUser) || idUser < 1) {
      return sendError(res, {
        status: 400,
        message: userErrorPublicMessages[userErrorCodes.VALIDATION_ERROR],
        errorCode: userErrorCodes.VALIDATION_ERROR,
        errors: { id: "ID de usuario invalido." },
      });
    }

    const result = await getUserByIdUseCase(idUser);

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
      message: "Usuario obtenido exitosamente.",
      data: {
        user: result.data.user,
        role: result.data.role,
        permissions: result.data.permissions,
        client: result.data.client,
        requiresPasswordSetup:
          result.data.requiresPasswordSetup,
      },
    });
  } catch (error) {
    console.error("[GetUserByIdController] Error:", error);

    return sendInternalError(res, {
      status: 500,
    });
  }
};
