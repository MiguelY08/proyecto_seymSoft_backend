import { getAllUsersUseCase } from "../use-cases/index.js";
import { validateGetUsers } from "../validators/index.js";
import { UserMapper } from "../mappers/usersMapper.js";
import { isSelfUserAction } from "../helpers/selfUserAction.js";
import {
  sendError,
  sendInternalError,
  sendValidationError,
} from "../../../shared/utils/httpResponses.js";
import { userErrorCodes } from "../../../shared/constants/userErrorCodes.js";
import { userErrorPublicMessages } from "../../../shared/constants/userErrorPublicMessages.js";

const statusCodeByError = {
  [userErrorCodes.VALIDATION_ERROR]: 400,
  [userErrorCodes.DATABASE_ERROR]: 500,
  [userErrorCodes.INTERNAL_SERVER_ERROR]: 500,
};

export const GetUsersController = async (req, res) => {
  try {
    const validation = validateGetUsers(req.query);

    if (!validation.success) {
      return sendValidationError(res, validation.errors);
    }

    const result = await getAllUsersUseCase(validation.data);

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

    const {
      users,
      total,
      page,
      limit,
      totalPages,
      hasNextPage,
      hasPrevPage,
    } = result.data;

    const responseUsers = users.map((user) => {
      const responseUser = UserMapper.toResponse(user);

      return {
        ...responseUser,
        isSelf: isSelfUserAction({
          authUser: req.user,
          targetUserId: responseUser?.id,
        }),
      };
    });

    const pagination = {
      page,
      limit,
      total,
      totalPages,
      hasNextPage,
      hasPrevPage,
    };

    return res.status(200).json({
      success: true,
      message: "Usuarios recuperados exitosamente.",
      data: responseUsers,
      pagination,
      meta: {
        pagination,
      },
    });
  } catch (error) {
    console.error("[GetUsersController] Error:", error);

    return sendInternalError(res, {
      status: 500,
    });
  }
};
