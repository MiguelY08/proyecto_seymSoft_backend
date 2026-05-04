import { updateUserStatusUseCase } from "../use-cases/index.js";
import { validateUpdateUserStatus } from "../validators/index.js";
import { UserMapper } from "../mappers/usersMapper.js";

export const UpdateUserStatusController = async (req, res) => {
  try {
    // Validar ID (parámetro)
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        message: "ID de usuario inválido.",
      });
    }

    const userId = Number(id);

    // Validar statusId con Zod
    const validation = validateUpdateUserStatus(req.body);

    if (!validation.success) {
      return res.status(400).json({
        message: "Errores de validación.",
        errors: validation.errors,
      });
    }

    const validatedData = validation.data;

    // Ejecutar use-case
    const result = await updateUserStatusUseCase({
      userId,
      statusId: validatedData.statusId,
    });

    // Validar resultado del use-case
    if (!result.success) {
      return res.status(400).json({
        message: result.error,
      });
    }

    // Mapear respuesta
    const responseUser = UserMapper.toResponse(result.data);

    return res.status(200).json({
      message: "Estado del usuario actualizado exitosamente.",
      data: responseUser,
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Error actualizando el estado.",
    });
  }
};