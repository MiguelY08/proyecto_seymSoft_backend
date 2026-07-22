import { markNotificationAsReadUseCase } from "../use-cases/index.js";
import { notificationIdSchema } from "../validators/index.js";

export const markAsReadController = async (req, res, next) => {
  try {
    const { id } = notificationIdSchema.parse(req.params);
    const notification = await markNotificationAsReadUseCase(
      id,
      req.user.id_user,
    );

    return res.status(200).json({
      success: true,
      message: "Notificacion marcada como leida",
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};

