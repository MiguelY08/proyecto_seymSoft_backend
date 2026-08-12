import { prisma } from "../../../config/prisma.js";
import { UserRepository } from "../repositories/userRepository.js";
import { UserMapper } from "../mappers/usersMapper.js";
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
 * Use-Case: Eliminar usuario
 *
 * Reglas de negocio:
 * - El usuario DEBE existir.
 * - El usuario DEBE estar inactivo.
 * - NO se puede eliminar el usuario del sistema.
 * - NO se puede eliminar un usuario con roles asignados.
 * - Antes de eliminar, se transfieren relaciones permitidas.
 */
export const deleteUserUseCase = async (idUser) => {
  try {
    if (!idUser || isNaN(idUser) || idUser < 1) {
      return fail(userErrorCodes.VALIDATION_ERROR);
    }

    const parsedIdUser = Number(idUser);
    const existingUser = await UserRepository.findById(parsedIdUser);

    if (!existingUser) {
      return fail(userErrorCodes.USER_NOT_FOUND);
    }

    const mappedUser = UserMapper.toDomain(existingUser);

    if (parsedIdUser === SYSTEM_ID_USER) {
      return fail(userErrorCodes.CANNOT_DELETE_SYSTEM_USER);
    }

    if (isDefaultAdminEmail(existingUser.email)) {
      return fail(userErrorCodes.CANNOT_DELETE_SYSTEM_USER);
    }

    const hasAssignedRoles =
      await UserRepository.hasAssignedRoles(parsedIdUser);

    if (hasAssignedRoles) {
      return fail(userErrorCodes.USER_HAS_ASSIGNED_ROLES);
    }

    if (mappedUser.idStatus !== INACTIVE_ID_STATUS) {
      return fail(userErrorCodes.USER_STILL_ACTIVE);
    }

    const relationSummary =
      await UserRepository.getDeletionRelationSummary(parsedIdUser);

    if (relationSummary?.totalBlockingRelations > 0) {
      console.error("[DeleteUserUseCase] Blocking relations detected:", {
        idUser: parsedIdUser,
        blockingRelations: relationSummary.blockingRelations,
        transferableRelations: relationSummary.transferableRelations,
      });

      return fail(userErrorCodes.USER_HAS_ASSOCIATED_RECORDS);
    }

    const relationsTransferred = {
      clients: 0,
      employees: 0,
      access: 0,
      notifications: 0,
    };

    try {
      await prisma.$transaction(async (tx) => {
        const clientsResult = await tx.clients.updateMany({
          where: { id_user: parsedIdUser },
          data: { id_user: SYSTEM_ID_USER },
        });

        relationsTransferred.clients = clientsResult.count;

        const employee = await tx.employees.findUnique({
          where: { id_user: parsedIdUser },
        });

        if (employee) {
          await tx.employee_roles.deleteMany({
            where: { id_employee: employee.id_employee },
          });

          await tx.employees.delete({
            where: { id_employee: employee.id_employee },
          });

          relationsTransferred.employees = 1;
        }

        const accessResult = await tx.access.updateMany({
          where: { id_user: parsedIdUser },
          data: { id_user: SYSTEM_ID_USER },
        });

        relationsTransferred.access = accessResult.count;

        const notificationsResult = await tx.notifications.updateMany({
          where: { id_user: parsedIdUser },
          data: { id_user: SYSTEM_ID_USER },
        });

        relationsTransferred.notifications = notificationsResult.count;

        await tx.users.delete({
          where: { id_user: parsedIdUser },
        });
      });
    } catch (txError) {
      console.error("[DeleteUserUseCase] Transaction error:", {
        idUser: parsedIdUser,
        message: txError.message,
        prismaCode: txError.code,
        meta: txError.meta,
        stack: txError.stack,
      });

      let errorCode = userErrorCodes.TRANSFER_ERROR;

      if (txError.code === "P2025") {
        errorCode = userErrorCodes.DATABASE_ERROR;
      } else if (txError.code === "P2003") {
        errorCode = userErrorCodes.USER_HAS_ASSOCIATED_RECORDS;
      }

      return fail(errorCode);
    }

    return {
      success: true,
      data: {
        deletedIdUser: parsedIdUser,
        relationsTransferred,
      },
      error: null,
      errorCode: null,
    };
  } catch (error) {
    console.error("[DeleteUserUseCase] Error:", {
      idUser,
      message: error.message,
      prismaCode: error.code,
      meta: error.meta,
      stack: error.stack,
    });

    return fail(userErrorCodes.DATABASE_ERROR);
  }
};

export const delete_ = deleteUserUseCase;
