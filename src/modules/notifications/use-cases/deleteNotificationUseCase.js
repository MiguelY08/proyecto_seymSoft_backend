import { AppError } from "../../../shared/errors/appError.js";
import { notificationRepository } from "../repositories/notificationRepository.js";

export const deleteNotificationUseCase = async (idNotification, idUser) => {
  const notification = await notificationRepository.findByIdForUser(
    idNotification,
    idUser,
  );

  if (!notification) {
    throw new AppError("Notificacion no encontrada", 404);
  }

  return notificationRepository.delete(idNotification, idUser);
};

