import { prisma } from "../../../config/prisma.js";
import { UserRepository } from "../repositories/userRepository.js";
import { UserMapper } from "../mappers/usersMapper.js";

const SYSTEM_ID_USER = 999999999;
const INACTIVE_ID_STATUS = 2;

/**
 * Use-Case: Eliminar usuario
 *
 * Reglas de negocio:
 * - El usuario DEBE existir.
 * - El usuario DEBE estar INACTIVO.
 * - NO se puede eliminar el usuario del sistema.
 * - NO se puede eliminar un usuario con roles asignados.
 * - Antes de eliminar, se transfieren relaciones permitidas.
 */
export const deleteUserUseCase = async (idUser) => {
  try {
    if (!idUser || isNaN(idUser) || idUser < 1) {
      return {
        success: false,
        data: null,
        error: "ID de usuario inválido",
        errorCode: "VALIDATION_ERROR",
      };
    }

    const parsedIdUser = Number(idUser);

    const existingUser = await UserRepository.findById(parsedIdUser);

    if (!existingUser) {
      return {
        success: false,
        data: null,
        error: "Usuario no encontrado",
        errorCode: "USER_NOT_FOUND",
      };
    }

    const mappedUser = UserMapper.toDomain(existingUser);

    if (parsedIdUser === SYSTEM_ID_USER) {
      return {
        success: false,
        data: null,
        error: "No se puede eliminar el usuario del sistema",
        errorCode: "CANNOT_DELETE_SYSTEM_USER",
      };
    }

    const hasAssignedRoles =
      await UserRepository.hasAssignedRoles(parsedIdUser);

    if (hasAssignedRoles) {
      return {
        success: false,
        data: null,
        error: "No se puede eliminar el usuario porque tiene roles asignados",
        errorCode: "USER_HAS_ASSIGNED_ROLES",
      };
    }

    if (mappedUser.idStatus !== INACTIVE_ID_STATUS) {
      return {
        success: false,
        data: null,
        error: "El usuario debe estar inactivo para poder ser eliminado",
        errorCode: "USER_STILL_ACTIVE",
      };
    }

    const relationsTransferred = {
      clients: 0,
      employees: 0,
      access: 0,
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

        await tx.users.delete({
          where: { id_user: parsedIdUser },
        });
      });

    } catch (txError) {
      console.error("[DeleteUserUseCase] Transaction error:", txError.message);

      let errorCode = "TRANSFER_ERROR";
      let errorMsg = "Error al transferir relaciones: " + txError.message;

      if (txError.code === "P2025") {
        errorCode = "DATABASE_ERROR";
        errorMsg = "Registro no encontrado durante la eliminación";
      } else if (txError.code === "P2003") {
        errorCode = "TRANSFER_ERROR";
        errorMsg = "No se pueden transferir relaciones: restricciones de integridad";
      }

      return {
        success: false,
        data: null,
        error: errorMsg,
        errorCode,
      };
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
    console.error("[DeleteUserUseCase] Error:", error.message);

    return {
      success: false,
      data: null,
      error: "Error al eliminar usuario: " + error.message,
      errorCode: "DATABASE_ERROR",
    };
  }
};

export const delete_ = deleteUserUseCase;