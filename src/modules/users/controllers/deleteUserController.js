import { deleteUserUseCase } from "../use-cases/index.js";
import { isSelfUserAction } from "../helpers/selfUserAction.js";

export const DeleteUserController = async (req, res) => {
  try {
    // Obtener el id del usuario desde los parametros de la ruta
    const { id } = req.params;

    if (isSelfUserAction({ authUser: req.user, targetUserId: id })) {
      return res.status(403).json({
        success: false,
        message: "No puedes eliminar tu propio usuario.",
        errorCode: "SELF_USER_DELETE_NOT_ALLOWED",
      });
    }

    // Ejecutar el caso de uso encargado de validar y eliminar el usuario
    const result = await deleteUserUseCase(id);

    if (!result.success) {
      // Asociar cada error del caso de uso con su codigo HTTP correspondiente
      const statusCodeByError = {
        VALIDATION_ERROR: 400,
        USER_NOT_FOUND: 404,
        USER_STILL_ACTIVE: 409,
        CANNOT_DELETE_SYSTEM_USER: 403,
        USER_HAS_ASSIGNED_ROLES: 409,
        TRANSFER_ERROR: 409,
        DATABASE_ERROR: 500,
      };

      // Responder con el estado adecuado cuando la eliminacion no fue exitosa
      return res.status(statusCodeByError[result.errorCode] || 500).json({
        success: false,
        message: result.error,
        errorCode: result.errorCode,
      });
    }

    // Confirmar la eliminacion cuando el caso de uso finaliza correctamente
    return res.status(200).json({
      success: true,
      message: "Usuario eliminado exitosamente.",
      data: result.data,
    });

  } catch (error) {
    // Capturar errores inesperados del controlador
    console.error("[DeleteUserController] Error:", error);

    return res.status(500).json({
      success: false,
      message: "Error al procesar la eliminación.",
      error: error.message,
    });
  }
};
