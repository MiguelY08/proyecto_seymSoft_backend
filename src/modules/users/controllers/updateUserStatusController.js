import { updateUserStatusUseCase } from "../use-cases/index.js";
import { validateUpdateUserStatus } from "../validators/index.js";
import { UserMapper } from "../mappers/usersMapper.js";
import { isSelfUserAction } from "../helpers/selfUserAction.js";
import {
  sendError,
  sendInternalError,
  sendSuccess,
  sendValidationError,
} from "../../../shared/utils/httpResponses.js";
import { userErrorCodes } from "../../../shared/constants/userErrorCodes.js";
import { userErrorPublicMessages } from "../../../shared/constants/userErrorPublicMessages.js";

const statusCodeByError = {
  [userErrorCodes.VALIDATION_ERROR]: 400,
  [userErrorCodes.USER_NOT_FOUND]: 404,
  [userErrorCodes.SELF_USER_STATUS_UPDATE_NOT_ALLOWED]: 403,
  [userErrorCodes.CANNOT_UPDATE_SYSTEM_USER]: 403,
  [userErrorCodes.STATUS_ALREADY_ASSIGNED]: 409,
  [userErrorCodes.INVALID_STATUS]: 400,
  [userErrorCodes.DATABASE_ERROR]: 500,
  [userErrorCodes.INTERNAL_SERVER_ERROR]: 500,
};

export const UpdateUserStatusController = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return sendError(res, {
        status: 400,
        message: userErrorPublicMessages[userErrorCodes.VALIDATION_ERROR],
        errorCode: userErrorCodes.VALIDATION_ERROR,
        errors: { id: "ID de usuario invalido." },
      });
    }

    const idUser = Number(id);

    if (isSelfUserAction({ authUser: req.user, targetUserId: idUser })) {
      return sendError(res, {
        status: 403,
        message:
          userErrorPublicMessages[
            userErrorCodes.SELF_USER_STATUS_UPDATE_NOT_ALLOWED
          ],
        errorCode:
          userErrorCodes.SELF_USER_STATUS_UPDATE_NOT_ALLOWED,
      });
    }

    const validation = validateUpdateUserStatus(req.body);

    if (!validation.success) {
      return sendValidationError(res, validation.errors);
    }

    const result = await updateUserStatusUseCase({
      idUser,
      idStatus: validation.data.idStatus,
    });

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

    const responseUser = UserMapper.toResponse(result.data);

    return sendSuccess(res, {
      status: 200,
      message: "Estado del usuario actualizado exitosamente.",
      data: responseUser,
    });
  } catch (error) {
    console.error("[UpdateUserStatusController] Error:", error);

    return sendInternalError(res, {
      status: 500,
    });
  }
};
