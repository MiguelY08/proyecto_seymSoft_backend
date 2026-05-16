import { UserRepository } from "../repositories/userRepository.js";
import { prisma } from "../../../config/prisma.js";

/**
 * DELETE USER CONTROLLER - ACTUALIZADO
 * 
 * Validaciones:
 * - Usuario debe existir
 * - Usuario NO puede ser empleado (no puede tener employee_roles)
 * - Si todo está bien, elimina el usuario
 * 
 * Códigos de error:
 * - USER_NOT_FOUND: Usuario no existe
 * - USER_IS_EMPLOYEE: Usuario es empleado y no se puede eliminar
 * - DATABASE_ERROR: Error en BD
 */
export const DeleteUserController = async (req, res) => {
  try {
    const { id } = req.params;

    // Validar ID
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "ID de usuario inválido.",
      });
    }

    const idUser = Number(id);

    // Verificar que el usuario existe
    const user = await UserRepository.findById(idUser);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado.",
        errorCode: "USER_NOT_FOUND",
      });
    }

    // ═══════════════════════════════════════════════════════════
    // VALIDAR QUE NO SEA EMPLEADO
    // ═══════════════════════════════════════════════════════════

    const employee = await prisma.employees.findUnique({
      where: { id_user: idUser },
      include: { employee_roles: true },
    });

    // Si tiene employee_roles, es un empleado y NO se puede eliminar
    if (employee && employee.employee_roles && employee.employee_roles.length > 0) {
      return res.status(400).json({
        success: false,
        message: "No se puede eliminar un usuario que es empleado. Primero debe remover el rol.",
        errorCode: "USER_IS_EMPLOYEE",
      });
    }

    // ═══════════════════════════════════════════════════════════
    // ELIMINAR USUARIO
    // ═══════════════════════════════════════════════════════════

    try {
      // Primero eliminar tokens de sesión asociados
      await prisma.refresh_tokens.deleteMany({
        where: { id_user: idUser },
      });

      // Eliminar password resets asociados
      await prisma.password_resets.deleteMany({
        where: { id_user: idUser },
      });

      // Eliminar access logs del usuario (opcional, para auditoría)
      // await prisma.access_logs.deleteMany({
      //   where: { id_user: idUser },
      // });

      // Finalmente, eliminar el usuario
      await UserRepository.delete(idUser);

      return res.status(200).json({
        success: true,
        message: "Usuario eliminado exitosamente.",
      });

    } catch (error) {
      console.error("[DeleteUserController] Error al eliminar:", error);

      return res.status(500).json({
        success: false,
        message: "Error al eliminar el usuario.",
        errorCode: "DATABASE_ERROR",
        error: error.message,
      });
    }

  } catch (error) {
    console.error("[DeleteUserController] Error:", error);

    return res.status(500).json({
      success: false,
      message: "Error al procesar la eliminación.",
      error: error.message,
    });
  }
};