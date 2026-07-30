import { NOTIFICATION_TYPES } from "../constants/notificationTypes.js";

export class CreateNotificationDto {
  constructor({
    idUser,
    title,
    message,
    type = NOTIFICATION_TYPES.INFO,
    actionUrl = null,
    metadata = null,
  }) {
    this.idUser = Number(idUser);
    this.title = title;
    this.message = message;
    this.type = type;
    this.actionUrl = actionUrl;
    this.metadata = metadata;
  }
}

