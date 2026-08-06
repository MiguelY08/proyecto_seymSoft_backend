import { updateUserUseCase } from "../use-cases/index.js";
import { validateUpdateUser } from "../validators/index.js";
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
  [userErrorCodes.DUPLICATE_EMAIL]: 409,
  [userErrorCodes.NO_DATA_TO_UPDATE]: 400,
  [userErrorCodes.ROLE_NOT_FOUND]: 404,
  [userErrorCodes.SELF_USER_UPDATE_NOT_ALLOWED]: 403,
  [userErrorCodes.CANNOT_UPDATE_SYSTEM_USER]: 403,
  [userErrorCodes.ROLE_UPDATE_ERROR]: 500,
  [userErrorCodes.DATABASE_ERROR]: 500,
  [userErrorCodes.INTERNAL_SERVER_ERROR]: 500,
};

export const UpdateUserController = async (req, res) => {
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
            userErrorCodes.SELF_USER_UPDATE_NOT_ALLOWED
          ],
        errorCode:
          userErrorCodes.SELF_USER_UPDATE_NOT_ALLOWED,
      });
    }

    const validation = validateUpdateUser(req.body);

    if (!validation.success) {
      return sendValidationError(res, validation.errors);
    }

    const result = await updateUserUseCase({
      idUser,
      updateData: validation.data,
    });

    if (!result.success) {
      const extraErrors =
        result.errorCode === userErrorCodes.DUPLICATE_EMAIL
          ? { email: "Email duplicado." }
          : null;

      return sendError(res, {
        status:
          statusCodeByError[result.errorCode] || 500,
        message:
          userErrorPublicMessages[result.errorCode] ||
          result.error,
        errorCode:
          result.errorCode ||
          userErrorCodes.INTERNAL_SERVER_ERROR,
        errors: extraErrors,
      });
    }

    return sendSuccess(res, {
      status: 200,
      message: "Usuario actualizado exitosamente.",
      data: {
        user: result.data,
        role: result.data.role,
        permissions: result.data.permissions,
      },
    });
  } catch (error) {
    console.error("[UpdateUserController] Error:", error);

    return sendInternalError(res, {
      status: 500,
    });
  }
};
