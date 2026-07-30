import { notificationRepository } from "../repositories/notificationRepository.js";

export const markAllNotificationsAsReadUseCase = async (idUser) => {
  const result = await notificationRepository.markAllAsRead(idUser);

  return {
    updatedCount: result.count,
  };
};

