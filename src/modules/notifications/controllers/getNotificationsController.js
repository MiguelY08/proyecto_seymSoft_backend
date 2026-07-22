import { getNotificationsUseCase } from "../use-cases/index.js";
import { getNotificationsSchema } from "../validators/index.js";

export const getNotificationsController = async (req, res, next) => {
  try {
    const filters = getNotificationsSchema.parse(req.query);
    const result = await getNotificationsUseCase(req.user.id_user, filters);

    const {
      notifications,
      total,
      page,
      limit,
      totalPages,
      hasNextPage,
      hasPrevPage,
    } = result;

    return res.status(200).json({
      success: true,
      message: "Notificaciones obtenidas exitosamente",
      data: notifications,
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
    next(error);
  }
};

