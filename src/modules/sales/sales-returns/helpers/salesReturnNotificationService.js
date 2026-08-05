import { prisma } from '../../../../config/prisma.js';
import { notificationService } from '../../../notifications/services/index.js';
import { findAdminUsers } from '../../../notifications/services/adminNotificationService.js';

const ADMIN_RETURN_URL = '/admin/sales/returns-s';
const CUSTOMER_RETURN_URL = '/returnsOnOrders';

const READY_STATUS = 'Listo';
const ADMIN_PURCHASE_RETURN_URL = '/admin/purchases/returns';
const ADMIN_NON_CONFORMING_URL = '/admin/purchases/non-conforming-products';

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

const getProductName = (detail, fallback = 'Producto') =>
  detail?.barcodes?.products?.name ||
  detail?.barcodes?.products?.name_product ||
  detail?.productName ||
  fallback;

const normalizeReturnNumber = (saleReturn, returnId) =>
  saleReturn?.return_number || `#${returnId}`;

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

  async notifyReturnCancelled({ returnId, actorUserId = null, cancellationReason = '' }) {
    try {
      const context = await getReturnNotificationContext(returnId, actorUserId);
      if (!context.saleReturn) return [];

      const returnNumber = normalizeReturnNumber(context.saleReturn, returnId);
      const clientName = context.clientUser?.full_name || 'el cliente';
      const actorName = context.actorUser?.full_name || 'Un usuario';
      const adminActionUrl = `${ADMIN_RETURN_URL}?returnId=${returnId}`;

      const metadata = {
        module: 'sales_returns',
        event: 'sale_return_cancelled',
        saleReturnId: Number(returnId),
        returnNumber,
        cancellationReason,
        longMessage: `${actorName} anuló la devolución de venta ${returnNumber} del cliente ${clientName}. Motivo: ${cancellationReason || 'Sin motivo adicional'}.`,
      };

      const recipients = new Map();

      context.adminUsers.forEach((adminUser) => {
        addRecipient(recipients, adminUser.id_user, {
          title: 'Devolución de venta anulada',
          message: `${actorName} anuló la devolución ${returnNumber} de ${clientName}.`,
          type: 'warning',
          actionUrl: adminActionUrl,
          metadata,
        });
      });

      if (context.actorUser) {
        addRecipient(recipients, context.actorUser.id_user, {
          title: 'Devolución anulada',
          message: `Anulaste la devolución ${returnNumber}.`,
          type: 'warning',
          actionUrl: adminActionUrl,
          metadata: {
            ...metadata,
            event: 'sale_return_cancelled_by_me',
          },
        });
      }

      if (context.clientUser) {
        addRecipient(recipients, context.clientUser.id_user, {
          title: 'Tu devolución fue anulada',
          message: `La devolución ${returnNumber} fue anulada.`,
          type: 'warning',
          actionUrl: CUSTOMER_RETURN_URL,
          metadata: {
            ...metadata,
            event: 'sale_return_cancelled_to_me',
            longMessage: `La devolución ${returnNumber} fue anulada. Motivo: ${cancellationReason || 'Sin motivo adicional'}.`,
          },
        });
      }

      await sendNotifications(recipients);
      return [...recipients.values()];
    } catch (error) {
      console.error('[SalesReturnNotificationService] Return cancelled notification error:', error.message);
      return [];
    }
  },

  async notifyReadyDetails({ returnId, events = [], actorUserId = null }) {
    try {
      if (!events.length) return [];

      const context = await getReturnNotificationContext(returnId, actorUserId);
      if (!context.saleReturn) return [];

      const returnNumber = normalizeReturnNumber(context.saleReturn, returnId);
      const clientName = context.clientUser?.full_name || 'el cliente';
      const actorName = context.actorUser?.full_name || 'Un usuario';
      const productsText = summarizeProducts(events);
      const adminActionUrl = `${ADMIN_RETURN_URL}?returnId=${returnId}`;

      const metadata = {
        module: 'sales_returns',
        event: 'sale_return_products_ready',
        saleReturnId: Number(returnId),
        returnNumber,
        status: READY_STATUS,
        products: events,
        longMessage: `${actorName} marcó como Listo ${productsText} de la devolución ${returnNumber} del cliente ${clientName}.`,
      };

      const recipients = new Map();

      context.adminUsers.forEach((adminUser) => {
        addRecipient(recipients, adminUser.id_user, {
          title: 'Producto listo en devolución',
          message: `${productsText} quedó en estado Listo en ${returnNumber}.`,
          type: 'success',
          actionUrl: adminActionUrl,
          metadata,
        });
      });

      if (context.actorUser) {
        addRecipient(recipients, context.actorUser.id_user, {
          title: 'Estado actualizado',
          message: `Marcaste como Listo ${productsText}.`,
          type: 'success',
          actionUrl: adminActionUrl,
          metadata: {
            ...metadata,
            event: 'sale_return_products_ready_by_me',
          },
        });
      }

      if (context.clientUser) {
        addRecipient(recipients, context.clientUser.id_user, {
          title: 'Producto listo',
          message: `${productsText} ya está listo en tu devolución ${returnNumber}.`,
          type: 'success',
          actionUrl: CUSTOMER_RETURN_URL,
          metadata: {
            ...metadata,
            event: 'sale_return_products_ready_to_me',
            longMessage: `${productsText} ya está listo en tu devolución ${returnNumber}. Puedes revisar el seguimiento desde tus devoluciones.`,
          },
        });
      }

      await sendNotifications(recipients);
      return [...recipients.values()];
    } catch (error) {
      console.error('[SalesReturnNotificationService] Ready details notification error:', error.message);
      return [];
    }
  },

  async notifyDefectiveResolution({
    saleReturnId,
    saleReturnDetailId,
    actorUserId = null,
    action,
    referenceId = null,
    quantity = 0,
    productName = '',
  }) {
    try {
      const context = await getReturnNotificationContext(saleReturnId, actorUserId);
      if (!context.saleReturn) return [];

      const detail = await prisma.sale_return_details.findUnique({
        where: { id_sale_return_detail: Number(saleReturnDetailId) },
        include: {
          barcodes: {
            include: {
              products: {
                select: { name: true },
              },
            },
          },
        },
      });

      const returnNumber = normalizeReturnNumber(context.saleReturn, saleReturnId);
      const actorName = context.actorUser?.full_name || 'Un usuario';
      const finalProductName = productName || getProductName(detail);
      const isPurchaseReturn = action === 'PURCHASE_RETURN';
      const title = isPurchaseReturn
        ? 'Devolución de compra generada'
        : 'Producto enviado a no conforme';
      const message = isPurchaseReturn
        ? `${actorName} generó una devolución de compra desde ${returnNumber}.`
        : `${actorName} envió ${finalProductName} a producto no conforme.`;
      const actionUrl = isPurchaseReturn
        ? `${ADMIN_PURCHASE_RETURN_URL}${referenceId ? `?returnId=${referenceId}` : ''}`
        : `${ADMIN_NON_CONFORMING_URL}${referenceId ? `?ncpId=${referenceId}` : ''}`;

      const metadata = {
        module: 'sales_returns',
        event: isPurchaseReturn
          ? 'purchase_return_created_from_sale_return'
          : 'non_conforming_created_from_sale_return',
        saleReturnId: Number(saleReturnId),
        saleReturnDetailId: Number(saleReturnDetailId),
        returnNumber,
        referenceId,
        productName: finalProductName,
        quantity: Number(quantity || detail?.quantity || 0),
        longMessage: isPurchaseReturn
          ? `${actorName} generó una devolución de compra desde la devolución de venta ${returnNumber}. Producto: ${finalProductName}. Cantidad: ${Number(quantity || detail?.quantity || 0)}.`
          : `${actorName} envió el producto ${finalProductName} a producto no conforme desde la devolución de venta ${returnNumber}. Cantidad: ${Number(quantity || detail?.quantity || 0)}.`,
      };

      const recipients = new Map();
      context.adminUsers.forEach((adminUser) => {
        addRecipient(recipients, adminUser.id_user, {
          title,
          message,
          type: isPurchaseReturn ? 'purchase' : 'stock',
          actionUrl,
          metadata,
        });
      });

      if (context.actorUser) {
        addRecipient(recipients, context.actorUser.id_user, {
          title,
          message: isPurchaseReturn
            ? `Generaste una devolución de compra desde ${returnNumber}.`
            : `Enviaste ${finalProductName} a producto no conforme.`,
          type: isPurchaseReturn ? 'purchase' : 'stock',
          actionUrl,
          metadata: {
            ...metadata,
            event: `${metadata.event}_by_me`,
          },
        });
      }

      await sendNotifications(recipients);
      return [...recipients.values()];
    } catch (error) {
      console.error('[SalesReturnNotificationService] Defective resolution notification error:', error.message);
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
