import { getUserByIdUseCase } from "../use-cases/index.js";
import { validateGetUserById } from "../validators/index.js";
import { UserMapper } from "../mappers/usersMapper.js";

export const GetUserByIdController = async (req, res) => {
  try {
    // Validar ID (parámetro)
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        message: "ID de usuario inválido.",
      });
    }

    const idUser = Number(id);

    // Validar body con Zod (debe estar vacío)
    const validation = validateGetUserById(req.body);

    if (!validation.success) {
      return res.status(400).json({
        message: "Errores de validación.",
        errors: validation.errors,
      });
    }

    // Ejecutar use-case
    const result = await getUserByIdUseCase(idUser);

    // Validar resultado del use-case
    if (!result.success) {
      return res.status(500).json({
        message: result.error,
      });
    }

    // Usuario no encontrado
    if (!result.data) {
      return res.status(404).json({
        message: "Usuario no encontrado.",
      });
    }

    // Mapear respuesta
    const responseUser = UserMapper.toResponse(result.data);

    return res.status(200).json({
      message: "Usuario recuperado exitosamente.",
      data: responseUser,
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Error recuperando el usuario.",
    });
  }
};