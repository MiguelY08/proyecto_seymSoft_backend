import { getUnreadCountUseCase } from "../use-cases/index.js";

export const getUnreadCountController = async (req, res, next) => {
  try {
    const unreadCount = await getUnreadCountUseCase(req.user.id_user);

    return res.status(200).json({
      success: true,
      message: "Cantidad de notificaciones no leidas obtenida exitosamente",
      data: {
        unreadCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

