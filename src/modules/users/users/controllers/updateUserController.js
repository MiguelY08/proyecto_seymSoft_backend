import { updateUserUseCase } from "../use-cases/index.js";
import { validateUpdateUser } from "../validators/index.js";
import { UserMapper } from "../mappers/usersMapper.js";

export const UpdateUserController = async (req, res) => {
  try {
    // Validar ID (parámetro)
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        message: "ID de usuario inválido.",
      });
    }

    const idUser = Number(id);

    // Validar datos con Zod
    const validation = validateUpdateUser(req.body);

    if (!validation.success) {
      return res.status(400).json({
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
          message: "Usuario no encontrado.",
        });
      }

      if (result.errorCode === "DUPLICATE_EMAIL") {
        return res.status(409).json({
          message: "El email ya está registrado.",
          errors: { email: "Email duplicado." },
        });
      }

      if (result.errorCode === "DUPLICATE_DOC_NUMBER") {
        return res.status(409).json({
          message: "El documento ya está registrado.",
          errors: { docNumber: "Documento duplicado." },
        });
      }

      if (result.errorCode === "NO_DATA_TO_UPDATE") {
        return res.status(400).json({
          message: "Debe proporcionar al menos un campo para actualizar.",
        });
      }

      return res.status(500).json({
        message: result.error,
      });
    }

    // Mapear respuesta
    const responseUser = UserMapper.toResponse(result.data);

    return res.status(200).json({
      message: "Usuario actualizado exitosamente.",
      data: responseUser,
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Error actualizando el usuario.",
    });
  }
};