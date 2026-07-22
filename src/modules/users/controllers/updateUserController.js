import { updateUserUseCase } from "../use-cases/index.js";
import { validateUpdateUser } from "../validators/index.js";
import { UserMapper } from "../mappers/usersMapper.js";
import { isSelfUserAction } from "../helpers/selfUserAction.js";

export const UpdateUserController = async (req, res) => {
  try {
    // Validar ID (parámetro)
    const { id } = req.params;
 
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "ID de usuario inválido.",
      });
    }
 
    const idUser = Number(id);

    if (isSelfUserAction({ authUser: req.user, targetUserId: idUser })) {
      return res.status(403).json({
        success: false,
        message:
          "No puedes editar tu propio usuario desde el módulo de usuarios. Usa la sección de perfil.",
        errorCode: "SELF_USER_UPDATE_NOT_ALLOWED",
      });
    }
 
    // Validar datos con Zod
    const validation = validateUpdateUser(req.body);
 
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Errores de validación.",
        errors: validation.errors,
      });
    }
 
    const validatedData = validation.data;
 
    // Ejecutar use-case
    const result = await updateUserUseCase({
      idUser,
      updateData: validatedData,
    });
 
    // Manejar diferentes tipos de error
    if (!result.success) {
      if (result.errorCode === "USER_NOT_FOUND") {
        return res.status(404).json({
          success: false,
          message: "Usuario no encontrado.",
        });
      }
 
      if (result.errorCode === "DUPLICATE_EMAIL") {
        return res.status(409).json({
          success: false,
          message: "El email ya está registrado.",
          errors: { email: "Email duplicado." },
        });
      }
 
      if (result.errorCode === "NO_DATA_TO_UPDATE") {
        return res.status(400).json({
          success: false,
          message: "Debe proporcionar al menos un campo para actualizar.",
        });
      }
 
      if (result.errorCode === "ROLE_NOT_FOUND") {
        return res.status(404).json({
          success: false,
          message: result.error,
        });
      }
 
      if (result.errorCode === "ROLE_NO_PERMISSIONS") {
        return res.status(400).json({
          success: false,
          message: result.error,
        });
      }
 
      if (result.errorCode === "ROLE_UPDATE_ERROR") {
        return res.status(500).json({
          success: false,
          message: result.error,
        });
      }
 
      return res.status(500).json({
        success: false,
        message: result.error,
      });
    }
 
    // ✅ Retornar con user, role y permissions
    return res.status(200).json({
      success: true,
      message: "Usuario actualizado exitosamente.",
      data: {
        user: result.data,
        role: result.data.role,
        permissions: result.data.permissions,
      },
    });
 
  } catch (error) {
    console.error("[UpdateUserController] Error:", error);
 
    return res.status(500).json({
      success: false,
      message: "Error actualizando el usuario.",
      error: error.message,
    });
  }
};
