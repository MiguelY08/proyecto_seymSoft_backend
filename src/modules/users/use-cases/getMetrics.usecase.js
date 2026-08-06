import { UserRepository } from "../repositories/userRepository.js";
import { userErrorCodes } from "../../../shared/constants/userErrorCodes.js";
import { userErrorPublicMessages } from "../../../shared/constants/userErrorPublicMessages.js";

const fail = (errorCode) => ({
  success: false,
  data: null,
  error: userErrorPublicMessages[errorCode],
  errorCode,
});

export const getMetricsUseCase = async () => {
  try {
    const metrics = await UserRepository.getMetrics();

    return {
      success: true,
      data: metrics,
      error: null,
      errorCode: null,
    };
  } catch (error) {
    console.error("[GetMetricsUseCase] Error:", {
      message: error.message,
      prismaCode: error.code,
      meta: error.meta,
      stack: error.stack,
    });

    return fail(userErrorCodes.DATABASE_ERROR);
  }
};
