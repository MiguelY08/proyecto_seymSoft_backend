import { deleteUserUseCase } from "../use-cases/index.js";
import { validateDeleteUser } from "../validators/index.js";

export const DeleteUserController = async (req, res) => {
  try {
    // Validar ID (parámetro)
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        message: "ID de usuario inválido.",
      });
    }

    const userId = Number(id);

    // Validar body con Zod (debe estar vacío)
    const validation = validateDeleteUser(req.body);

    if (!validation.success) {
      return res.status(400).json({
        message: "Errores de validación.",
        errors: validation.errors,
      });
    }

    // Ejecutar use-case
    const result = await deleteUserUseCase(userId);

    // Manejar diferentes tipos de error
    if (!result.success) {
      if (result.errorCode === "USER_NOT_FOUND") {
        return res.status(404).json({
          message: "Usuario no encontrado.",
        });
      }

      if (result.errorCode === "USER_STILL_ACTIVE") {
        return res.status(400).json({
          message: "El usuario debe estar inactivo para poder ser eliminado.",
        });
      }

      if (result.errorCode === "CANNOT_DELETE_SYSTEM_USER") {
        return res.status(400).json({
          message: "No se puede eliminar el usuario del sistema.",
        });
      }

      if (result.errorCode === "TRANSFER_ERROR") {
        return res.status(409).json({
          message: "Error al transferir relaciones del usuario.",
        });
      }

      return res.status(500).json({
        message: result.error,
      });
    }

    return res.status(200).json({
      message: "Usuario eliminado exitosamente.",
      data: {
        deletedUserId: result.data.deletedUserId,
        relationsTransferred: result.data.relationsTransferred,
      },
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Error eliminando el usuario.",
    });
  }
};