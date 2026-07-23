import { markAllNotificationsAsReadUseCase } from "../use-cases/index.js";

export const markAllAsReadController = async (req, res, next) => {
  try {
    const result = await markAllNotificationsAsReadUseCase(req.user.id_user);

    return res.status(200).json({
      success: true,
      message: "Notificaciones marcadas como leidas",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

