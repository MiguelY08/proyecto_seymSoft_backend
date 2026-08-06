import { createUserUseCase } from "../use-cases/index.js";
import { validateCreateUser } from "../validators/index.js";
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
  [userErrorCodes.DUPLICATE_EMAIL]: 409,
  [userErrorCodes.INVALID_ROLE]: 400,
  [userErrorCodes.ROLE_NOT_FOUND]: 404,
  [userErrorCodes.DATABASE_ERROR]: 500,
  [userErrorCodes.INTERNAL_SERVER_ERROR]: 500,
};

export const CreateUserController = async (req, res) => {
  try {
    const validation = validateCreateUser(req.body);

    if (!validation.success) {
      return sendValidationError(res, validation.errors);
    }

    const result = await createUserUseCase({
      fullName: validation.data.fullName,
      email: validation.data.email,
      phone: validation.data.phone,
      idRole: validation.data.idRole,
    });

    if (!result.success) {
      const extraErrors =
        result.errorCode === userErrorCodes.DUPLICATE_EMAIL
          ? { email: "Email duplicado." }
          : null;

      return sendError(res, {
        status: statusCodeByError[result.errorCode] || 500,
        message:
          userErrorPublicMessages[result.errorCode] ||
          result.error,
        errorCode:
          result.errorCode ||
          userErrorCodes.INTERNAL_SERVER_ERROR,
        errors: extraErrors,
      });
    }

    const meta =
      result.warning || result.warningCode
        ? {
            warning: result.warning || null,
            warningCode: result.warningCode || null,
          }
        : undefined;

    return sendSuccess(res, {
      status: 201,
      message: "Usuario creado exitosamente.",
      data: {
        user: result.data.user,
        role: result.data.role,
        permissions: result.data.permissions,
      },
      meta,
    });
  } catch (error) {
    console.error("[CreateUserController] Error:", error);

    return sendInternalError(res, {
      status: 500,
    });
  }
};
