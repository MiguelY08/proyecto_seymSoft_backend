import { UserRepository } from "../repositories/userRepository.js";
import { prisma } from "../../../config/prisma.js";
import {
  normalizeEmail,
  normalizeNumericString,
  normalizeSpaces,
} from "../../../shared/utils/textNormalizer.js";
import { userErrorCodes } from "../../../shared/constants/userErrorCodes.js";
import { userErrorPublicMessages } from "../../../shared/constants/userErrorPublicMessages.js";
import {
  DEFAULT_ADMIN_EMAIL,
  isDefaultAdminEmail,
} from "../../../shared/constants/defaultAdminUser.js";

const SYSTEM_ID_USER = 999999999;

const fail = (errorCode) => ({
  success: false,
  data: null,
  error: userErrorPublicMessages[errorCode],
  errorCode,
});

/**
 * Use-Case: Actualizar usuario
 */
export const updateUserUseCase = async (params) => {
  try {
    const { idUser, updateData } = params;

    if (!idUser || isNaN(idUser) || idUser < 1) {
      return fail(userErrorCodes.VALIDATION_ERROR);
    }

    const parsedIdUser = Number(idUser);

    if (!updateData || Object.keys(updateData).length === 0) {
      return fail(userErrorCodes.NO_DATA_TO_UPDATE);
    }

    const normalizedUpdateData = {
      ...updateData,
      ...(updateData.fullName !== undefined && {
        fullName: normalizeSpaces(updateData.fullName),
      }),
      ...(updateData.email !== undefined && {
        email: normalizeEmail(updateData.email),
      }),
      ...(updateData.phone !== undefined &&
        updateData.phone !== null && {
          phone: BigInt(normalizeNumericString(updateData.phone)),
        }),
    };

    const existingUser = await UserRepository.findById(parsedIdUser);

    if (!existingUser) {
      return fail(userErrorCodes.USER_NOT_FOUND);
    }

    if (parsedIdUser === SYSTEM_ID_USER) {
      return fail(userErrorCodes.CANNOT_UPDATE_SYSTEM_USER);
    }

    if (
      isDefaultAdminEmail(existingUser.email) &&
      (normalizedUpdateData.idRole !== undefined ||
        (normalizedUpdateData.email &&
          normalizedUpdateData.email !== DEFAULT_ADMIN_EMAIL))
    ) {
      return fail(userErrorCodes.CANNOT_UPDATE_SYSTEM_USER);
    }

    if (normalizedUpdateData.email) {
      const existingEmail = await UserRepository.findByEmail(
        normalizedUpdateData.email
      );

      if (existingEmail && existingEmail.id_user !== parsedIdUser) {
        return fail(userErrorCodes.DUPLICATE_EMAIL);
      }
    }

    const { idRole, ...userUpdateData } = normalizedUpdateData;

    const updatedUser = await UserRepository.update(
      parsedIdUser,
      userUpdateData
    );

    if (!updatedUser) {
      return fail(userErrorCodes.DATABASE_ERROR);
    }

    if (idRole !== undefined) {
      try {
        let employee = await prisma.employees.findUnique({
          where: { id_user: parsedIdUser },
          include: { employee_roles: true },
        });

        if (idRole === null) {
          if (employee && employee.employee_roles) {
            await prisma.employee_roles.deleteMany({
              where: { id_employee: employee.id_employee },
            });
          }

          if (employee) {
            await prisma.employees.delete({
              where: { id_employee: employee.id_employee },
            });
          }
        } else {
          const roleExists = await prisma.roles.findUnique({
            where: { id_role: idRole },
          });

          if (!roleExists) {
            return fail(userErrorCodes.ROLE_NOT_FOUND);
          }

          if (!employee) {
            employee = await prisma.employees.create({
              data: {
                id_user: parsedIdUser,
                id_status: 1,
              },
              include: { employee_roles: true },
            });
          }

          await prisma.employee_roles.deleteMany({
            where: { id_employee: employee.id_employee },
          });

          await prisma.employee_roles.create({
            data: {
              id_employee: employee.id_employee,
              id_role: idRole,
            },
          });
        }
      } catch (error) {
        console.error("[UpdateUserUseCase] Role update error:", {
          idUser: parsedIdUser,
          requestedRoleId: idRole,
          message: error.message,
          prismaCode: error.code,
          meta: error.meta,
          stack: error.stack,
        });

        return fail(userErrorCodes.ROLE_UPDATE_ERROR);
      }
    }

    const userWithRole = await UserRepository.getUserWithRole(parsedIdUser);

    if (!userWithRole?.user) {
      console.error("[UpdateUserUseCase] Updated user payload missing:", {
        idUser: parsedIdUser,
        userWithRole,
      });

      return fail(userErrorCodes.DATABASE_ERROR);
    }

    return {
      success: true,
      data: {
        ...userWithRole.user,
        role: userWithRole.role,
        permissions: userWithRole.permissions,
      },
      error: null,
      errorCode: null,
    };
  } catch (error) {
    console.error("[UpdateUserUseCase] Error:", {
      idUser: params?.idUser,
      updateData: params?.updateData,
      message: error.message,
      prismaCode: error.code,
      meta: error.meta,
      stack: error.stack,
    });

    if (error.code === "P2002") {
      const field = error.meta?.target?.[0];
      if (field === "email") {
        return fail(userErrorCodes.DUPLICATE_EMAIL);
      }
    }

    return fail(userErrorCodes.DATABASE_ERROR);
  }
};

export const update = updateUserUseCase;
