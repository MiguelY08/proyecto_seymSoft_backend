import { notificationRepository } from "../repositories/notificationRepository.js";

export const getNotificationsUseCase = async (idUser, filters) => {
  return notificationRepository.findByUser(idUser, filters);
};

