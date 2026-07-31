import { prisma } from '../../../../config/prisma.js';
import { notificationService } from '../../../notifications/services/index.js';
import { findAdminUsers } from '../../../notifications/services/adminNotificationService.js';

const ADMIN_RETURN_URL = '/admin/sales/returns-s';
const CUSTOMER_RETURN_URL = '/returnsOnOrders';

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

const summarizeProducts = (events = []) => {
  const products = events
    .map((event) => {
      const quantity = Number(event.quantity || 0);
      const productName = event.productName || 'Producto';
      return `${productName}${quantity > 0 ? ` x${quantity}` : ''}`;
    })
    .filter(Boolean);

  if (products.length === 0) return 'productos de la devolución';
  if (products.length <= 2) return products.join(', ');
  return `${products.slice(0, 2).join(', ')} y ${products.length - 2} producto(s) más`;
};

const getActorUser = async (actorUserId) => {
  if (!actorUserId) return null;

  return prisma.users.findUnique({
    where: { id_user: Number(actorUserId) },
    select: { id_user: true, full_name: true },
  });
};

const getReturnNotificationContext = async (returnId, actorUserId) => {
  const [saleReturn, adminUsers, actorUser] = await Promise.all([
    prisma.sales_returns.findUnique({
      where: { id_sales_return: Number(returnId) },
      include: {
        sales: {
          include: {
            sales_orders: {
              include: {
                clients: {
                  include: {
                    users: {
                      select: {
                        id_user: true,
                        full_name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    }),
    findAdminUsers(),
    getActorUser(actorUserId),
  ]);

  const client = saleReturn?.sales?.sales_orders?.clients;

  return {
    saleReturn,
    adminUsers,
    actorUser,
    clientUser: client?.users || null,
  };
};

const sendNotifications = async (recipients) => {
  const notifications = [...recipients.values()];
  await Promise.all(
    notifications.map((notification) => notificationService.create(notification))
  );
};

export const salesReturnNotificationService = {
  async notifyCreditApplied({ events = [], actorUserId = null }) {
    try {
      if (!events.length) return [];

      const returnId = events[0].returnId;
      const context = await getReturnNotificationContext(returnId, actorUserId);
      const returnNumber = events[0].returnNumber || context.saleReturn?.return_number || `#${returnId}`;
      const totalAmount = events.reduce((total, event) => total + Number(event.amount || 0), 0);
      const amountText = formatMoney(totalAmount);
      const clientName = context.clientUser?.full_name || 'el cliente';
      const actorName = context.actorUser?.full_name || events[0].processedBy || 'Un usuario';
      const productsText = summarizeProducts(events);
      const adminActionUrl = `${ADMIN_RETURN_URL}?returnId=${returnId}`;

      const metadata = {
        module: 'sales_returns',
        event: 'credit_balance_applied',
        saleReturnId: Number(returnId),
        returnNumber,
        amount: totalAmount,
        products: events.map((event) => ({
          detailId: event.detailId,
          productName: event.productName,
          quantity: event.quantity,
          amount: event.amount,
        })),
        longMessage: `Se aplicó un saldo a favor de ${amountText} al cliente ${clientName} por ${productsText} de la devolución ${returnNumber}. Procesado por ${actorName}.`,
      };

      const recipients = new Map();

      context.adminUsers.forEach((adminUser) => {
        addRecipient(recipients, adminUser.id_user, {
          title: 'Saldo a favor aplicado',
          message: `${actorName} aplicó ${amountText} de saldo a favor a ${clientName}.`,
          type: 'credit',
          actionUrl: adminActionUrl,
          metadata,
        });
      });

      if (context.actorUser) {
        addRecipient(recipients, context.actorUser.id_user, {
          title: 'Saldo a favor aplicado',
          message: `Aplicaste ${amountText} de saldo a favor a ${clientName}.`,
          type: 'credit',
          actionUrl: adminActionUrl,
          metadata: {
            ...metadata,
            event: 'credit_balance_applied_by_me',
          },
        });
      }

      if (context.clientUser) {
        addRecipient(recipients, context.clientUser.id_user, {
          title: 'Saldo a favor recibido',
          message: `Se agregó ${amountText} a tu saldo a favor por la devolución ${returnNumber}.`,
          type: 'credit',
          actionUrl: CUSTOMER_RETURN_URL,
          metadata: {
            ...metadata,
            event: 'credit_balance_applied_to_me',
            longMessage: `Se agregó ${amountText} a tu saldo a favor por ${productsText} de la devolución ${returnNumber}.`,
          },
        });
      }

      await sendNotifications(recipients);
      return [...recipients.values()];
    } catch (error) {
      console.error('[SalesReturnNotificationService] Credit applied notification error:', error.message);
      return [];
    }
  },

  async notifyCreditReversed({ events = [], actorUserId = null, cancellationReason = '' }) {
    try {
      if (!events.length) return [];

      const returnId = events[0].returnId;
      const context = await getReturnNotificationContext(returnId, actorUserId);
      const returnNumber = events[0].returnNumber || context.saleReturn?.return_number || `#${returnId}`;
      const totalAmount = events.reduce((total, event) => total + Number(event.amount || 0), 0);
      const amountText = formatMoney(totalAmount);
      const clientName = context.clientUser?.full_name || 'el cliente';
      const actorName = context.actorUser?.full_name || 'Un usuario';
      const productsText = summarizeProducts(events);
      const adminActionUrl = `${ADMIN_RETURN_URL}?returnId=${returnId}`;

      const metadata = {
        module: 'sales_returns',
        event: 'credit_balance_reversed',
        saleReturnId: Number(returnId),
        returnNumber,
        amount: totalAmount,
        cancellationReason,
        products: events.map((event) => ({
          detailId: event.detailId,
          productName: event.productName,
          quantity: event.quantity,
          amount: event.amount,
        })),
        longMessage: `Se revirtió el saldo a favor de ${amountText} del cliente ${clientName} porque se anuló la devolución ${returnNumber}. Productos: ${productsText}. Motivo: ${cancellationReason || 'Sin motivo adicional'}. Anulado por ${actorName}.`,
      };

      const recipients = new Map();

      context.adminUsers.forEach((adminUser) => {
        addRecipient(recipients, adminUser.id_user, {
          title: 'Saldo a favor revertido',
          message: `${actorName} anuló ${returnNumber} y se revirtió ${amountText} de saldo a favor de ${clientName}.`,
          type: 'warning',
          actionUrl: adminActionUrl,
          metadata,
        });
      });

      if (context.actorUser) {
        addRecipient(recipients, context.actorUser.id_user, {
          title: 'Saldo a favor revertido',
          message: `Revertiste ${amountText} de saldo a favor al anular ${returnNumber}.`,
          type: 'warning',
          actionUrl: adminActionUrl,
          metadata: {
            ...metadata,
            event: 'credit_balance_reversed_by_me',
          },
        });
      }

      if (context.clientUser) {
        addRecipient(recipients, context.clientUser.id_user, {
          title: 'Saldo a favor revertido',
          message: `Se descontó ${amountText} de tu saldo a favor porque se anuló la devolución ${returnNumber}.`,
          type: 'warning',
          actionUrl: CUSTOMER_RETURN_URL,
          metadata: {
            ...metadata,
            event: 'credit_balance_reversed_to_me',
            longMessage: `Se descontó ${amountText} de tu saldo a favor porque se anuló la devolución ${returnNumber}. Motivo: ${cancellationReason || 'Sin motivo adicional'}.`,
          },
        });
      }

      await sendNotifications(recipients);
      return [...recipients.values()];
    } catch (error) {
      console.error('[SalesReturnNotificationService] Credit reversed notification error:', error.message);
      return [];
    }
  },
};
