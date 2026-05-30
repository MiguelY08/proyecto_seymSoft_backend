import { UserRepository } from "../repositories/userRepository.js";

export const getMetricsUseCase = async () => {
  try {
    const metrics = await UserRepository.getMetrics();

    return {
      success: true,
      data: metrics,
    };

  } catch (error) {
    console.error("[GetMetricsUseCase] Error:", error);

    return {
      success: false,
      error: error.message,
    };
  }
};