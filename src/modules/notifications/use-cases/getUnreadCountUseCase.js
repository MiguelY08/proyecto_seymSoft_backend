import { notificationRepository } from "../repositories/notificationRepository.js";

export const getUnreadCountUseCase = async (idUser) => {
  return notificationRepository.countUnreadByUser(idUser);
};

