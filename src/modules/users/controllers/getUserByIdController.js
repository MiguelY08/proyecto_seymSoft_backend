import { UserRepository } from "../repositories/userRepository.js";

/**
 * GET USER BY ID CONTROLLER - ACTUALIZADO
 * 
 * Retorna usuario con su rol y permisos (si es empleado)
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "user": {...},
 *     "role": {...} o null,
 *     "permissions": [...]
 *   }
 * }
 */
export const GetUserByIdController = async (req, res) => {
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

    // Obtener usuario con rol y permisos
    const result = await UserRepository.getUserWithRole(idUser);

    // Usuario no existe
    if (!result || !result.user) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado.",
      });
    }

    // Retornar con role y permissions
    return res.status(200).json({
      success: true,
      message: "Usuario obtenido exitosamente.",
      data: {
        user: result.user,
        role: result.role,
        permissions: result.permissions,
      },
    });

  } catch (error) {
    console.error("[GetUserByIdController] Error:", error);

    return res.status(500).json({
      success: false,
      message: "Error al obtener el usuario.",
      error: error.message,
    });
  }
};