import { deleteAllNotificationsUseCase } from "../use-cases/index.js";

export const deleteAllNotificationsController = async (req, res, next) => {
  try {
    const result = await deleteAllNotificationsUseCase(req.user.id_user);

    return res.status(200).json({
      success: true,
      message: "Todas las notificaciones eliminadas exitosamente",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
