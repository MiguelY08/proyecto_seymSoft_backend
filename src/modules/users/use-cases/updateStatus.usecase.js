import { UserRepository } from "../repositories/userRepository.js";
import { GENERAL_STATUSES } from "../../../shared/constants/generalStatuses.js";
import { userErrorCodes } from "../../../shared/constants/userErrorCodes.js";
import { userErrorPublicMessages } from "../../../shared/constants/userErrorPublicMessages.js";
import { isDefaultAdminEmail } from "../../../shared/constants/defaultAdminUser.js";

const SYSTEM_ID_USER = 999999999;
const INACTIVE_ID_STATUS = 2;

const fail = (errorCode) => ({
  success: false,
  data: null,
  error: userErrorPublicMessages[errorCode],
  errorCode,
});

/**
 * Use-Case: Actualizar estado del usuario
 */
export const updateUserStatusUseCase = async (params) => {
  try {
    const { idUser, idStatus } = params;

    if (!idUser || isNaN(idUser) || idUser < 1) {
      return fail(userErrorCodes.VALIDATION_ERROR);
    }

    if (!idStatus || isNaN(idStatus) || idStatus < 1) {
      return fail(userErrorCodes.VALIDATION_ERROR);
    }

    const parsedIdUser = Number(idUser);
    const parsedIdStatus = Number(idStatus);

    if (!GENERAL_STATUSES[parsedIdStatus]) {
      return fail(userErrorCodes.INVALID_STATUS);
    }

    const existingUser = await UserRepository.findById(parsedIdUser);

    if (!existingUser) {
      return fail(userErrorCodes.USER_NOT_FOUND);
    }

    if (parsedIdUser === SYSTEM_ID_USER) {
      return fail(userErrorCodes.CANNOT_UPDATE_SYSTEM_USER);
    }

    if (
      isDefaultAdminEmail(existingUser.email) &&
      parsedIdStatus === INACTIVE_ID_STATUS
    ) {
      return fail(userErrorCodes.CANNOT_UPDATE_SYSTEM_USER);
    }

    if (Number(existingUser.id_status) === parsedIdStatus) {
      return fail(userErrorCodes.STATUS_ALREADY_ASSIGNED);
    }

    const updatedUser = await UserRepository.updateStatus(
      parsedIdUser,
      parsedIdStatus
    );

    if (!updatedUser) {
      return fail(userErrorCodes.DATABASE_ERROR);
    }

    const requiredFields = [
      "idUser",
      "fullName",
      "email",
      "phone",
      "creationDate",
      "idStatus",
    ];

    for (const field of requiredFields) {
      if (updatedUser[field] === undefined) {
        console.error("[UpdateUserStatusUseCase] Missing field in updated user:", {
          idUser: parsedIdUser,
          field,
          updatedUser,
        });

        return fail(userErrorCodes.DATABASE_ERROR);
      }
    }

    if (updatedUser.idStatus !== parsedIdStatus) {
      console.error("[UpdateUserStatusUseCase] Status mismatch after update:", {
        idUser: parsedIdUser,
        expectedStatus: parsedIdStatus,
        actualStatus: updatedUser.idStatus,
      });

      return fail(userErrorCodes.DATABASE_ERROR);
    }

    return {
      success: true,
      data: updatedUser,
      error: null,
      errorCode: null,
    };
  } catch (error) {
    console.error("[UpdateUserStatusUseCase] Error:", {
      idUser: params?.idUser,
      requestedStatus: params?.idStatus,
      message: error.message,
      prismaCode: error.code,
      meta: error.meta,
      stack: error.stack,
    });

    return fail(userErrorCodes.DATABASE_ERROR);
  }
};

export const updateStatus = updateUserStatusUseCase;
