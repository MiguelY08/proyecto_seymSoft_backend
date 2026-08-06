import { prisma } from "../../../config/prisma.js";
import {
  toNotificationListResponse,
  toNotificationResponse,
} from "../mappers/notificationMapper.js";

export const notificationRepository = {
  async create(data) {
    const notification = await prisma.notifications.create({
      data: {
        id_user: data.idUser,
        title: data.title,
        message: data.message,
        type: data.type,
        action_url: data.actionUrl,
        metadata: data.metadata,
      },
    });

    return toNotificationResponse(notification);
  },

  async findByUser(idUser, filters = {}) {
    const {
      page = 1,
      limit = 20,
      type,
      isRead,
    } = filters;

    const parsedPage = Number(page);
    const parsedLimit = Number(limit);
    const skip = (parsedPage - 1) * parsedLimit;

    const where = {
      id_user: idUser,
      ...(type && { type }),
      ...(typeof isRead === "boolean" && { is_read: isRead }),
    };

    const [notifications, total] = await Promise.all([
      prisma.notifications.findMany({
        where,
        orderBy: {
          created_at: "desc",
        },
        skip,
        take: parsedLimit,
      }),
      prisma.notifications.count({ where }),
    ]);

    const totalPages = Math.ceil(total / parsedLimit);

    return {
      notifications: toNotificationListResponse(notifications),
      total,
      page: parsedPage,
      limit: parsedLimit,
      totalPages,
      hasNextPage: parsedPage < totalPages,
      hasPrevPage: parsedPage > 1,
    };
  },

  async countUnreadByUser(idUser) {
    return prisma.notifications.count({
      where: {
        id_user: idUser,
        is_read: false,
      },
    });
  },

  async findByIdForUser(idNotification, idUser) {
    const notification = await prisma.notifications.findFirst({
      where: {
        id_notification: idNotification,
        id_user: idUser,
      },
    });

    return toNotificationResponse(notification);
  },

  async markAsRead(idNotification, idUser) {
    const notification = await prisma.notifications.update({
      where: {
        id_notification: idNotification,
      },
      data: {
        is_read: true,
      },
    });

    return toNotificationResponse(notification);
  },

  async markAllAsRead(idUser) {
    return prisma.notifications.updateMany({
      where: {
        id_user: idUser,
        is_read: false,
      },
      data: {
        is_read: true,
      },
    });
  },

  async delete(idNotification, idUser) {
    const notification = await prisma.notifications.delete({
      where: {
        id_notification: idNotification,
      },
    });

    return toNotificationResponse(notification);
  },

  async deleteAll(idUser) {
    return prisma.notifications.deleteMany({
      where: {
        id_user: idUser,
      },
    });
  },
};
