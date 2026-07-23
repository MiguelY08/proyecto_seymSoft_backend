import { AppError } from "../../../shared/errors/appError.js";
import { notificationRepository } from "../repositories/notificationRepository.js";

export const markNotificationAsReadUseCase = async (idNotification, idUser) => {
  const notification = await notificationRepository.findByIdForUser(
    idNotification,
    idUser,
  );

  if (!notification) {
    throw new AppError("Notificacion no encontrada", 404);
  }

  if (notification.isRead) {
    return notification;
  }

  return notificationRepository.markAsRead(idNotification, idUser);
};

