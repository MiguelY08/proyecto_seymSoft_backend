export const toNotificationResponse = (notification) => {
  if (!notification) return null;

  return {
    id: notification.id_notification,
    idUser: notification.id_user,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    actionUrl: notification.action_url,
    isRead: notification.is_read,
    metadata: notification.metadata || null,
    createdAt: notification.created_at,
    updatedAt: notification.updated_at,
  };
};

export const toNotificationListResponse = (notifications = []) => {
  return notifications.map(toNotificationResponse);
};

