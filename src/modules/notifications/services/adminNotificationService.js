import { prisma } from "../../../config/prisma.js";
import { notificationService } from "./notificationService.js";

const ADMIN_ROLE_NAME = "Administrator";

export const findAdminUsers = async () => {
  return prisma.users.findMany({
    where: {
      id_status: 1,
      employees: {
        employee_roles: {
          roles: {
            name_role: ADMIN_ROLE_NAME,
          },
        },
      },
    },
    select: {
      id_user: true,
      full_name: true,
    },
  });
};

export const notifyAdmins = async (payload) => {
  const admins = await findAdminUsers();
  const notifications = [];

  for (const admin of admins) {
    if (!admin?.id_user) {
      continue;
    }

    const notification = await notificationService.create({
      idUser: admin.id_user,
      ...payload,
    });

    notifications.push(notification);
  }

  return notifications;
};
