import nodemailer from "nodemailer";

const mailConfig = {
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT ? Number(process.env.EMAIL_PORT) : undefined,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
};

const transporter = nodemailer.createTransport(mailConfig);

const getEmailFrom = () => {
  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;

  if (!from) {
    throw new Error(
      "EMAIL_FROM or EMAIL_USER must be configured to send emails"
    );
  }

  return from;
};

const formatMoney = (value) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 2,
  }).format(Number(value || 0));

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleString("es-CO")
    : "No disponible";

const getName = (fullName) => fullName || "usuario";

const getFrontendUrl = () =>
  process.env.FRONTEND_URL || "http://localhost:3000";

const COLORS = {
  primary: "#004D77",
  primaryLight: "#DCEBF3",
  softGray: "#F3F4F6",
  white: "#FFFFFF",
  text: "#1F2937",
  muted: "#6B7280",
  dangerSoft: "#FDECEC",
  danger: "#B42318",
};

const renderActionLink = (href, label) => `
  <a href="${href}" style="display: inline-block; background: ${COLORS.primary}; color: ${COLORS.white}; text-decoration: none; padding: 10px 16px; border-radius: 4px; font-weight: 700; margin-top: 12px;">
    ${label}
  </a>
`;

const renderInfoCard = (content, options = {}) => `
  <div style="background: ${options.background || COLORS.softGray}; border-left: 4px solid ${options.borderColor || COLORS.primary}; padding: 14px 16px; margin: 18px 0; border-radius: 4px;">
    ${content}
  </div>
`;

const sendMail = async ({ to, subject, text, html }) => {
  await transporter.sendMail({
    from: getEmailFrom(),
    to,
    subject,
    text,
    html,
  });
};

const renderDetailsRows = (details = []) => {
  if (!details.length) {
    return `<tr><td colspan="5" style="padding: 10px; border: 1px solid ${COLORS.primaryLight}; color: ${COLORS.muted};">Sin detalles registrados.</td></tr>`;
  }

  return details.map((item, index) => {
    const background = index % 2 === 0 ? COLORS.white : COLORS.softGray;

    return `
      <tr style="background: ${background};">
        <td style="padding: 9px; border: 1px solid ${COLORS.primaryLight}; vertical-align: middle;">${item.productName || item.name || item.product?.name || "Producto"}</td>
        <td style="padding: 9px; border: 1px solid ${COLORS.primaryLight}; vertical-align: middle;">${item.barcode || "N/A"}</td>
        <td style="padding: 9px; border: 1px solid ${COLORS.primaryLight}; text-align: right; vertical-align: middle;">${item.quantity || 0}</td>
        <td style="padding: 9px; border: 1px solid ${COLORS.primaryLight}; text-align: right; vertical-align: middle;">${formatMoney(item.unitPrice || item.unit_price || 0)}</td>
        <td style="padding: 9px; border: 1px solid ${COLORS.primaryLight}; text-align: right; vertical-align: middle; font-weight: 700;">${formatMoney(item.total || item.subtotal || 0)}</td>
      </tr>
    `;
  }).join("");
};

const renderDetailsTable = (details = []) => `
  <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
    <thead>
      <tr style="background: ${COLORS.primary}; color: ${COLORS.white};">
        <th style="padding: 10px; text-align: left; border: 1px solid ${COLORS.primary};">Producto</th>
        <th style="padding: 10px; text-align: left; border: 1px solid ${COLORS.primary};">Codigo</th>
        <th style="padding: 10px; text-align: right; border: 1px solid ${COLORS.primary};">Cantidad</th>
        <th style="padding: 10px; text-align: right; border: 1px solid ${COLORS.primary};">Precio</th>
        <th style="padding: 10px; text-align: right; border: 1px solid ${COLORS.primary};">Total</th>
      </tr>
    </thead>
    <tbody>${renderDetailsRows(details)}</tbody>
  </table>
`;

const renderPaymentMethods = (paymentMethods = []) => {
  if (!paymentMethods.length) {
    return `<p style="color: ${COLORS.muted};">No hay metodos de pago registrados.</p>`;
  }

  return `
    <div style="margin: 12px 0;">
      ${paymentMethods.map((payment) => `
        <div style="background: ${COLORS.softGray}; border: 1px solid ${COLORS.primaryLight}; border-radius: 4px; padding: 10px 12px; margin-bottom: 8px;">
          <span style="color: ${COLORS.primary}; font-weight: 700;">${payment.name || payment.paymentMethod?.namePaymentMethod || payment.paymentMethod?.name || "Metodo"}</span>
          <span style="float: right; font-weight: 700; color: ${COLORS.text};">${formatMoney(payment.amount)}</span>
        </div>
      `).join("")}
    </div>
  `;
};

const baseLayout = ({ title, body, badge }) => `
  <div style="background: ${COLORS.softGray}; padding: 24px 0; font-family: 'Segoe UI', Arial, sans-serif; color: ${COLORS.text};">
    <div style="max-width: 680px; margin: 0 auto; background: ${COLORS.white}; border-radius: 6px; overflow: hidden; border: 1px solid ${COLORS.primaryLight};">
      <div style="background: ${COLORS.primary}; color: ${COLORS.white}; padding: 22px 26px;">
        <h1 style="margin: 0; font-size: 22px; line-height: 1.3; color: ${COLORS.white};">${title}</h1>
        ${badge ? `<div style="display: inline-block; margin-top: 10px; padding: 5px 10px; background: rgba(255,255,255,0.16); border: 1px solid rgba(255,255,255,0.35); border-radius: 999px; font-size: 12px; font-weight: 700;">${badge}</div>` : ""}
      </div>
      <div style="padding: 24px 26px; background: ${COLORS.white};">
        ${body}
      </div>
      <div style="background: ${COLORS.softGray}; padding: 16px 26px; color: ${COLORS.muted}; font-size: 12px; border-top: 1px solid ${COLORS.primaryLight};">
        <p style="margin: 0;">Saludos,<br><strong style="color: ${COLORS.primary};">Equipo SeymSoft</strong></p>
      </div>
    </div>
  </div>
`;

export class EmailService {
  static async sendPasswordResetEmail(
    to,
    verificationCode,
    fullName,
    frontendUrl = getFrontendUrl()
  ) {
    const name = getName(fullName);
    const resetPageUrl = `${frontendUrl}/resetpassword`;
    const subject = "Codigo para restablecer tu contrasena";
    const text = `Hola ${name},\n\nTu codigo de verificacion es: ${verificationCode}\n\nIngresa este codigo en la pantalla de recuperacion de contrasena.\n\n${resetPageUrl}\n\nSi no solicitaste este cambio, ignora este mensaje.`;
    const html = baseLayout({
      title: "Restablecer contrasena",
      body: `
        <p>Hola ${name},</p>
        <p>Tu codigo de verificacion es:</p>
        <h2 style="color: #004D77;">${verificationCode}</h2>
        <p>Ingresa este codigo en la pantalla de recuperacion de contrasena.</p>
        ${renderActionLink(resetPageUrl, "Restablecer contrasena")}
      `,
    });

    await sendMail({ to, subject, text, html });
  }

  static async sendWelcomeEmail(
    to,
    tempPassword,
    fullName,
    frontendUrl = getFrontendUrl()
  ) {
    const name = getName(fullName);
    const loginPageUrl = `${frontendUrl}/login`;
    const subject = "Bienvenido. Acceso a tu cuenta";
    const text = `Hola ${name},\n\nTu cuenta ha sido creada exitosamente.\n\nTu contrasena temporal es: ${tempPassword}\n\nInicia sesion en: ${loginPageUrl}`;
    const html = baseLayout({
      title: `Bienvenido, ${name}`,
      body: `
        <p>Tu cuenta ha sido creada exitosamente.</p>
        <p><strong>Tu contrasena temporal es:</strong></p>
        <div style="background: #F3F4F6; border-left: 4px solid #004D77; padding: 15px; margin: 20px 0;">
          <h3 style="color: #004D77; margin: 0; font-size: 24px; letter-spacing: 2px;">${tempPassword}</h3>
        </div>
        ${renderActionLink(loginPageUrl, "Iniciar sesion")}
      `,
    });

    await sendMail({ to, subject, text, html });
  }

  static async sendLandingWelcomeEmail(
    to,
    fullName,
    frontendUrl = getFrontendUrl()
  ) {
    const name = getName(fullName);
    const loginPageUrl = `${frontendUrl}/login`;
    const subject = "Bienvenido a SeymSoft";
    const text = `Hola ${name},\n\nTu cuenta ha sido creada exitosamente y ya esta lista para usar.\n\nAccede aqui:\n${loginPageUrl}`;
    const html = baseLayout({
      title: `Bienvenido a Papeleria Magic, ${name}`,
      body: `
        <p>Tu cuenta ha sido creada exitosamente y ya esta lista para usar.</p>
        ${renderActionLink(loginPageUrl, "Iniciar sesion")}
      `,
    });

    await sendMail({ to, subject, text, html });
  }

  static async sendEmailChangeNotification(oldEmail, newEmail, fullName) {
    const name = getName(fullName);
    const subject = "Notificacion: Tu email fue cambiado";
    const text = `Hola ${name},\n\nEl email asociado a tu cuenta fue cambiado.\n\nEmail anterior: ${oldEmail}\nEmail nuevo: ${newEmail}\n\nSi no realizaste este cambio, contacta al soporte.`;
    const html = baseLayout({
      title: "Notificacion de cambio de email",
      body: `
        <p>Hola ${name},</p>
        <p>El email asociado a tu cuenta fue cambiado.</p>
        <p><strong>Email anterior:</strong> ${oldEmail}</p>
        <p><strong>Email nuevo:</strong> ${newEmail}</p>
      `,
    });

    await sendMail({ to: oldEmail, subject, text, html });
  }

  static async sendOrderCreatedEmail({
    to,
    fullName,
    orderId,
    details = [],
    subtotal,
    ivaAmount,
    total,
    paymentDeadline,
    deliveryType,
    deliveryAddress,
    frontendUrl = getFrontendUrl(),
  }) {
    const name = getName(fullName);
    const orderUrl = `${frontendUrl}/orders/${orderId}`;
    const subject = `Pedido registrado - #${orderId}`;
    const text = `Hola ${name},\n\nTu pedido #${orderId} fue registrado.\n\nTotal: ${formatMoney(total)}\nFecha limite de pago: ${formatDate(paymentDeadline)}\nTipo de entrega: ${deliveryType || "No especificado"}\nDireccion: ${deliveryAddress || "No aplica"}\n\n${orderUrl}`;
    const html = baseLayout({
      title: `Pedido registrado #${orderId}`,
      body: `
        <p>Hola ${name},</p>
        <p>Tu pedido fue registrado correctamente.</p>
        ${renderDetailsTable(details)}
        <p><strong>Subtotal:</strong> ${formatMoney(subtotal)}</p>
        <p><strong>IVA:</strong> ${formatMoney(ivaAmount)}</p>
        <p><strong>Total:</strong> ${formatMoney(total)}</p>
        <p><strong>Fecha limite de pago:</strong> ${formatDate(paymentDeadline)}</p>
        <p><strong>Entrega:</strong> ${deliveryType || "No especificado"}</p>
        <p><strong>Direccion:</strong> ${deliveryAddress || "No aplica"}</p>
        ${renderActionLink(orderUrl, "Ver pedido")}
      `,
    });

    await sendMail({ to, subject, text, html });
  }

  static async sendOrderPaymentRegisteredEmail({
    to,
    fullName,
    orderId,
    paymentMethod,
    amount,
    paidAmount,
    pendingAmount,
    isPaid,
    reference,
    frontendUrl = getFrontendUrl(),
  }) {
    const name = getName(fullName);
    const orderUrl = `${frontendUrl}/orders/${orderId}`;
    const subject = `Pago registrado - Pedido #${orderId}`;
    const text = `Hola ${name},\n\nSe registro un pago para tu pedido #${orderId}.\n\nMetodo: ${paymentMethod || "No especificado"}\nMonto: ${formatMoney(amount)}\nTotal abonado: ${formatMoney(paidAmount)}\nSaldo pendiente: ${formatMoney(pendingAmount)}\nEstado: ${isPaid ? "Pagado" : "Pendiente"}\nReferencia: ${reference || "No aplica"}\n\n${orderUrl}`;
    const html = baseLayout({
      title: `Pago registrado - Pedido #${orderId}`,
      body: `
        <p>Hola ${name},</p>
        <p>Se registro un pago o abono para tu pedido.</p>
        <p><strong>Metodo:</strong> ${paymentMethod || "No especificado"}</p>
        <p><strong>Monto:</strong> ${formatMoney(amount)}</p>
        <p><strong>Total abonado:</strong> ${formatMoney(paidAmount)}</p>
        <p><strong>Saldo pendiente:</strong> ${formatMoney(pendingAmount)}</p>
        <p><strong>Estado:</strong> ${isPaid ? "Pagado" : "Pendiente"}</p>
        <p><strong>Referencia:</strong> ${reference || "No aplica"}</p>
        ${renderActionLink(orderUrl, "Ver pedido")}
      `,
    });

    await sendMail({ to, subject, text, html });
  }

  static async sendOrderStatusChangedEmail({
    to,
    fullName,
    orderId,
    previousStatus,
    newStatus,
    deliveryType,
    deliveryAddress,
    frontendUrl = getFrontendUrl(),
  }) {
    const name = getName(fullName);
    const orderUrl = `${frontendUrl}/orders/${orderId}`;
    const subject = `Estado actualizado - Pedido #${orderId}`;
    const text = `Hola ${name},\n\nEl estado de tu pedido #${orderId} cambio de ${previousStatus || "No especificado"} a ${newStatus}.\n\nEntrega: ${deliveryType || "No especificado"}\nDireccion: ${deliveryAddress || "No aplica"}\n\n${orderUrl}`;
    const html = baseLayout({
      title: `Estado actualizado - Pedido #${orderId}`,
      body: `
        <p>Hola ${name},</p>
        <p>El estado de tu pedido fue actualizado.</p>
        <p><strong>Estado anterior:</strong> ${previousStatus || "No especificado"}</p>
        <p><strong>Nuevo estado:</strong> ${newStatus}</p>
        <p><strong>Entrega:</strong> ${deliveryType || "No especificado"}</p>
        <p><strong>Direccion:</strong> ${deliveryAddress || "No aplica"}</p>
        ${renderActionLink(orderUrl, "Ver pedido")}
      `,
    });

    await sendMail({ to, subject, text, html });
  }

  static async sendOrderCancelledEmail({
    to,
    fullName,
    orderId,
    reason,
    total,
    frontendUrl = getFrontendUrl(),
  }) {
    const name = getName(fullName);
    const orderUrl = `${frontendUrl}/orders/${orderId}`;
    const subject = `Pedido cancelado - #${orderId}`;
    const text = `Hola ${name},\n\nTu pedido #${orderId} fue cancelado.\n\nMotivo: ${reason || "No especificado"}\nTotal: ${formatMoney(total)}\n\n${orderUrl}`;
    const html = baseLayout({
      title: `Pedido cancelado #${orderId}`,
      body: `
        <p>Hola ${name},</p>
        <p>Tu pedido fue cancelado.</p>
        <p><strong>Motivo:</strong> ${reason || "No especificado"}</p>
        <p><strong>Total:</strong> ${formatMoney(total)}</p>
        ${renderActionLink(orderUrl, "Ver pedido")}
      `,
    });

    await sendMail({ to, subject, text, html });
  }

  static async sendSaleCreatedEmail({
    to,
    fullName,
    saleId,
    orderId,
    paymentMethods = [],
    details = [],
    subtotal,
    total,
    credit,
    frontendUrl = getFrontendUrl(),
  }) {
    const name = getName(fullName);
    const saleUrl = `${frontendUrl}/vendings/${saleId}`;
    const subject = `Venta registrada - #${saleId}`;
    const creditText = credit
      ? `\nCredito: ${formatMoney(credit.creditAmount || credit.credit_amount)}\nSaldo credito: ${formatMoney(credit.remainingBalance || credit.remaining_balance)}\nVencimiento: ${formatDate(credit.dueDate || credit.due_date)}`
      : "";
    const text = `Hola ${name},\n\nTu venta #${saleId} fue registrada.\n\nPedido relacionado: #${orderId}\nSubtotal: ${formatMoney(subtotal)}\nTotal: ${formatMoney(total)}${creditText}\n\n${saleUrl}`;
    const html = baseLayout({
      title: `Venta registrada #${saleId}`,
      body: `
        <p>Hola ${name},</p>
        <p>Tu venta fue registrada correctamente.</p>
        <p><strong>Pedido relacionado:</strong> #${orderId}</p>
        ${renderDetailsTable(details)}
        <p><strong>Subtotal:</strong> ${formatMoney(subtotal)}</p>
        <p><strong>Total:</strong> ${formatMoney(total)}</p>
        <p><strong>Metodos de pago:</strong></p>
        ${renderPaymentMethods(paymentMethods)}
        ${credit ? `
          <div style="background: #F3F4F6; border-left: 4px solid #004D77; padding: 15px; margin: 20px 0;">
            <p><strong>Credito:</strong> ${formatMoney(credit.creditAmount || credit.credit_amount)}</p>
            <p><strong>Saldo credito:</strong> ${formatMoney(credit.remainingBalance || credit.remaining_balance)}</p>
            <p><strong>Vencimiento:</strong> ${formatDate(credit.dueDate || credit.due_date)}</p>
          </div>
        ` : ""}
        ${renderActionLink(saleUrl, "Ver venta")}
      `,
    });

    await sendMail({ to, subject, text, html });
  }

  static async sendSaleAnnulledEmail({
    to,
    fullName,
    saleId,
    orderId,
    reason,
    total,
    creditRestoredAmount,
    frontendUrl = getFrontendUrl(),
  }) {
    const name = getName(fullName);
    const saleUrl = `${frontendUrl}/vendings/${saleId}`;
    const subject = `Venta anulada - #${saleId}`;
    const text = `Hola ${name},\n\nLa venta #${saleId} relacionada al pedido #${orderId} fue anulada.\n\nMotivo: ${reason || "No especificado"}\nTotal: ${formatMoney(total)}\nCupo restaurado: ${formatMoney(creditRestoredAmount)}\n\n${saleUrl}`;
    const html = baseLayout({
      title: `Venta anulada #${saleId}`,
      body: `
        <p>Hola ${name},</p>
        <p>La venta relacionada a tu pedido fue anulada.</p>
        <p><strong>Pedido relacionado:</strong> #${orderId}</p>
        <p><strong>Motivo:</strong> ${reason || "No especificado"}</p>
        <p><strong>Total:</strong> ${formatMoney(total)}</p>
        <p><strong>Cupo restaurado:</strong> ${formatMoney(creditRestoredAmount)}</p>
        ${renderActionLink(saleUrl, "Ver venta")}
      `,
    });

    await sendMail({ to, subject, text, html });
  }

  static async sendOrderPaymentReminderEmail({
    to,
    fullName,
    orderId,
    orderTotal,
    paidAmount,
    pendingAmount,
    paymentDeadline,
    hoursRemaining,
    frontendUrl = getFrontendUrl(),
  }) {
    const name = getName(fullName);
    const orderUrl = `${frontendUrl}/orders/${orderId}`;
    const subject = `Recordatorio de pago pendiente - Pedido #${orderId}`;
    const text = `Hola ${name},\n\nTu pedido #${orderId} aun tiene un saldo pendiente de pago.\n\nTotal del pedido: ${formatMoney(orderTotal)}\nTotal abonado: ${formatMoney(paidAmount)}\nSaldo pendiente: ${formatMoney(pendingAmount)}\nFecha limite de pago: ${formatDate(paymentDeadline)}\nTiempo restante aproximado: ${hoursRemaining} hora(s).\n\n${orderUrl}`;
    const html = baseLayout({
      title: "Recordatorio de pago pendiente",
      body: `
        <p>Hola ${name},</p>
        <p>Tu pedido <strong>#${orderId}</strong> aun tiene un saldo pendiente de pago.</p>
        <div style="background: #F3F4F6; border-left: 4px solid #004D77; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p><strong>Total del pedido:</strong> ${formatMoney(orderTotal)}</p>
          <p><strong>Total abonado:</strong> ${formatMoney(paidAmount)}</p>
          <p><strong>Saldo pendiente:</strong> ${formatMoney(pendingAmount)}</p>
          <p><strong>Fecha limite:</strong> ${formatDate(paymentDeadline)}</p>
          <p><strong>Tiempo restante:</strong> ${hoursRemaining} hora(s)</p>
        </div>
        <p>Si el pedido no se paga por completo antes de la fecha limite, sera cancelado automaticamente.</p>
        ${renderActionLink(orderUrl, "Ver pedido")}
      `,
    });

    await sendMail({ to, subject, text, html });
  }
}
