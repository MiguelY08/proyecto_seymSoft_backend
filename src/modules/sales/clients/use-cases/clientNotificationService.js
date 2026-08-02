import { prisma } from '../../../../config/prisma.js';
import { notificationService } from '../../../notifications/services/index.js';
import { findAdminUsers } from '../../../notifications/services/adminNotificationService.js';

const ADMIN_CLIENT_URL = '/admin/sales/clients';
const CUSTOMER_RETURNS_URL = '/returnsOnOrders';

const formatMoney = (value) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(Number(value || 0));

const addRecipient = (recipients, userId, payload) => {
  const idUser = Number(userId);
  if (!Number.isFinite(idUser) || idUser <= 0) return;
  recipients.set(idUser, { idUser, ...payload });
};

const getActorUser = async (actorUserId) => {
  if (!actorUserId) return null;

  return prisma.users.findUnique({
    where: { id_user: Number(actorUserId) },
    select: { id_user: true, full_name: true },
  });
};

const sendNotifications = async (recipients) => {
  const notifications = [...recipients.values()];
  await Promise.all(
    notifications.map((notification) => notificationService.create(notification))
  );
};

const toNumber = (value) => Number(value || 0);

export const clientNotificationService = {
  async notifyCommercialChanges({ before, after, actorUserId = null }) {
    try {
      if (!before || !after) return [];

      const [adminUsers, actorUser] = await Promise.all([
        findAdminUsers(),
        getActorUser(actorUserId),
      ]);

      const actorName = actorUser?.full_name || 'Un usuario';
      const clientName = after.fullName || before.fullName || 'Cliente';
      const clientId = after.id || before.id;
      const adminActionUrl = `${ADMIN_CLIENT_URL}?clientId=${clientId}`;
      const createdNotifications = [];

      const notifyAdminsAndActor = async ({ title, message, type, metadata }) => {
        const recipients = new Map();

        adminUsers.forEach((adminUser) => {
          addRecipient(recipients, adminUser.id_user, {
            title,
            message,
            type,
            actionUrl: adminActionUrl,
            metadata,
          });
        });

        if (actorUser) {
          addRecipient(recipients, actorUser.id_user, {
            title,
            message,
            type,
            actionUrl: adminActionUrl,
            metadata: {
              ...metadata,
              event: `${metadata.event}_by_me`,
            },
          });
        }

        await sendNotifications(recipients);
        createdNotifications.push(...recipients.values());
      };

      if (before.clientType !== after.clientType) {
        await notifyAdminsAndActor({
          title: 'Tipo de cliente actualizado',
          message: `${actorName} cambió el tipo de ${clientName} a ${after.clientType || 'Sin tipo'}.`,
          type: 'user',
          metadata: {
            module: 'clients',
            event: 'client_type_updated',
            clientId,
            before: before.clientType || 'Sin tipo',
            after: after.clientType || 'Sin tipo',
            longMessage: `${actorName} actualizó el tipo de cliente de ${clientName}: de ${before.clientType || 'Sin tipo'} a ${after.clientType || 'Sin tipo'}.`,
          },
        });
      }

      if (toNumber(before.clientCredit) !== toNumber(after.clientCredit)) {
        await notifyAdminsAndActor({
          title: 'Crédito de cliente actualizado',
          message: `${actorName} actualizó el crédito de ${clientName} a ${formatMoney(after.clientCredit)}.`,
          type: 'credit',
          metadata: {
            module: 'clients',
            event: 'client_credit_updated',
            clientId,
            before: toNumber(before.clientCredit),
            after: toNumber(after.clientCredit),
            longMessage: `${actorName} cambió el crédito de ${clientName}: de ${formatMoney(before.clientCredit)} a ${formatMoney(after.clientCredit)}.`,
          },
        });
      }

      if (toNumber(before.credit_balance) !== toNumber(after.credit_balance)) {
        const beforeBalance = toNumber(before.credit_balance);
        const afterBalance = toNumber(after.credit_balance);
        const delta = afterBalance - beforeBalance;
        const event = delta >= 0 ? 'client_credit_balance_added' : 'client_credit_balance_discounted';
        const title = delta >= 0 ? 'Saldo a favor agregado' : 'Saldo a favor descontado';
        const recipients = new Map();

        const metadata = {
          module: 'clients',
          event,
          clientId,
          before: beforeBalance,
          after: afterBalance,
          delta,
          longMessage: `${actorName} actualizó el saldo a favor de ${clientName}: de ${formatMoney(beforeBalance)} a ${formatMoney(afterBalance)}. Cambio: ${formatMoney(Math.abs(delta))}.`,
        };

        adminUsers.forEach((adminUser) => {
          addRecipient(recipients, adminUser.id_user, {
            title,
            message: `${actorName} dejó el saldo a favor de ${clientName} en ${formatMoney(afterBalance)}.`,
            type: 'credit',
            actionUrl: adminActionUrl,
            metadata,
          });
        });

        if (actorUser) {
          addRecipient(recipients, actorUser.id_user, {
            title,
            message: `Actualizaste el saldo a favor de ${clientName} a ${formatMoney(afterBalance)}.`,
            type: 'credit',
            actionUrl: adminActionUrl,
            metadata: {
              ...metadata,
              event: `${event}_by_me`,
            },
          });
        }

        if (after.idUser) {
          addRecipient(recipients, after.idUser, {
            title,
            message: `Tu saldo a favor ahora es de ${formatMoney(afterBalance)}.`,
            type: 'credit',
            actionUrl: CUSTOMER_RETURNS_URL,
            metadata: {
              ...metadata,
              event: `${event}_to_me`,
              longMessage: `Tu saldo a favor fue actualizado. Saldo anterior: ${formatMoney(beforeBalance)}. Saldo actual: ${formatMoney(afterBalance)}.`,
            },
          });
        }

        await sendNotifications(recipients);
        createdNotifications.push(...recipients.values());
      }

      return createdNotifications;
    } catch (error) {
      console.error('[ClientNotificationService] Commercial changes notification error:', error.message);
      return [];
    }
  },
};
