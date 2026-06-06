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
    return "<tr><td colspan=\"5\">Sin detalles registrados.</td></tr>";
  }

  return details.map((item) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.productName || item.name || item.product?.name || "Producto"}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.barcode || "N/A"}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${item.quantity || 0}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${formatMoney(item.unitPrice || item.unit_price || 0)}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${formatMoney(item.subtotal || 0)}</td>
    </tr>
  `).join("");
};

const renderDetailsTable = (details = []) => `
  <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
    <thead>
      <tr style="background: #f8f9fa;">
        <th style="padding: 8px; text-align: left;">Producto</th>
        <th style="padding: 8px; text-align: left;">Codigo</th>
        <th style="padding: 8px; text-align: right;">Cantidad</th>
        <th style="padding: 8px; text-align: right;">Precio</th>
        <th style="padding: 8px; text-align: right;">Subtotal</th>
      </tr>
    </thead>
    <tbody>${renderDetailsRows(details)}</tbody>
  </table>
`;

const renderPaymentMethods = (paymentMethods = []) => {
  if (!paymentMethods.length) {
    return "<p>No hay metodos de pago registrados.</p>";
  }

  return `
    <ul>
      ${paymentMethods.map((payment) => `
        <li>${payment.name || payment.paymentMethod?.namePaymentMethod || payment.paymentMethod?.name || "Metodo"}: ${formatMoney(payment.amount)}</li>
      `).join("")}
    </ul>
  `;
};

const baseLayout = ({ title, body }) => `
  <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 20px; color: #333;">
    <h2 style="color: #222;">${title}</h2>
    ${body}
    <p style="color: #666; font-size: 12px; margin-top: 30px;">Saludos,<br><strong>Equipo SeymSoft</strong></p>
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
        <h2 style="color: #007bff;">${verificationCode}</h2>
        <p>Ingresa este codigo en la pantalla de recuperacion de contrasena.</p>
        <p><a href="${resetPageUrl}">${resetPageUrl}</a></p>
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
        <div style="background: #f8f9fa; border-left: 4px solid #007bff; padding: 15px; margin: 20px 0;">
          <h3 style="color: #007bff; margin: 0; font-size: 24px; letter-spacing: 2px;">${tempPassword}</h3>
        </div>
        <p>Inicia sesion en: <a href="${loginPageUrl}">${loginPageUrl}</a></p>
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
        <p><a href="${loginPageUrl}">Iniciar sesion</a></p>
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
        <p><a href="${orderUrl}">Ver pedido</a></p>
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
        <p><a href="${orderUrl}">Ver pedido</a></p>
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
        <p><a href="${orderUrl}">Ver pedido</a></p>
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
        <p><a href="${orderUrl}">Ver pedido</a></p>
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
          <div style="background: #f8f9fa; border-left: 4px solid #007bff; padding: 15px; margin: 20px 0;">
            <p><strong>Credito:</strong> ${formatMoney(credit.creditAmount || credit.credit_amount)}</p>
            <p><strong>Saldo credito:</strong> ${formatMoney(credit.remainingBalance || credit.remaining_balance)}</p>
            <p><strong>Vencimiento:</strong> ${formatDate(credit.dueDate || credit.due_date)}</p>
          </div>
        ` : ""}
        <p><a href="${saleUrl}">Ver venta</a></p>
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
        <p><a href="${saleUrl}">Ver venta</a></p>
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
        <div style="background: #f8f9fa; border-left: 4px solid #007bff; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p><strong>Total del pedido:</strong> ${formatMoney(orderTotal)}</p>
          <p><strong>Total abonado:</strong> ${formatMoney(paidAmount)}</p>
          <p><strong>Saldo pendiente:</strong> ${formatMoney(pendingAmount)}</p>
          <p><strong>Fecha limite:</strong> ${formatDate(paymentDeadline)}</p>
          <p><strong>Tiempo restante:</strong> ${hoursRemaining} hora(s)</p>
        </div>
        <p>Si el pedido no se paga por completo antes de la fecha limite, sera cancelado automaticamente.</p>
        <p><a href="${orderUrl}">Ver pedido</a></p>
      `,
    });

    await sendMail({ to, subject, text, html });
  }
}
