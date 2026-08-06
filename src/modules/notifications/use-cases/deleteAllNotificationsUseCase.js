import { notificationRepository } from "../repositories/notificationRepository.js";

export const deleteAllNotificationsUseCase = async (idUser) => {
  return notificationRepository.deleteAll(idUser);
};
