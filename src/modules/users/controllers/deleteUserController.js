import { deleteUserUseCase } from "../use-cases/index.js";
import { isSelfUserAction } from "../helpers/selfUserAction.js";
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
  [userErrorCodes.USER_STILL_ACTIVE]: 409,
  [userErrorCodes.CANNOT_DELETE_SYSTEM_USER]: 403,
  [userErrorCodes.USER_HAS_ASSIGNED_ROLES]: 409,
  [userErrorCodes.USER_HAS_ASSOCIATED_CLIENTS]: 409,
  [userErrorCodes.USER_HAS_ASSOCIATED_RECORDS]: 409,
  [userErrorCodes.TRANSFER_ERROR]: 409,
  [userErrorCodes.DATABASE_ERROR]: 500,
  [userErrorCodes.INTERNAL_SERVER_ERROR]: 500,
};

export const DeleteUserController = async (req, res) => {
  try {
    const { id } = req.params;

    if (isSelfUserAction({ authUser: req.user, targetUserId: id })) {
      return sendError(res, {
        status: 403,
        message:
          userErrorPublicMessages[
            userErrorCodes.SELF_USER_DELETE_NOT_ALLOWED
          ],
        errorCode:
          userErrorCodes.SELF_USER_DELETE_NOT_ALLOWED,
      });
    }

    const result = await deleteUserUseCase(id);

    if (!result.success) {
      return sendError(res, {
        status:
          statusCodeByError[result.errorCode] || 500,
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
      message: "Usuario eliminado exitosamente.",
      data: result.data,
    });
  } catch (error) {
    console.error("[DeleteUserController] Error:", error);

    return sendInternalError(res, {
      status: 500,
    });
  }
};
