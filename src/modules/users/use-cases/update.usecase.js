import { UserRepository } from "../repositories/userRepository.js";
import { prisma } from "../../../config/prisma.js";

const SYSTEM_ID_USER = 999999999;

/**
 * Use-Case: Actualizar usuario
 * 
 * Responsabilidades:
 * - Aplicar lógica de negocio
 * - Validar que el usuario existe
 * - Validar duplicados de email (si se actualiza)
 * - Actualizar solo los campos especificados
 * - Manejar asignación/eliminación de roles
 * - Retornar usuario actualizado con rol y permisos
 * 
 * Reglas de negocio:
 * - Si id_role es número: crear/actualizar employee y asignar rol
 * - Si id_role es null: eliminar employee y employee_roles
 * - Si id_role NO viene: no cambiar el rol
 * - No se puede actualizar: id, creationDate, password
 * 
 * @param {Object} params
 * @param {number} params.idUser - ID del usuario a actualizar
 * @param {Object} params.updateData - Datos a actualizar
 * @param {string} params.updateData.fullName - Nombre completo (opcional)
 * @param {string} params.updateData.email - Email (opcional)
 * @param {number} params.updateData.phone - Teléfono (opcional)
 * @param {number} params.updateData.id_role - ID del rol (opcional, null para eliminar)
 */
export const updateUserUseCase = async (params) => {
  try {
    const { idUser, updateData } = params;

    // Validar idUser
    if (!idUser || isNaN(idUser) || idUser < 1) {
      return {
        success: false,
        data: null,
        error: "ID de usuario inválido",
        errorCode: "VALIDATION_ERROR",
      };
    }

    const parsedIdUser = Number(idUser);

    // Validar que updateData no esté vacío
    if (!updateData || Object.keys(updateData).length === 0) {
      return {
        success: false,
        data: null,
        error: "Debe proporcionar al menos un campo para actualizar",
        errorCode: "NO_DATA_TO_UPDATE",
      };
    }

    // Buscar usuario existente
    const existingUser = await UserRepository.findById(parsedIdUser);

    if (!existingUser) {
      return {
        success: false,
        data: null,
        error: "Usuario no encontrado",
        errorCode: "USER_NOT_FOUND",
      };
    }

    // Prevenir actualización del usuario del sistema
    if (parsedIdUser === SYSTEM_ID_USER) {
      return {
        success: false,
        data: null,
        error: "No se puede actualizar el usuario del sistema",
        errorCode: "CANNOT_UPDATE_SYSTEM_USER",
      };
    }

    // Validar email único (si se está actualizando)
    if (updateData.email) {
      const existingEmail = await UserRepository.findByEmail(updateData.email);

      if (existingEmail && existingEmail.id_user !== parsedIdUser) {
        return {
          success: false,
          data: null,
          error: "El email ya está registrado",
          errorCode: "DUPLICATE_EMAIL",
        };
      }
    }

    // Separar datos de usuario y rol
    const { id_role, ...userUpdateData } = updateData;

    // Actualizar datos del usuario
    const updatedUser = await UserRepository.update(parsedIdUser, userUpdateData);

    if (!updatedUser) {
      return {
        success: false,
        data: null,
        error: "Error al actualizar el usuario",
        errorCode: "DATABASE_ERROR",
      };
    }

    // ═══════════════════════════════════════════════════════════
    // MANEJAR CAMBIOS DE ROL
    // ═══════════════════════════════════════════════════════════

    if (id_role !== undefined) {
      try {
        // Obtener employee actual
        let employee = await prisma.employees.findUnique({
          where: { id_user: parsedIdUser },
          include: { employee_roles: true },
        });

        if (id_role === null) {
          // ✅ CASO 1: Eliminar rol (id_role = null)
          // Eliminar employee_roles primero (FK constraint)
          if (employee && employee.employee_roles) {
            await prisma.employee_roles.deleteMany({
              where: { id_employee: employee.id_employee },
            });
          }

          // Luego eliminar employee
          if (employee) {
            await prisma.employees.delete({
              where: { id_employee: employee.id_employee },
            });
          }

        } else {
          // ✅ CASO 2: Asignar nuevo rol (id_role = número)

          // Validar que el rol existe
          const roleExists = await prisma.roles.findUnique({
            where: { id_role },
          });

          if (!roleExists) {
            return {
              success: false,
              data: null,
              error: `El rol con ID ${id_role} no existe`,
              errorCode: "ROLE_NOT_FOUND",
            };
          }

          // Crear employee si no existe
          if (!employee) {
            employee = await prisma.employees.create({
              data: {
                id_user: parsedIdUser,
                id_status: 1, // Activo por defecto
              },
              include: { employee_roles: true },
            });
          }

          // Eliminar employee_roles anteriores
          await prisma.employee_roles.deleteMany({
            where: { id_employee: employee.id_employee },
          });

          // Obtener el PRIMER assigned_permission del nuevo rol
          // (Según la estructura: 1 employee_role → 1 assigned_permission)
          const rolePermission = await prisma.assigned_permissions.findFirst({
            where: { id_role },
          });

          if (!rolePermission) {
            return {
              success: false,
              data: null,
              error: `El rol con ID ${id_role} no tiene permisos asignados`,
              errorCode: "ROLE_NO_PERMISSIONS",
            };
          }

          // Crear nuevo employee_roles con ese assigned_permission
          await prisma.employee_roles.create({
            data: {
              id_employee: employee.id_employee,
              id_assigned_permission: rolePermission.id_permission,
            },
          });
        }

      } catch (error) {
        console.error("[UpdateUserUseCase] Error al manejar rol:", error);
        return {
          success: false,
          data: null,
          error: `Error al actualizar el rol: ${error.message}`,
          errorCode: "ROLE_UPDATE_ERROR",
        };
      }
    }

    // Obtener usuario actualizado con rol y permisos
    const userWithRole = await UserRepository.getUserWithRole(parsedIdUser);

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
    console.error("[UpdateUserUseCase] Error:", error.message);

    let errorCode = "DATABASE_ERROR";
    if (error.code === "P2002") {
      const field = error.meta?.target?.[0];
      if (field === "email") {
        errorCode = "DUPLICATE_EMAIL";
      }
    }

    return {
      success: false,
      data: null,
      error: "Error al actualizar usuario: " + error.message,
      errorCode,
    };
  }
};

export const update = updateUserUseCase;