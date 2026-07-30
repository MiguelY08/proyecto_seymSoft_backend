import { deleteNotificationUseCase } from "../use-cases/index.js";
import { notificationIdSchema } from "../validators/index.js";

export const deleteNotificationController = async (req, res, next) => {
  try {
    const { id } = notificationIdSchema.parse(req.params);
    const notification = await deleteNotificationUseCase(id, req.user.id_user);

    return res.status(200).json({
      success: true,
      message: "Notificacion eliminada exitosamente",
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};

