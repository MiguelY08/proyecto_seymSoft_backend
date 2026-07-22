import { getAllUsersUseCase } from "../use-cases/index.js";
import { validateGetUsers } from "../validators/index.js";
import { UserMapper } from "../mappers/usersMapper.js";
import { isSelfUserAction } from "../helpers/selfUserAction.js";

export const GetUsersController = async (req, res) => {
  try {
    // Validar query parameters con Zod
    const validation = validateGetUsers(req.query);

    if (!validation.success) {
      return res.status(400).json({
        message: "Errores de validación.",
        errors: validation.errors,
      });
    }

    // Obtener filtros validados
    const filters = validation.data;

    // Ejecutar use-case con filtros
    const result = await getAllUsersUseCase(filters);

    // Validar resultado del use-case
    if (!result.success) {
      return res.status(500).json({
        message: result.error,
      });
    }

    // Extraer datos del use-case
    const { users, total, page, limit, totalPages, hasNextPage, hasPrevPage } =
      result.data;

    // Mapear respuesta
    const responseUsers = users.map((user) => {
      const responseUser = UserMapper.toResponse(user);

      return {
        ...responseUser,
        isSelf: isSelfUserAction({
          authUser: req.user,
          targetUserId: responseUser?.id,
        }),
      };
    });

    // Construir respuesta con metadata
    return res.status(200).json({
      message: "Usuarios recuperados exitosamente.",
      data: responseUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Error recuperando los usuarios.",
    });
  }
};
