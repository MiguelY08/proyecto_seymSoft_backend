import { UserRepository } from "../repositories/userRepository.js";
import { UserMapper } from "../mappers/usersMapper.js";
import { userErrorCodes } from "../../../shared/constants/userErrorCodes.js";
import { userErrorPublicMessages } from "../../../shared/constants/userErrorPublicMessages.js";

const fail = (errorCode) => ({
  success: false,
  data: null,
  error: userErrorPublicMessages[errorCode],
  errorCode,
});

export const getAllUsersUseCase = async (filters = {}) => {
  try {
    const result = await UserRepository.findAllWithFilters(filters);

    if (!result.users || !Array.isArray(result.users)) {
      console.error("[GetAllUsersUseCase] Invalid repository payload:", {
        filters,
        result,
      });

      return fail(userErrorCodes.DATABASE_ERROR);
    }

    if (result.users.length === 0) {
      return {
        success: true,
        data: {
          users: [],
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
          hasNextPage: result.hasNextPage,
          hasPrevPage: result.hasPrevPage,
        },
        error: null,
        errorCode: null,
      };
    }

    const mappedUsers = result.users
      .map((user) => {
        if (!user || Object.keys(user).length === 0) {
          return null;
        }

        try {
          const mappedUser = UserMapper.toDomain(user);

          return {
            ...mappedUser,
            role: user.role || null,
            isClient: user.isClient || false,
          };
        } catch (mapError) {
          console.error("[GetAllUsersUseCase] Error mapping user:", {
            filters,
            message: mapError.message,
            stack: mapError.stack,
            rawUser: user,
          });

          return null;
        }
      })
      .filter((user) => user !== null);

    return {
      success: true,
      data: {
        users: mappedUsers,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        hasNextPage: result.hasNextPage,
        hasPrevPage: result.hasPrevPage,
      },
      error: null,
      errorCode: null,
    };
  } catch (error) {
    console.error("[GetAllUsersUseCase] Error:", {
      filters,
      message: error.message,
      prismaCode: error.code,
      meta: error.meta,
      stack: error.stack,
    });

    return fail(userErrorCodes.DATABASE_ERROR);
  }
};

export const getAll = getAllUsersUseCase;
