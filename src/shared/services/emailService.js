import nodemailer from "nodemailer";
import { env } from "../../config/env.js";

const mailConfig = {
  host: env.EMAIL_HOST,
  port: env.EMAIL_PORT,
  secure: env.EMAIL_SECURE,
  auth: {
    user: env.EMAIL_USER,
    pass: env.EMAIL_PASSWORD,
  },
};

const transporter = nodemailer.createTransport(mailConfig);

const getEmailFrom = () => {
  const from = env.EMAIL_FROM || env.EMAIL_USER;

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

const formatDisplayText = (value, fallback = "No aplica") => {
  const text = String(value || "").trim();

  return text || fallback;
};

const getFrontendUrl = () =>
  env.FRONTEND_URL;

const COLORS = {
  primary: "#004D77",
  primaryDark: "#003B5C",
  primaryLight: "#E5F1F7",
  primarySoft: "#F3FAFD",

  white: "#FFFFFF",
  background: "#F3F4F6",
  surface: "#FFFFFF",

  text: "#1F2937",
  muted: "#6B7280",
  softText: "#9CA3AF",

  border: "#E5E7EB",
  borderStrong: "#CBD5E1",

  success: "#047857",
  successSoft: "#ECFDF5",

  warning: "#B45309",
  warningSoft: "#FFFBEB",

  danger: "#B42318",
  dangerSoft: "#FEF2F2",
};

const renderActionLink = (href, label) => `
  <a href="${href}" style="
    display: inline-block;
    background: ${COLORS.primary};
    color: ${COLORS.white};
    text-decoration: none;
    padding: 12px 18px;
    border-radius: 10px;
    font-weight: 700;
    font-size: 14px;
    margin-top: 16px;
    box-shadow: 0 8px 18px rgba(0, 77, 119, 0.22);
  ">
    ${label}
  </a>
`;

const renderInfoCard = (content, options = {}) => `
  <div style="
    background: ${options.background || COLORS.primarySoft};
    border: 1px solid ${options.borderColor || COLORS.primaryLight};
    border-left: 4px solid ${options.accentColor || COLORS.primary};
    padding: 16px;
    margin: 18px 0;
    border-radius: 12px;
  ">
    ${content}
  </div>
`;

// ----- HELPERS -----
const renderSectionTitle = (title, subtitle = "") => `
  <div style="margin: 24px 0 12px;">
    <h2 style="
      margin: 0;
      color: ${COLORS.text};
      font-size: 17px;
      line-height: 1.3;
    ">
      ${title}
    </h2>
    ${subtitle ? `
      <p style="
        margin: 4px 0 0;
        color: ${COLORS.muted};
        font-size: 13px;
      ">
        ${subtitle}
      </p>
    ` : ""}
  </div>
`;

const renderBadge = (label, tone = "primary") => {
  const styles = {
    primary: {
      background: COLORS.primaryLight,
      color: COLORS.primary,
      border: COLORS.primaryLight,
    },
    success: {
      background: COLORS.successSoft,
      color: COLORS.success,
      border: COLORS.successSoft,
    },
    warning: {
      background: COLORS.warningSoft,
      color: COLORS.warning,
      border: COLORS.warningSoft,
    },
    danger: {
      background: COLORS.dangerSoft,
      color: COLORS.danger,
      border: COLORS.dangerSoft,
    },
  };

  const selected = styles[tone] || styles.primary;

  return `
    <span style="
      display: inline-block;
      padding: 6px 10px;
      border-radius: 999px;
      background: ${selected.background};
      color: ${selected.color};
      border: 1px solid ${selected.border};
      font-size: 12px;
      font-weight: 700;
      line-height: 1;
    ">
      ${label}
    </span>
  `;
};

const renderDivider = () => `
  <div style="
    height: 1px;
    background: ${COLORS.border};
    margin: 24px 0;
  "></div>
`;

const renderAlertBox = (content, tone = "primary") => {
  const styles = {
    primary: {
      background: COLORS.primarySoft,
      border: COLORS.primaryLight,
      accent: COLORS.primary,
      color: COLORS.text,
    },
    success: {
      background: COLORS.successSoft,
      border: COLORS.successSoft,
      accent: COLORS.success,
      color: COLORS.text,
    },
    warning: {
      background: COLORS.warningSoft,
      border: COLORS.warningSoft,
      accent: COLORS.warning,
      color: COLORS.text,
    },
    danger: {
      background: COLORS.dangerSoft,
      border: COLORS.dangerSoft,
      accent: COLORS.danger,
      color: COLORS.text,
    },
  };

  const selected = styles[tone] || styles.primary;

  return `
    <div style="
      background: ${selected.background};
      border: 1px solid ${selected.border};
      border-left: 4px solid ${selected.accent};
      color: ${selected.color};
      padding: 16px;
      border-radius: 12px;
      margin: 18px 0;
    ">
      ${content}
    </div>
  `;
};

const renderSummaryCard = (label, value, options = {}) => `
  <div style="
    background: ${options.background || COLORS.white};
    border: 1px solid ${options.borderColor || COLORS.border};
    border-radius: 12px;
    padding: 14px 16px;
    box-shadow: 0 8px 18px rgba(15, 23, 42, 0.04);
  ">
    <p style="
      margin: 0 0 6px;
      color: ${COLORS.muted};
      font-size: 12px;
      font-weight: 600;
    ">
      ${label}
    </p>
    <p style="
      margin: 0;
      color: ${options.valueColor || COLORS.text};
      font-size: 16px;
      font-weight: 800;
    ">
      ${value}
    </p>
  </div>
`;

const renderSummaryGrid = (items = []) => {
  if (!items.length) return "";

  return `
    <div style="
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
      margin: 18px 0;
    ">
      ${items.map((item) =>
        renderSummaryCard(item.label, item.value, item.options)
      ).join("")}
    </div>
  `;
};

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
    return `
      <tr>
        <td colspan="5" style="
          padding: 16px;
          border-top: 1px solid ${COLORS.border};
          color: ${COLORS.muted};
          text-align: center;
          font-size: 13px;
        ">
          Sin detalles registrados.
        </td>
      </tr>
    `;
  }

  return details.map((item, index) => {
    const background = index % 2 === 0 ? COLORS.white : COLORS.primarySoft;

    return `
      <tr style="background: ${background};">
        <td style="
          padding: 12px;
          border-top: 1px solid ${COLORS.border};
          vertical-align: middle;
          color: ${COLORS.text};
          font-weight: 600;
        ">
          ${item.productName || item.name || item.product?.name || "Producto"}
        </td>

        <td style="
          padding: 12px;
          border-top: 1px solid ${COLORS.border};
          vertical-align: middle;
          color: ${COLORS.muted};
          font-size: 13px;
        ">
          ${item.barcode || "N/A"}
        </td>

        <td style="
          padding: 12px;
          border-top: 1px solid ${COLORS.border};
          text-align: right;
          vertical-align: middle;
          color: ${COLORS.text};
        ">
          ${item.quantity || 0}
        </td>

        <td style="
          padding: 12px;
          border-top: 1px solid ${COLORS.border};
          text-align: right;
          vertical-align: middle;
          color: ${COLORS.text};
        ">
          ${formatMoney(item.unitPrice || item.unit_price || 0)}
        </td>

        <td style="
          padding: 12px;
          border-top: 1px solid ${COLORS.border};
          text-align: right;
          vertical-align: middle;
          color: ${COLORS.primary};
          font-weight: 800;
        ">
          ${formatMoney(item.total || item.subtotal || 0)}
        </td>
      </tr>
    `;
  }).join("");
};

const renderDetailsTable = (details = []) => `
  <div style="
    margin: 20px 0;
    border: 1px solid ${COLORS.border};
    border-radius: 14px;
    overflow: hidden;
    box-shadow: 0 8px 20px rgba(15, 23, 42, 0.04);
  ">
    <table style="
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
      background: ${COLORS.white};
    ">
      <thead>
        <tr style="background: ${COLORS.primary}; color: ${COLORS.white};">
          <th style="padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em;">
            Producto
          </th>
          <th style="padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em;">
            Codigo
          </th>
          <th style="padding: 12px; text-align: right; font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em;">
            Cantidad
          </th>
          <th style="padding: 12px; text-align: right; font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em;">
            Precio
          </th>
          <th style="padding: 12px; text-align: right; font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em;">
            Total
          </th>
        </tr>
      </thead>
      <tbody>
        ${renderDetailsRows(details)}
      </tbody>
    </table>
  </div>
`;

const renderPaymentMethods = (paymentMethods = []) => {
  if (!paymentMethods.length) {
    return renderAlertBox(
      `<p style="margin: 0; color: ${COLORS.muted};">No hay metodos de pago registrados.</p>`,
      "primary"
    );
  }

  return `
    <div style="margin: 14px 0;">
      ${paymentMethods.map((payment) => {
        const paymentName =
          payment.name ||
          payment.paymentMethod?.namePaymentMethod ||
          payment.paymentMethod?.name ||
          "Metodo";

        return `
          <div style="
            background: ${COLORS.white};
            border: 1px solid ${COLORS.border};
            border-radius: 12px;
            padding: 12px 14px;
            margin-bottom: 10px;
            box-shadow: 0 6px 14px rgba(15, 23, 42, 0.04);
          ">
            <div style="
              display: table;
              width: 100%;
            ">
              <div style="
                display: table-cell;
                vertical-align: middle;
              ">
                <p style="
                  margin: 0;
                  color: ${COLORS.primary};
                  font-weight: 800;
                  font-size: 14px;
                ">
                  ${paymentName}
                </p>
                <p style="
                  margin: 2px 0 0;
                  color: ${COLORS.muted};
                  font-size: 12px;
                ">
                  Metodo de pago
                </p>
              </div>

              <div style="
                display: table-cell;
                vertical-align: middle;
                text-align: right;
                color: ${COLORS.text};
                font-weight: 800;
                font-size: 15px;
              ">
                ${formatMoney(payment.amount)}
              </div>
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;
};

const baseLayout = ({ title, body, badge }) => `
  <div style="
    margin: 0;
    padding: 28px 12px;
    background: ${COLORS.background};
    font-family: 'Segoe UI', Arial, sans-serif;
    color: ${COLORS.text};
  ">
    <div style="
      max-width: 720px;
      margin: 0 auto;
      background: ${COLORS.surface};
      border: 1px solid ${COLORS.border};
      border-radius: 18px;
      overflow: hidden;
      box-shadow: 0 18px 45px rgba(15, 23, 42, 0.10);
    ">
      <div style="
        background: linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark});
        color: ${COLORS.white};
        padding: 26px 28px;
      ">
        <div style="
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.78);
          margin-bottom: 8px;
        ">
          SeymSoft
        </div>

        <h1 style="
          margin: 0;
          font-size: 24px;
          line-height: 1.3;
          color: ${COLORS.white};
        ">
          ${title}
        </h1>

        ${badge ? `
          <div style="
            display: inline-block;
            margin-top: 12px;
            padding: 6px 12px;
            background: rgba(255,255,255,0.16);
            border: 1px solid rgba(255,255,255,0.32);
            border-radius: 999px;
            font-size: 12px;
            font-weight: 700;
            color: ${COLORS.white};
          ">
            ${badge}
          </div>
        ` : ""}
      </div>

      <div style="
        padding: 28px;
        background: ${COLORS.white};
        font-size: 15px;
        line-height: 1.65;
      ">
        ${body}
      </div>

      <div style="
        background: ${COLORS.primarySoft};
        padding: 18px 28px;
        color: ${COLORS.muted};
        font-size: 12px;
        border-top: 1px solid ${COLORS.border};
      ">
        <p style="margin: 0;">
          Saludos,<br>
          <strong style="color: ${COLORS.primary};">Equipo SeymSoft</strong>
        </p>
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
      badge: "Seguridad de cuenta",
      body: `
        <p style="margin-top: 0;">Hola <strong>${name}</strong>,</p>

        <p>
          Recibimos una solicitud para restablecer la contrasena de tu cuenta.
          Usa el siguiente codigo de verificacion para continuar el proceso.
        </p>

        ${renderInfoCard(`
          <p style="
            margin: 0 0 8px;
            color: ${COLORS.muted};
            font-size: 13px;
            font-weight: 600;
          ">
            Codigo de verificacion
          </p>

          <div style="
            display: inline-block;
            color: ${COLORS.primary};
            font-size: 30px;
            font-weight: 900;
            letter-spacing: 6px;
            line-height: 1;
          ">
            ${verificationCode}
          </div>
        `)}

        ${renderAlertBox(`
          <p style="margin: 0;">
            Si no solicitaste este cambio, puedes ignorar este correo.
            Tu contrasena actual seguira siendo valida.
          </p>
        `, "warning")}

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
      badge: "Cuenta creada",
      body: `
        <p style="margin-top: 0;">Hola <strong>${name}</strong>,</p>

        <p>
          Tu cuenta ha sido creada exitosamente en SeymSoft.
          Ya puedes ingresar al sistema con la contrasena temporal asignada.
        </p>

        ${renderSectionTitle("Datos de acceso")}

        ${renderInfoCard(`
          <p style="
            margin: 0 0 8px;
            color: ${COLORS.muted};
            font-size: 13px;
            font-weight: 600;
          ">
            Contrasena temporal
          </p>

          <div style="
            display: inline-block;
            color: ${COLORS.primary};
            font-size: 24px;
            font-weight: 900;
            letter-spacing: 3px;
            line-height: 1.2;
          ">
            ${tempPassword}
          </div>
        `)}

        ${renderAlertBox(`
          <p style="margin: 0;">
            Por seguridad, te recomendamos cambiar esta contrasena despues de iniciar sesion.
          </p>
        `, "primary")}

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
      badge: "Registro exitoso",
      body: `
        <p style="margin-top: 0;">Hola <strong>${name}</strong>,</p>

        <p>
          Tu cuenta ha sido creada exitosamente y ya esta lista para usar.
          Desde ahora puedes acceder a la tienda, consultar productos y gestionar tus pedidos.
        </p>

        ${renderSummaryGrid([
          {
            label: "Estado de cuenta",
            value: "Activa",
            options: {
              background: COLORS.successSoft,
              borderColor: COLORS.successSoft,
              valueColor: COLORS.success,
            },
          },
          {
            label: "Acceso",
            value: "Disponible",
            options: {
              background: COLORS.primarySoft,
              borderColor: COLORS.primaryLight,
              valueColor: COLORS.primary,
            },
          },
        ])}

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
      badge: "Seguridad de cuenta",
      body: `
        <p style="margin-top: 0;">Hola <strong>${name}</strong>,</p>

        <p>
          Te informamos que el correo electronico asociado a tu cuenta fue cambiado.
        </p>

        ${renderSectionTitle("Detalle del cambio")}

        ${renderSummaryGrid([
          {
            label: "Email anterior",
            value: oldEmail,
          },
          {
            label: "Email nuevo",
            value: newEmail,
            options: {
              background: COLORS.primarySoft,
              borderColor: COLORS.primaryLight,
              valueColor: COLORS.primary,
            },
          },
        ])}

        ${renderAlertBox(`
          <p style="margin: 0;">
            Si no realizaste este cambio, contacta al soporte lo antes posible.
          </p>
        `, "warning")}
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
    shippingAmount,
    total,
    paymentDeadline,
    deliveryType,
    deliveryAddress,
    deliveryRecipientName,
    deliveryDepartment,
    deliveryCity,
    frontendUrl = getFrontendUrl(),
  }) {
    const name = getName(fullName);
    const orderUrl = `${frontendUrl}/orders/${orderId}`;
    const subject = `Pedido registrado - #${orderId}`;
    const deliveryDepartmentName =
      deliveryDepartment?.name || deliveryDepartment || "No aplica";
    const deliveryCityName =
      deliveryCity?.name || deliveryCity || "No aplica";
    const deliveryRecipient = formatDisplayText(
      deliveryRecipientName,
      "No registrada"
    );

    const text = `Hola ${name},\n\nTu pedido #${orderId} fue registrado.\n\nSubtotal: ${formatMoney(subtotal)}\nIVA: ${formatMoney(ivaAmount)}\nEnvio: ${formatMoney(shippingAmount)}\nTotal: ${formatMoney(total)}\nFecha limite de pago: ${formatDate(paymentDeadline)}\nTipo de entrega: ${deliveryType || "No especificado"}\nPersona que recibe/recoge: ${deliveryRecipient}\nDepartamento: ${deliveryDepartmentName}\nMunicipio/Ciudad: ${deliveryCityName}\nDireccion: ${deliveryAddress || "No aplica"}\n\n${orderUrl}`;

    const html = baseLayout({
      title: `Pedido registrado #${orderId}`,
      badge: "Pedido creado",
      body: `
        <p style="margin-top: 0;">Hola <strong>${name}</strong>,</p>

        <p>
          Tu pedido fue registrado correctamente. A continuacion encontraras
          el resumen de productos, entrega y valores del pedido.
        </p>

        ${renderSummaryGrid([
          {
            label: "Total del pedido",
            value: formatMoney(total),
            options: {
              background: COLORS.primarySoft,
              borderColor: COLORS.primaryLight,
              valueColor: COLORS.primary,
            },
          },
          {
            label: "Fecha limite de pago",
            value: formatDate(paymentDeadline),
          },
        ])}

        ${renderSectionTitle("Productos del pedido", "Detalle de los productos registrados.")}
        ${renderDetailsTable(details)}

        ${renderSectionTitle("Resumen de valores")}
        ${renderSummaryGrid([
          {
            label: "Subtotal",
            value: formatMoney(subtotal),
          },
          {
            label: "IVA",
            value: formatMoney(ivaAmount),
          },
          {
            label: "Envio",
            value: formatMoney(shippingAmount),
          },
          {
            label: "Total",
            value: formatMoney(total),
            options: {
              background: COLORS.primarySoft,
              borderColor: COLORS.primaryLight,
              valueColor: COLORS.primary,
            },
          },
        ])}

        ${renderSectionTitle("Informacion de entrega")}
        ${renderInfoCard(`
          <p style="margin: 0 0 6px;">
            <strong>Tipo de entrega:</strong> ${deliveryType || "No especificado"}
          </p>
          <p style="margin: 0 0 6px;">
            <strong>Persona que recibe/recoge:</strong> ${deliveryRecipient}
          </p>
          <p style="margin: 0 0 6px;">
            <strong>Departamento:</strong> ${deliveryDepartmentName}
          </p>
          <p style="margin: 0 0 6px;">
            <strong>Municipio/Ciudad:</strong> ${deliveryCityName}
          </p>
          <p style="margin: 0;">
            <strong>Direccion:</strong> ${deliveryAddress || "No aplica"}
          </p>
        `)}

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
    shippingAmount,
    deliveryType,
    deliveryAddress,
    deliveryRecipientName,
    deliveryDepartment,
    deliveryCity,
    frontendUrl = getFrontendUrl(),
  }) {
    const name = getName(fullName);
    const orderUrl = `${frontendUrl}/orders/${orderId}`;
    const subject = `Pago registrado - Pedido #${orderId}`;
    const paymentDeliveryDepartmentName =
      deliveryDepartment?.name || deliveryDepartment || "No aplica";
    const paymentDeliveryCityName =
      deliveryCity?.name || deliveryCity || "No aplica";
    const paymentDeliveryRecipient = formatDisplayText(
      deliveryRecipientName,
      "No registrada"
    );

    const text = `Hola ${name},\n\nSe registro un pago para tu pedido #${orderId}.\n\nMetodo: ${paymentMethod || "No especificado"}\nMonto: ${formatMoney(amount)}\nTotal abonado: ${formatMoney(paidAmount)}\nSaldo pendiente: ${formatMoney(pendingAmount)}\nEstado: ${isPaid ? "Pagado" : "Pendiente"}\nReferencia: ${reference || "No aplica"}\nTipo de entrega: ${deliveryType || "No especificado"}\nPersona que recibe/recoge: ${paymentDeliveryRecipient}\nEnvio: ${formatMoney(shippingAmount)}\nDepartamento: ${paymentDeliveryDepartmentName}\nMunicipio/Ciudad: ${paymentDeliveryCityName}\nDireccion: ${deliveryAddress || "No aplica"}\n\n${orderUrl}`;

    const html = baseLayout({
      title: `Pago registrado - Pedido #${orderId}`,
      badge: isPaid ? "Pedido pagado" : "Abono registrado",
      body: `
        <p style="margin-top: 0;">Hola <strong>${name}</strong>,</p>

        <p>
          Se registro un pago o abono para tu pedido. Este es el resumen
          actualizado del estado de pago.
        </p>

        ${renderSummaryGrid([
          {
            label: "Monto registrado",
            value: formatMoney(amount),
            options: {
              background: COLORS.successSoft,
              borderColor: COLORS.successSoft,
              valueColor: COLORS.success,
            },
          },
          {
            label: "Estado del pago",
            value: isPaid ? "Pagado" : "Pendiente",
            options: {
              background: isPaid ? COLORS.successSoft : COLORS.warningSoft,
              borderColor: isPaid ? COLORS.successSoft : COLORS.warningSoft,
              valueColor: isPaid ? COLORS.success : COLORS.warning,
            },
          },
          {
            label: "Total abonado",
            value: formatMoney(paidAmount),
          },
          {
            label: "Saldo pendiente",
            value: formatMoney(pendingAmount),
            options: {
              background: pendingAmount > 0 ? COLORS.warningSoft : COLORS.successSoft,
              borderColor: pendingAmount > 0 ? COLORS.warningSoft : COLORS.successSoft,
              valueColor: pendingAmount > 0 ? COLORS.warning : COLORS.success,
            },
          },
        ])}

        ${renderSectionTitle("Detalle del pago")}
        ${renderInfoCard(`
          <p style="margin: 0 0 6px;">
            <strong>Metodo:</strong> ${paymentMethod || "No especificado"}
          </p>
          <p style="margin: 0;">
            <strong>Referencia:</strong> ${reference || "No aplica"}
          </p>
        `)}

        ${renderSectionTitle("Informacion de entrega")}
        ${renderInfoCard(`
          <p style="margin: 0 0 6px;">
            <strong>Tipo de entrega:</strong> ${deliveryType || "No especificado"}
          </p>
          <p style="margin: 0 0 6px;">
            <strong>Persona que recibe/recoge:</strong> ${paymentDeliveryRecipient}
          </p>
          <p style="margin: 0 0 6px;">
            <strong>Envio:</strong> ${formatMoney(shippingAmount)}
          </p>
          <p style="margin: 0 0 6px;">
            <strong>Departamento:</strong> ${paymentDeliveryDepartmentName}
          </p>
          <p style="margin: 0 0 6px;">
            <strong>Municipio/Ciudad:</strong> ${paymentDeliveryCityName}
          </p>
          <p style="margin: 0;">
            <strong>Direccion:</strong> ${deliveryAddress || "No aplica"}
          </p>
        `)}

        ${renderActionLink(orderUrl, "Ver pedido")}
      `,
    });

    await sendMail({ to, subject, text, html });
  }

  static async sendOrderPaymentReceiptApprovedEmail({
    to,
    fullName,
    orderId,
    amount,
    paidAmount,
    pendingAmount,
    isPaid,
    reviewObservations,
    shippingAmount,
    deliveryType,
    deliveryAddress,
    deliveryRecipientName,
    deliveryDepartment,
    deliveryCity,
    frontendUrl = getFrontendUrl(),
  }) {
    const name = getName(fullName);
    const orderUrl = `${frontendUrl}/orders/${orderId}`;
    const subject = `Comprobante aprobado - Pedido #${orderId}`;
    const approvedDeliveryDepartmentName =
      deliveryDepartment?.name || deliveryDepartment || "No aplica";
    const approvedDeliveryCityName =
      deliveryCity?.name || deliveryCity || "No aplica";
    const approvedDeliveryRecipient = formatDisplayText(
      deliveryRecipientName,
      "No registrada"
    );

    const text = `Hola ${name},\n\nTu comprobante del pedido #${orderId} fue aprobado.\n\nMonto registrado: ${formatMoney(amount)}\nTotal abonado: ${formatMoney(paidAmount)}\nSaldo pendiente: ${formatMoney(pendingAmount)}\nEstado: ${isPaid ? "Pagado" : "Pendiente"}\nObservaciones: ${reviewObservations || "No aplica"}\nTipo de entrega: ${deliveryType || "No especificado"}\nPersona que recibe/recoge: ${approvedDeliveryRecipient}\nEnvio: ${formatMoney(shippingAmount)}\nDepartamento: ${approvedDeliveryDepartmentName}\nMunicipio/Ciudad: ${approvedDeliveryCityName}\nDireccion: ${deliveryAddress || "No aplica"}\n\n${orderUrl}`;

    const html = baseLayout({
      title: `Comprobante aprobado - Pedido #${orderId}`,
      badge: isPaid ? "Pedido pagado" : "Comprobante aprobado",
      body: `
        <p style="margin-top: 0;">Hola <strong>${name}</strong>,</p>

        <p>
          Revisamos el comprobante que enviaste y fue aprobado. El abono ya
          quedo registrado en tu pedido.
        </p>

        ${renderSummaryGrid([
          {
            label: "Monto registrado",
            value: formatMoney(amount),
            options: {
              background: COLORS.successSoft,
              borderColor: COLORS.successSoft,
              valueColor: COLORS.success,
            },
          },
          {
            label: "Estado del pago",
            value: isPaid ? "Pagado" : "Pendiente",
            options: {
              background: isPaid ? COLORS.successSoft : COLORS.warningSoft,
              borderColor: isPaid ? COLORS.successSoft : COLORS.warningSoft,
              valueColor: isPaid ? COLORS.success : COLORS.warning,
            },
          },
          {
            label: "Total abonado",
            value: formatMoney(paidAmount),
          },
          {
            label: "Saldo pendiente",
            value: formatMoney(pendingAmount),
            options: {
              background: pendingAmount > 0 ? COLORS.warningSoft : COLORS.successSoft,
              borderColor: pendingAmount > 0 ? COLORS.warningSoft : COLORS.successSoft,
              valueColor: pendingAmount > 0 ? COLORS.warning : COLORS.success,
            },
          },
        ])}

        ${reviewObservations ? renderInfoCard(`
          <p style="margin: 0 0 6px;">
            <strong>Observaciones de revision:</strong>
          </p>
          <p style="margin: 0;">
            ${reviewObservations}
          </p>
        `, {
          background: COLORS.successSoft,
          borderColor: COLORS.successSoft,
          accentColor: COLORS.success,
        }) : ""}

        ${renderSectionTitle("Informacion de entrega")}
        ${renderInfoCard(`
          <p style="margin: 0 0 6px;">
            <strong>Tipo de entrega:</strong> ${deliveryType || "No especificado"}
          </p>
          <p style="margin: 0 0 6px;">
            <strong>Persona que recibe/recoge:</strong> ${approvedDeliveryRecipient}
          </p>
          <p style="margin: 0 0 6px;">
            <strong>Envio:</strong> ${formatMoney(shippingAmount)}
          </p>
          <p style="margin: 0 0 6px;">
            <strong>Departamento:</strong> ${approvedDeliveryDepartmentName}
          </p>
          <p style="margin: 0 0 6px;">
            <strong>Municipio/Ciudad:</strong> ${approvedDeliveryCityName}
          </p>
          <p style="margin: 0;">
            <strong>Direccion:</strong> ${deliveryAddress || "No aplica"}
          </p>
        `)}

        ${renderActionLink(orderUrl, "Ver pedido")}
      `,
    });

    await sendMail({ to, subject, text, html });
  }

  static async sendOrderPaymentReceiptRejectedEmail({
    to,
    fullName,
    orderId,
    reason,
    shippingAmount,
    deliveryType,
    deliveryAddress,
    deliveryRecipientName,
    deliveryDepartment,
    deliveryCity,
    frontendUrl = getFrontendUrl(),
  }) {
    const name = getName(fullName);
    const orderUrl = `${frontendUrl}/orders/${orderId}`;
    const subject = `Comprobante rechazado - Pedido #${orderId}`;
    const rejectedDeliveryDepartmentName =
      deliveryDepartment?.name || deliveryDepartment || "No aplica";
    const rejectedDeliveryCityName =
      deliveryCity?.name || deliveryCity || "No aplica";
    const rejectedDeliveryRecipient = formatDisplayText(
      deliveryRecipientName,
      "No registrada"
    );

    const text = `Hola ${name},\n\nTu comprobante del pedido #${orderId} fue rechazado.\n\nMotivo: ${reason || "No especificado"}\nTipo de entrega: ${deliveryType || "No especificado"}\nPersona que recibe/recoge: ${rejectedDeliveryRecipient}\nEnvio: ${formatMoney(shippingAmount)}\nDepartamento: ${rejectedDeliveryDepartmentName}\nMunicipio/Ciudad: ${rejectedDeliveryCityName}\nDireccion: ${deliveryAddress || "No aplica"}\n\nPuedes revisar el pedido y enviar un nuevo comprobante si el saldo continua pendiente.\n\n${orderUrl}`;

    const html = baseLayout({
      title: `Comprobante rechazado - Pedido #${orderId}`,
      badge: "Comprobante rechazado",
      body: `
        <p style="margin-top: 0;">Hola <strong>${name}</strong>,</p>

        <p>
          Revisamos el comprobante que enviaste y no fue posible aprobarlo.
          Puedes revisar el motivo y enviar un nuevo comprobante si el pedido
          aun tiene saldo pendiente.
        </p>

        ${renderAlertBox(`
          <p style="margin: 0 0 8px;">
            <strong>Motivo de rechazo:</strong>
          </p>
          <p style="margin: 0;">
            ${reason || "No especificado"}
          </p>
        `, "danger")}

        ${renderSectionTitle("Informacion de entrega")}
        ${renderInfoCard(`
          <p style="margin: 0 0 6px;">
            <strong>Tipo de entrega:</strong> ${deliveryType || "No especificado"}
          </p>
          <p style="margin: 0 0 6px;">
            <strong>Persona que recibe/recoge:</strong> ${rejectedDeliveryRecipient}
          </p>
          <p style="margin: 0 0 6px;">
            <strong>Envio:</strong> ${formatMoney(shippingAmount)}
          </p>
          <p style="margin: 0 0 6px;">
            <strong>Departamento:</strong> ${rejectedDeliveryDepartmentName}
          </p>
          <p style="margin: 0 0 6px;">
            <strong>Municipio/Ciudad:</strong> ${rejectedDeliveryCityName}
          </p>
          <p style="margin: 0;">
            <strong>Direccion:</strong> ${deliveryAddress || "No aplica"}
          </p>
        `)}

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
    shippingAmount,
    deliveryType,
    deliveryAddress,
    deliveryRecipientName,
    deliveryDepartment,
    deliveryCity,
    frontendUrl = getFrontendUrl(),
  }) {
    const name = getName(fullName);
    const orderUrl = `${frontendUrl}/orders/${orderId}`;
    const subject = `Estado actualizado - Pedido #${orderId}`;
    const statusDeliveryDepartmentName =
      deliveryDepartment?.name || deliveryDepartment || "No aplica";
    const statusDeliveryCityName =
      deliveryCity?.name || deliveryCity || "No aplica";
    const statusDeliveryRecipient = formatDisplayText(
      deliveryRecipientName,
      "No registrada"
    );

    const text = `Hola ${name},\n\nEl estado de tu pedido #${orderId} cambio de ${previousStatus || "No especificado"} a ${newStatus}.\n\nEntrega: ${deliveryType || "No especificado"}\nPersona que recibe/recoge: ${statusDeliveryRecipient}\nEnvio: ${formatMoney(shippingAmount)}\nDepartamento: ${statusDeliveryDepartmentName}\nMunicipio/Ciudad: ${statusDeliveryCityName}\nDireccion: ${deliveryAddress || "No aplica"}\n\n${orderUrl}`;

    const html = baseLayout({
      title: `Estado actualizado - Pedido #${orderId}`,
      badge: "Actualizacion de pedido",
      body: `
        <p style="margin-top: 0;">Hola <strong>${name}</strong>,</p>

        <p>
          El estado de tu pedido fue actualizado. Puedes revisar el detalle
          completo desde el sistema.
        </p>

        ${renderSectionTitle("Cambio de estado")}

        ${renderSummaryGrid([
          {
            label: "Estado anterior",
            value: previousStatus || "No especificado",
          },
          {
            label: "Nuevo estado",
            value: newStatus,
            options: {
              background: COLORS.primarySoft,
              borderColor: COLORS.primaryLight,
              valueColor: COLORS.primary,
            },
          },
        ])}

        ${renderSectionTitle("Informacion de entrega")}
        ${renderInfoCard(`
          <p style="margin: 0 0 6px;">
            <strong>Tipo de entrega:</strong> ${deliveryType || "No especificado"}
          </p>
          <p style="margin: 0 0 6px;">
            <strong>Persona que recibe/recoge:</strong> ${statusDeliveryRecipient}
          </p>
          <p style="margin: 0 0 6px;">
            <strong>Envio:</strong> ${formatMoney(shippingAmount)}
          </p>
          <p style="margin: 0 0 6px;">
            <strong>Departamento:</strong> ${statusDeliveryDepartmentName}
          </p>
          <p style="margin: 0 0 6px;">
            <strong>Municipio/Ciudad:</strong> ${statusDeliveryCityName}
          </p>
          <p style="margin: 0;">
            <strong>Direccion:</strong> ${deliveryAddress || "No aplica"}
          </p>
        `)}

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
    shippingAmount,
    deliveryType,
    deliveryAddress,
    deliveryRecipientName,
    deliveryDepartment,
    deliveryCity,
    frontendUrl = getFrontendUrl(),
  }) {
    const name = getName(fullName);
    const orderUrl = `${frontendUrl}/orders/${orderId}`;
    const subject = `Pedido cancelado - #${orderId}`;
    const cancelledDeliveryDepartmentName =
      deliveryDepartment?.name || deliveryDepartment || "No aplica";
    const cancelledDeliveryCityName =
      deliveryCity?.name || deliveryCity || "No aplica";
    const cancelledDeliveryRecipient = formatDisplayText(
      deliveryRecipientName,
      "No registrada"
    );

    const text = `Hola ${name},\n\nTu pedido #${orderId} fue cancelado.\n\nMotivo: ${reason || "No especificado"}\nTotal: ${formatMoney(total)}\nTipo de entrega: ${deliveryType || "No especificado"}\nPersona que recibe/recoge: ${cancelledDeliveryRecipient}\nEnvio: ${formatMoney(shippingAmount)}\nDepartamento: ${cancelledDeliveryDepartmentName}\nMunicipio/Ciudad: ${cancelledDeliveryCityName}\nDireccion: ${deliveryAddress || "No aplica"}\n\n${orderUrl}`;

    const html = baseLayout({
      title: `Pedido cancelado #${orderId}`,
      badge: "Pedido cancelado",
      body: `
        <p style="margin-top: 0;">Hola <strong>${name}</strong>,</p>

        <p>
          Te informamos que tu pedido fue cancelado.
        </p>

        ${renderAlertBox(`
          <p style="margin: 0 0 8px;">
            <strong>Motivo de cancelacion:</strong>
          </p>
          <p style="margin: 0;">
            ${reason || "No especificado"}
          </p>
        `, "danger")}

        ${renderSummaryGrid([
          {
            label: "Total del pedido",
            value: formatMoney(total),
            options: {
              background: COLORS.dangerSoft,
              borderColor: COLORS.dangerSoft,
              valueColor: COLORS.danger,
            },
          },
        ])}

        ${renderSectionTitle("Informacion de entrega")}
        ${renderInfoCard(`
          <p style="margin: 0 0 6px;">
            <strong>Tipo de entrega:</strong> ${deliveryType || "No especificado"}
          </p>
          <p style="margin: 0 0 6px;">
            <strong>Persona que recibe/recoge:</strong> ${cancelledDeliveryRecipient}
          </p>
          <p style="margin: 0 0 6px;">
            <strong>Envio:</strong> ${formatMoney(shippingAmount)}
          </p>
          <p style="margin: 0 0 6px;">
            <strong>Departamento:</strong> ${cancelledDeliveryDepartmentName}
          </p>
          <p style="margin: 0 0 6px;">
            <strong>Municipio/Ciudad:</strong> ${cancelledDeliveryCityName}
          </p>
          <p style="margin: 0;">
            <strong>Direccion:</strong> ${deliveryAddress || "No aplica"}
          </p>
        `)}

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

    const creditAmount = credit?.creditAmount || credit?.credit_amount;
    const remainingBalance = credit?.remainingBalance || credit?.remaining_balance;
    const dueDate = credit?.dueDate || credit?.due_date;

    const creditText = credit
      ? `\nCredito: ${formatMoney(creditAmount)}\nSaldo credito: ${formatMoney(remainingBalance)}\nVencimiento: ${formatDate(dueDate)}`
      : "";

    const text = `Hola ${name},\n\nTu venta #${saleId} fue registrada.\n\nPedido relacionado: #${orderId}\nSubtotal: ${formatMoney(subtotal)}\nTotal: ${formatMoney(total)}${creditText}\n\n${saleUrl}`;

    const html = baseLayout({
      title: `Venta registrada #${saleId}`,
      badge: "Venta completada",
      body: `
        <p style="margin-top: 0;">Hola <strong>${name}</strong>,</p>

        <p>
          Tu venta fue registrada correctamente. A continuacion encontraras
          el resumen de productos, pagos y valores asociados.
        </p>

        ${renderSummaryGrid([
          {
            label: "Venta",
            value: `#${saleId}`,
            options: {
              background: COLORS.primarySoft,
              borderColor: COLORS.primaryLight,
              valueColor: COLORS.primary,
            },
          },
          {
            label: "Pedido relacionado",
            value: `#${orderId}`,
          },
          {
            label: "Subtotal",
            value: formatMoney(subtotal),
          },
          {
            label: "Total",
            value: formatMoney(total),
            options: {
              background: COLORS.successSoft,
              borderColor: COLORS.successSoft,
              valueColor: COLORS.success,
            },
          },
        ])}

        ${renderSectionTitle("Productos vendidos", "Detalle de los productos asociados a la venta.")}
        ${renderDetailsTable(details)}

        ${renderSectionTitle("Metodos de pago")}
        ${renderPaymentMethods(paymentMethods)}

        ${credit ? `
          ${renderSectionTitle("Informacion de credito")}
          ${renderAlertBox(`
            <p style="margin: 0 0 8px;">
              Esta venta incluye una parte financiada a credito.
            </p>
            <p style="margin: 0 0 6px;">
              <strong>Monto financiado:</strong> ${formatMoney(creditAmount)}
            </p>
            <p style="margin: 0 0 6px;">
              <strong>Saldo pendiente:</strong> ${formatMoney(remainingBalance)}
            </p>
            <p style="margin: 0;">
              <strong>Fecha de vencimiento:</strong> ${formatDate(dueDate)}
            </p>
          `, "warning")}
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
      badge: "Venta anulada",
      body: `
        <p style="margin-top: 0;">Hola <strong>${name}</strong>,</p>

        <p>
          Te informamos que la venta relacionada a tu pedido fue anulada.
        </p>

        ${renderSummaryGrid([
          {
            label: "Venta",
            value: `#${saleId}`,
            options: {
              background: COLORS.dangerSoft,
              borderColor: COLORS.dangerSoft,
              valueColor: COLORS.danger,
            },
          },
          {
            label: "Pedido relacionado",
            value: `#${orderId}`,
          },
          {
            label: "Total de la venta",
            value: formatMoney(total),
          },
          {
            label: "Cupo restaurado",
            value: formatMoney(creditRestoredAmount),
            options: {
              background: COLORS.primarySoft,
              borderColor: COLORS.primaryLight,
              valueColor: COLORS.primary,
            },
          },
        ])}

        ${renderAlertBox(`
          <p style="margin: 0 0 8px;">
            <strong>Motivo de anulacion:</strong>
          </p>
          <p style="margin: 0;">
            ${reason || "No especificado"}
          </p>
        `, "danger")}

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
    shippingAmount,
    deliveryType,
    deliveryAddress,
    deliveryRecipientName,
    deliveryDepartment,
    deliveryCity,
    frontendUrl = getFrontendUrl(),
  }) {
    const name = getName(fullName);
    const orderUrl = `${frontendUrl}/orders/${orderId}`;
    const subject = `Recordatorio de pago pendiente - Pedido #${orderId}`;
    const reminderDeliveryDepartmentName =
      deliveryDepartment?.name || deliveryDepartment || "No aplica";
    const reminderDeliveryCityName =
      deliveryCity?.name || deliveryCity || "No aplica";
    const reminderDeliveryRecipient = formatDisplayText(
      deliveryRecipientName,
      "No registrada"
    );

    const text = `Hola ${name},\n\nTu pedido #${orderId} aun tiene un saldo pendiente de pago.\n\nTotal del pedido: ${formatMoney(orderTotal)}\nTotal abonado: ${formatMoney(paidAmount)}\nSaldo pendiente: ${formatMoney(pendingAmount)}\nFecha limite de pago: ${formatDate(paymentDeadline)}\nTiempo restante aproximado: ${hoursRemaining} hora(s).\nTipo de entrega: ${deliveryType || "No especificado"}\nPersona que recibe/recoge: ${reminderDeliveryRecipient}\nEnvio: ${formatMoney(shippingAmount)}\nDepartamento: ${reminderDeliveryDepartmentName}\nMunicipio/Ciudad: ${reminderDeliveryCityName}\nDireccion: ${deliveryAddress || "No aplica"}\n\n${orderUrl}`;

    const html = baseLayout({
      title: "Recordatorio de pago pendiente",
      badge: "Pago pendiente",
      body: `
        <p style="margin-top: 0;">Hola <strong>${name}</strong>,</p>

        <p>
          Tu pedido <strong>#${orderId}</strong> aun tiene un saldo pendiente.
          Recuerda completar el pago antes de la fecha limite.
        </p>

        ${renderSummaryGrid([
          {
            label: "Total del pedido",
            value: formatMoney(orderTotal),
          },
          {
            label: "Total abonado",
            value: formatMoney(paidAmount),
            options: {
              background: COLORS.successSoft,
              borderColor: COLORS.successSoft,
              valueColor: COLORS.success,
            },
          },
          {
            label: "Saldo pendiente",
            value: formatMoney(pendingAmount),
            options: {
              background: COLORS.warningSoft,
              borderColor: COLORS.warningSoft,
              valueColor: COLORS.warning,
            },
          },
          {
            label: "Tiempo restante",
            value: `${hoursRemaining} hora(s)`,
            options: {
              background: COLORS.warningSoft,
              borderColor: COLORS.warningSoft,
              valueColor: COLORS.warning,
            },
          },
        ])}

        ${renderAlertBox(`
          <p style="margin: 0 0 6px;">
            <strong>Fecha limite de pago:</strong> ${formatDate(paymentDeadline)}
          </p>
          <p style="margin: 0;">
            Si el pedido no se paga por completo antes de la fecha limite,
            sera cancelado automaticamente.
          </p>
        `, "warning")}

        ${renderSectionTitle("Informacion de entrega")}
        ${renderInfoCard(`
          <p style="margin: 0 0 6px;">
            <strong>Tipo de entrega:</strong> ${deliveryType || "No especificado"}
          </p>
          <p style="margin: 0 0 6px;">
            <strong>Persona que recibe/recoge:</strong> ${reminderDeliveryRecipient}
          </p>
          <p style="margin: 0 0 6px;">
            <strong>Envio:</strong> ${formatMoney(shippingAmount)}
          </p>
          <p style="margin: 0 0 6px;">
            <strong>Departamento:</strong> ${reminderDeliveryDepartmentName}
          </p>
          <p style="margin: 0 0 6px;">
            <strong>Municipio/Ciudad:</strong> ${reminderDeliveryCityName}
          </p>
          <p style="margin: 0;">
            <strong>Direccion:</strong> ${deliveryAddress || "No aplica"}
          </p>
        `)}

        ${renderActionLink(orderUrl, "Ver pedido")}
      `,
    });

    await sendMail({ to, subject, text, html });
  }
}
