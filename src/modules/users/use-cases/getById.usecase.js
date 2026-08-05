import { UserRepository } from "../repositories/userRepository.js";
import { userErrorCodes } from "../../../shared/constants/userErrorCodes.js";
import { userErrorPublicMessages } from "../../../shared/constants/userErrorPublicMessages.js";

const fail = (errorCode) => ({
  success: false,
  data: null,
  error: userErrorPublicMessages[errorCode],
  errorCode,
});

export const getUserByIdUseCase = async (id) => {
  try {
    if (!id || isNaN(id) || Number(id) < 1) {
      return fail(userErrorCodes.VALIDATION_ERROR);
    }

    const idUser = Number(id);
    const userWithRole = await UserRepository.getUserWithRole(idUser);

    if (!userWithRole?.user) {
      return fail(userErrorCodes.USER_NOT_FOUND);
    }

    return {
      success: true,
      data: {
        user: userWithRole.user,
        role: userWithRole.role,
        permissions: userWithRole.permissions,
        client: userWithRole.client,
        requiresPasswordSetup:
          userWithRole.requiresPasswordSetup,
      },
      error: null,
      errorCode: null,
    };
  } catch (error) {
    console.error("[GetUserByIdUseCase] Error:", {
      id,
      message: error.message,
      prismaCode: error.code,
      meta: error.meta,
      stack: error.stack,
    });

    return fail(userErrorCodes.DATABASE_ERROR);
  }
};

export const getById = getUserByIdUseCase;
