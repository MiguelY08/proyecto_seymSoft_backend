import { notificationService } from "../services/index.js";

export const createNotificationUseCase = async (data) => {
  return notificationService.create(data);
};

