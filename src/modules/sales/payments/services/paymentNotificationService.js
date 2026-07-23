import { notificationService } from "../../../notifications/services/index.js";

const ADMIN_ROLE_NAME = "administrator";

const formatMoney = (value) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(Number(value || 0));

const isAdmin = (user) =>
  user?.role?.name_role?.toLowerCase() === ADMIN_ROLE_NAME;

const addRecipient = (recipients, user, payload) => {
  if (!user?.id_user) return;

  recipients.set(user.id_user, {
    idUser: user.id_user,
    ...payload,
  });
};

const sendNotifications = async (recipients) => {
  const notifications = [...recipients.values()];

  await Promise.all(
    notifications.map((notification) =>
      notificationService.create(notification)
    )
  );
};

export const paymentNotificationService = {
  async notifyInstallmentCreated({
    paymentsRepository,
    idCredit,
    actorUserId,
    amount,
    idInstallment,
    remainingBalance,
  }) {
    try {
      const context =
        await paymentsRepository.getPaymentNotificationContext({
          id_credit: idCredit,
          actorUserId,
        });

      const recipients = new Map();
      const clientName =
        context.clientUser?.full_name || "el cliente";
      const actorName =
        context.actorUser?.full_name || "Un usuario";
      const amountText = formatMoney(amount);

      addRecipient(recipients, context.clientUser, {
        title: "Abono registrado",
        message: `Se registro un abono de ${amountText} a tu credito.`,
        type: "payment",
        actionUrl: "/orders",
        metadata: {
          module: "payments",
          idCredit,
          idInstallment,
          event: "installment_created",
        },
      });

      context.adminUsers.forEach((adminUser) => {
        addRecipient(recipients, adminUser, {
          title: "Abono registrado",
          message: `${actorName} registro un abono de ${amountText} a ${clientName}.`,
          type: "payment",
          actionUrl: "/admin/sales/payments-and-credits",
          metadata: {
            module: "payments",
            idCredit,
            idInstallment,
            actorUserId,
            event: "installment_created",
          },
        });
      });

      if (context.actorUser && !isAdmin(context.actorUser)) {
        addRecipient(recipients, context.actorUser, {
          title: "Abono registrado",
          message: `Registraste un abono de ${amountText} a ${clientName}.`,
          type: "payment",
          actionUrl: "/admin/sales/payments-and-credits",
          metadata: {
            module: "payments",
            idCredit,
            idInstallment,
            event: "installment_created_by_me",
          },
        });
      }

      await sendNotifications(recipients);

      if (Number(remainingBalance) <= 0) {
        await this.notifyCreditPaid({
          paymentsRepository,
          idCredit,
        });
      }
    } catch (error) {
      console.error(
        "[PaymentNotificationService] Installment created notification error:",
        error.message
      );
    }
  },

  async notifyCreditPaid({
    paymentsRepository,
    idCredit,
  }) {
    try {
      const context =
        await paymentsRepository.getPaymentNotificationContext({
          id_credit: idCredit,
        });

      const recipients = new Map();

      addRecipient(recipients, context.clientUser, {
        title: "Credito saldado",
        message: "Tu deuda fue pagada completamente.",
        type: "success",
        actionUrl: "/orders",
        metadata: {
          module: "payments",
          idCredit,
          event: "credit_paid",
        },
      });

      await sendNotifications(recipients);
    } catch (error) {
      console.error(
        "[PaymentNotificationService] Credit paid notification error:",
        error.message
      );
    }
  },

  async notifyInstallmentCancelled({
    paymentsRepository,
    idCredit,
    actorUserId,
    amount,
    idInstallment,
  }) {
    try {
      const context =
        await paymentsRepository.getPaymentNotificationContext({
          id_credit: idCredit,
          actorUserId,
        });

      const recipients = new Map();
      const clientName =
        context.clientUser?.full_name || "el cliente";
      const actorName =
        context.actorUser?.full_name || "Un usuario";
      const amountText = formatMoney(amount);

      addRecipient(recipients, context.clientUser, {
        title: "Abono anulado",
        message: `Se anulo un abono de ${amountText} asociado a tu credito.`,
        type: "warning",
        actionUrl: "/orders",
        metadata: {
          module: "payments",
          idCredit,
          idInstallment,
          event: "installment_cancelled",
        },
      });

      context.adminUsers.forEach((adminUser) => {
        addRecipient(recipients, adminUser, {
          title: "Abono anulado",
          message: `${actorName} anulo un abono de ${amountText} de ${clientName}.`,
          type: "warning",
          actionUrl: "/admin/sales/payments-and-credits",
          metadata: {
            module: "payments",
            idCredit,
            idInstallment,
            actorUserId,
            event: "installment_cancelled",
          },
        });
      });

      if (context.actorUser && !isAdmin(context.actorUser)) {
        addRecipient(recipients, context.actorUser, {
          title: "Abono anulado",
          message: `Anulaste un abono de ${amountText} de ${clientName}.`,
          type: "warning",
          actionUrl: "/admin/sales/payments-and-credits",
          metadata: {
            module: "payments",
            idCredit,
            idInstallment,
            event: "installment_cancelled_by_me",
          },
        });
      }

      await sendNotifications(recipients);
    } catch (error) {
      console.error(
        "[PaymentNotificationService] Installment cancelled notification error:",
        error.message
      );
    }
  },

  async notifyInterestGenerated({
    paymentsRepository,
    idCredit,
    actorUserId,
    generatedAmount,
    idInterest,
  }) {
    try {
      const context =
        await paymentsRepository.getPaymentNotificationContext({
          id_credit: idCredit,
          actorUserId,
        });

      const recipients = new Map();
      const clientName =
        context.clientUser?.full_name || "el cliente";
      const actorName =
        context.actorUser?.full_name || "Un usuario";
      const amountText = formatMoney(generatedAmount);

      addRecipient(recipients, context.clientUser, {
        title: "Interes generado",
        message: `Se genero un interes de ${amountText} sobre tu credito vencido.`,
        type: "credit",
        actionUrl: "/orders",
        metadata: {
          module: "payments",
          idCredit,
          idInterest,
          event: "interest_generated",
        },
      });

      context.adminUsers.forEach((adminUser) => {
        addRecipient(recipients, adminUser, {
          title: "Interes generado",
          message: `${actorName} genero un interes de ${amountText} a ${clientName}.`,
          type: "credit",
          actionUrl: "/admin/sales/payments-and-credits",
          metadata: {
            module: "payments",
            idCredit,
            idInterest,
            actorUserId,
            event: "interest_generated",
          },
        });
      });

      if (context.actorUser && !isAdmin(context.actorUser)) {
        addRecipient(recipients, context.actorUser, {
          title: "Interes generado",
          message: `Generaste un interes de ${amountText} a ${clientName}.`,
          type: "credit",
          actionUrl: "/admin/sales/payments-and-credits",
          metadata: {
            module: "payments",
            idCredit,
            idInterest,
            event: "interest_generated_by_me",
          },
        });
      }

      await sendNotifications(recipients);
    } catch (error) {
      console.error(
        "[PaymentNotificationService] Interest generated notification error:",
        error.message
      );
    }
  },

  async notifyCreditOverdue({
    paymentsRepository,
    idCredit,
    dueDate,
    remainingBalance,
  }) {
    try {
      const context =
        await paymentsRepository.getPaymentNotificationContext({
          id_credit: idCredit,
        });

      const recipients = new Map();
      const clientName =
        context.clientUser?.full_name || "el cliente";
      const remainingText =
        formatMoney(remainingBalance ?? context.credit?.remaining_balance);
      const dueDateText = dueDate
        ? new Intl.DateTimeFormat("es-CO").format(new Date(dueDate))
        : "la fecha pactada";

      addRecipient(recipients, context.clientUser, {
        title: "Credito vencido",
        message: `Tienes un credito vencido desde ${dueDateText} con saldo pendiente de ${remainingText}.`,
        type: "credit",
        actionUrl: "/orders",
        metadata: {
          module: "payments",
          idCredit,
          event: "credit_overdue",
        },
      });

      context.adminUsers.forEach((adminUser) => {
        addRecipient(recipients, adminUser, {
          title: "Credito vencido",
          message: `${clientName} tiene un credito vencido con saldo pendiente de ${remainingText}.`,
          type: "warning",
          actionUrl: "/admin/sales/payments-and-credits",
          metadata: {
            module: "payments",
            idCredit,
            event: "credit_overdue",
          },
        });
      });

      await sendNotifications(recipients);
    } catch (error) {
      console.error(
        "[PaymentNotificationService] Credit overdue notification error:",
        error.message
      );

      throw error;
    }
  },
};
