import { CreateNotificationDto } from "../dtos/createNotification.dto.js";
import { notificationRepository } from "../repositories/notificationRepository.js";
import { createNotificationSchema } from "../validators/index.js";

export const notificationService = {
  async create(data) {
    const payload = createNotificationSchema.parse(data);
    const dto = new CreateNotificationDto(payload);

    return notificationRepository.create(dto);
  },
};

