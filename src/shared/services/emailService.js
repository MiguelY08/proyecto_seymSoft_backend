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

export class EmailService {
  static async sendPasswordResetEmail(
    to,
    verificationCode,
    fullName,
    frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000"
  ) {
    const from = getEmailFrom();
    const subject = "Codigo para restablecer tu contrasena";
    const name = fullName ? `${fullName}` : "usuario";
    const resetPageUrl = `${frontendUrl}/resetpassword`;

    const text = `Hola ${name},\n\nHemos recibido una solicitud para restablecer la contrasena de tu cuenta.\n\nTu codigo de verificacion es: ${verificationCode}\n\nIngresa este codigo en la pantalla de recuperacion de contrasena de la aplicacion.\n\nSi no solicitaste este cambio, ignora este mensaje.\n\nGracias.`;

    const html = `
      <p>Hola ${name},</p>
      <p>Hemos recibido una solicitud para restablecer la contrasena de tu cuenta.</p>
      <p>Tu codigo de verificacion es:</p>
      <h2 style="color: #007bff;">${verificationCode}</h2>
      <p>Ingresa este codigo en la pantalla de recuperacion de contrasena de la aplicacion.</p>
      <p>Si necesitas ir al formulario, puedes usar este enlace:</p>
      <p><a href="${resetPageUrl}">${resetPageUrl}</a></p>
      <p>Si no solicitaste este cambio, ignora este mensaje.</p>
      <p>Gracias.</p>
    `;

    await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
    });
  }

  static async sendWelcomeEmail(
    to,
    tempPassword,
    fullName,
    frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000"
  ) {
    const from = getEmailFrom();
    const subject = "Bienvenido. Acceso a tu cuenta";
    const name = fullName ? `${fullName}` : "usuario";
    const loginPageUrl = `${frontendUrl}/login`;

    const text = `Hola ${name},\n\nTu cuenta ha sido creada exitosamente.\n\nTu contrasena temporal es: ${tempPassword}\n\nInicia sesion en: ${loginPageUrl}\n\nPor seguridad, te recomendamos cambiar tu contrasena en el primer inicio de sesion.\n\nSi tienes dudas, contacta al administrador.\n\nGracias.`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Bienvenido, ${name}</h2>
        <p>Tu cuenta ha sido creada exitosamente en nuestra plataforma.</p>
        <p><strong>Tu contrasena temporal es:</strong></p>
        <div style="background: #f8f9fa; border-left: 4px solid #007bff; padding: 15px; margin: 20px 0;">
          <h3 style="color: #007bff; margin: 0; font-size: 24px; letter-spacing: 2px;">${tempPassword}</h3>
        </div>
        <p><strong>Pasos para acceder:</strong></p>
        <ol>
          <li>Dirigete a: <a href="${loginPageUrl}">${loginPageUrl}</a></li>
          <li>Ingresa tu correo: <strong>${to}</strong></li>
          <li>Ingresa tu contrasena temporal</li>
          <li>Cambia tu contrasena inmediatamente.</li>
        </ol>
        <p>Si tienes alguna pregunta o problema, contacta al administrador de la plataforma.</p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">Saludos,<br><strong>El equipo de la plataforma</strong></p>
      </div>
    `;

    await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
    });
  }

  static async sendLandingWelcomeEmail(
    to,
    fullName,
    frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000"
  ) {
    const from = getEmailFrom();
    const subject = "Bienvenido a SeymSoft";
    const name = fullName ? `${fullName}` : "usuario";
    const loginPageUrl = `${frontendUrl}/login`;

    const text = `Hola ${name},\n\nTu cuenta ha sido creada exitosamente y ya esta lista para usar.\n\nAhora puedes iniciar sesion y comenzar a utilizar la plataforma.\n\nAccede aqui:\n${loginPageUrl}\n\nPor seguridad, recuerda no compartir tu contrasena con otras personas.\n\nBienvenido a Papeleria Magic.`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Bienvenido a Papeleria Magic, ${name}</h2>
        <p>Tu cuenta ha sido creada exitosamente y ya esta lista para usar.</p>
        <p>Ahora puedes iniciar sesion y comenzar a utilizar la plataforma.</p>
        <div style="margin: 30px 0;">
          <a href="${loginPageUrl}" style="background-color: #007bff; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Iniciar sesion</a>
        </div>
        <p>Si tienes alguna duda o inconveniente, puedes contactar al soporte de la plataforma.</p>
        <p style="color: #666; font-size: 12px; margin-top: 40px;">Saludos,<br><strong>Equipo SeymSoft</strong></p>
      </div>
    `;

    await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
    });
  }

  static async sendEmailChangeNotification(
    oldEmail,
    newEmail,
    fullName,
    frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173"
  ) {
    const from = getEmailFrom();
    const subject = "Notificacion: Tu email fue cambiado";
    const name = fullName ? `${fullName}` : "usuario";

    const text = `Hola ${name},\n\nTe notificamos que el email asociado a tu cuenta fue cambiado.\n\nEmail anterior: ${oldEmail}\nEmail nuevo: ${newEmail}\n\nSi no realizaste este cambio, contacta al soporte inmediatamente.\n\nGracias.`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Notificacion de cambio de email</h2>
        <p>Hola ${name},</p>
        <p>Te notificamos que el email asociado a tu cuenta fue cambiado.</p>
        <div style="background: #f8f9fa; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 5px 0;"><strong>Email anterior:</strong> ${oldEmail}</p>
          <p style="margin: 5px 0;"><strong>Email nuevo:</strong> ${newEmail}</p>
        </div>
        <p>Si no realizaste este cambio, contacta al soporte inmediatamente para proteger tu cuenta.</p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">Saludos,<br><strong>El equipo de SeymSoft</strong></p>
      </div>
    `;

    await transporter.sendMail({
      from,
      to: oldEmail,
      subject,
      text,
      html,
    });
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
    frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000",
  }) {
    const from = getEmailFrom();
    const name = fullName ? `${fullName}` : "usuario";
    const orderUrl = `${frontendUrl}/orders/${orderId}`;
    const deadline = paymentDeadline
      ? new Date(paymentDeadline).toLocaleString("es-CO")
      : "No disponible";

    const subject = `Recordatorio de pago pendiente - Pedido #${orderId}`;

    const text = `Hola ${name},\n\nTu pedido #${orderId} aun tiene un saldo pendiente de pago.\n\nTotal del pedido: ${orderTotal}\nTotal abonado: ${paidAmount}\nSaldo pendiente: ${pendingAmount}\nFecha limite de pago: ${deadline}\nTiempo restante aproximado: ${hoursRemaining} hora(s).\n\nPuedes revisar tu pedido aqui:\n${orderUrl}\n\nSi ya realizaste el pago, por favor ignora este mensaje.\n\nGracias.`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Recordatorio de pago pendiente</h2>
        <p>Hola ${name},</p>
        <p>Tu pedido <strong>#${orderId}</strong> aun tiene un saldo pendiente de pago.</p>
        <div style="background: #f8f9fa; border-left: 4px solid #007bff; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 5px 0;"><strong>Total del pedido:</strong> ${orderTotal}</p>
          <p style="margin: 5px 0;"><strong>Total abonado:</strong> ${paidAmount}</p>
          <p style="margin: 5px 0;"><strong>Saldo pendiente:</strong> ${pendingAmount}</p>
          <p style="margin: 5px 0;"><strong>Fecha limite:</strong> ${deadline}</p>
          <p style="margin: 5px 0;"><strong>Tiempo restante:</strong> ${hoursRemaining} hora(s)</p>
        </div>
        <p>Si el pedido no se paga por completo antes de la fecha limite, sera cancelado automaticamente.</p>
        <div style="margin: 30px 0;">
          <a href="${orderUrl}" style="background-color: #007bff; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Ver pedido</a>
        </div>
        <p>Si ya realizaste el pago, por favor ignora este mensaje.</p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">Saludos,<br><strong>Equipo SeymSoft</strong></p>
      </div>
    `;

    await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
    });
  }
}
