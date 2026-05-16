import nodemailer from "nodemailer";

// DEBUG: Ver qué variables se cargan
console.log("🔍 EMAIL CONFIG DEBUG:");
console.log("  USER:", process.env.EMAIL_USER);
console.log("  PASS:", process.env.EMAIL_PASSWORD ? "✅ CARGADO" : "❌ FALTA");
console.log("  HOST:", process.env.EMAIL_HOST);
console.log("  PORT:", process.env.EMAIL_PORT);

const mailConfig = {
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT ? Number(process.env.EMAIL_PORT) : undefined,
  secure: false,  // ← Cambia a false temporalmente para debug
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
};

console.log("📧 Mail Config:", mailConfig);

const transporter = nodemailer.createTransport(mailConfig);

export class EmailService {
  static async sendPasswordResetEmail(
    to,
    verificationCode,
    fullName,
    frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000"
  ) {
    const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;
    if (!from) {
      throw new Error(
        "EMAIL_FROM or EMAIL_USER must be configured to send emails"
      );
    }

    const subject = "Código para restablecer tu contraseña";
    const name = fullName ? `${fullName}` : "usuario";
    const resetPageUrl = `${frontendUrl}/reset-password`;

    const text = `Hola ${name},\n\nHemos recibido una solicitud para restablecer la contraseña de tu cuenta.\n\nTu código de verificación es: ${verificationCode}\n\nIngresa este código en la pantalla de recuperación de contraseña de la aplicación.\n\nSi no solicitaste este cambio, ignora este mensaje.\n\nGracias.`;
    const html = `
      <p>Hola ${name},</p>
      <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta.</p>
      <p>Tu código de verificación es:</p>
      <h2 style="color: #007bff;">${verificationCode}</h2>
      <p>Ingresa este código en la pantalla de recuperación de contraseña de la aplicación.</p>
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

  /**
   * Envía email de bienvenida con contraseña temporal al crear un usuario
   * 
   * @param {string} to - Email del usuario
   * @param {string} tempPassword - Contraseña temporal generada
   * @param {string} fullName - Nombre completo del usuario
   * @param {string} frontendUrl - URL del frontend para login
   * 
   * @throws {Error} Si EMAIL_FROM no está configurado
   * 
   * Ejemplo:
   * await EmailService.sendWelcomeEmail(
   *   "juan@example.com",
   *   "3K9mL7x2Qw",
   *   "Juan Pérez"
   * );
   */
  static async sendWelcomeEmail(
    to,
    tempPassword,
    fullName,
    frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000"
  ) {
    const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;
    if (!from) {
      throw new Error(
        "EMAIL_FROM or EMAIL_USER must be configured to send emails"
      );
    }

    const subject = "¡Bienvenido! Acceso a tu cuenta";
    const name = fullName ? `${fullName}` : "usuario";
    const loginPageUrl = `${frontendUrl}/login`;

    const text = `Hola ${name},\n\nTu cuenta ha sido creada exitosamente.\n\nTu contraseña temporal es: ${tempPassword}\n\nInicia sesión en: ${loginPageUrl}\n\nPor seguridad, te recomendamos cambiar tu contraseña en el primer inicio de sesión.\n\nSi tienes dudas, contacta al administrador.\n\nGracias.`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">¡Bienvenido, ${name}!</h2>
        
        <p>Tu cuenta ha sido creada exitosamente en nuestra plataforma.</p>
        
        <p><strong>Tu contraseña temporal es:</strong></p>
        <div style="background: #f8f9fa; border-left: 4px solid #007bff; padding: 15px; margin: 20px 0;">
          <h3 style="color: #007bff; margin: 0; font-size: 24px; letter-spacing: 2px;">
            ${tempPassword}
          </h3>
        </div>
        
        <p><strong>Pasos para acceder:</strong></p>
        <ol>
          <li>Dirígete a: <a href="${loginPageUrl}">${loginPageUrl}</a></li>
          <li>Ingresa tu correo: <strong>${to}</strong></li>
          <li>Ingresa tu contraseña temporal</li>
          <li>Cambia tu contraseña inmediatamente (recomendado)</li>
        </ol>
        
        <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; color: #856404;">
            <strong>⚠️ Nota de seguridad:</strong> Por favor, cambia tu contraseña en tu primer inicio de sesión para mayor seguridad.
          </p>
        </div>
        
        <p>Si tienes alguna pregunta o problema, contacta al administrador de la plataforma.</p>
        
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          Saludos,<br>
          <strong>El equipo de la plataforma</strong>
        </p>
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
  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;

  if (!from) {
    throw new Error(
      "EMAIL_FROM or EMAIL_USER must be configured to send emails"
    );
  }

  const subject = "¡Bienvenido a SeymSoft!";
  const name = fullName ? `${fullName}` : "usuario";
  const loginPageUrl = `${frontendUrl}/login`;

  const text = `
Hola ${name},

Tu cuenta ha sido creada exitosamente y ya está lista para usar.

Ahora puedes iniciar sesión y comenzar a utilizar la plataforma.

Accede aquí:
${loginPageUrl}

Por seguridad, recuerda no compartir tu contraseña con otras personas.

Si tienes alguna duda o inconveniente, contacta al soporte de la plataforma.

Bienvenido a Papeleria Magic.
`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      
      <h2 style="color: #333;">
        ¡Bienvenido a Papeleria Magic, ${name}!
      </h2>

      <p>
        Tu cuenta ha sido creada exitosamente y ya está lista para usar.
      </p>

      <p>
        Ahora puedes iniciar sesión y comenzar a utilizar la plataforma.
      </p>

      <div style="margin: 30px 0;">
        <a
          href="${loginPageUrl}"
          style="
            background-color: #007bff;
            color: #ffffff;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            display: inline-block;
            font-weight: bold;
          "
        >
          Iniciar sesión
        </a>
      </div>

      <div
        style="
          background: #f8f9fa;
          border-left: 4px solid #007bff;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        "
      >
        <p style="margin: 0; color: #555;">
          🔒 Por seguridad, recuerda mantener tu contraseña protegida y no compartirla con terceros.
        </p>
      </div>

      <p>
        Si tienes alguna duda o inconveniente, puedes contactar al soporte de la plataforma.
      </p>

      <p style="color: #666; font-size: 12px; margin-top: 40px;">
        Saludos,<br />
        <strong>Equipo SeymSoft</strong>
      </p>
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

/**
 * Envía notificación cuando el usuario cambia su email
 */
static async sendEmailChangeNotification(
  oldEmail,
  newEmail,
  fullName,
  frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173"
) {
  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  if (!from) {
    throw new Error("EMAIL_FROM or EMAIL_USER must be configured");
  }

  const subject = "Notificación: Tu email fue cambiado";
  const name = fullName ? `${fullName}` : "usuario";

  const text = `Hola ${name},\n\nTe notificamos que el email asociado a tu cuenta fue cambiado.\n\nEmail anterior: ${oldEmail}\nEmail nuevo: ${newEmail}\n\nSi no realizaste este cambio, contacta al soporte inmediatamente.\n\nGracias.`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #333;">Notificación de Cambio de Email</h2>
      
      <p>Hola ${name},</p>
      
      <p>Te notificamos que el email asociado a tu cuenta fue cambiado.</p>
      
      <div style="background: #f8f9fa; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 5px 0;"><strong>Email anterior:</strong> ${oldEmail}</p>
        <p style="margin: 5px 0;"><strong>Email nuevo:</strong> ${newEmail}</p>
      </div>
      
      <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; color: #856404;">
          <strong>⚠️ Seguridad:</strong> Si no realizaste este cambio, contacta al soporte inmediatamente para proteger tu cuenta.
        </p>
      </div>
      
      <p>Si tienes preguntas, contacta al soporte de la plataforma.</p>
      
      <p style="color: #666; font-size: 12px; margin-top: 30px;">
        Saludos,<br>
        <strong>El equipo de SeymSoft</strong>
      </p>
    </div>
  `;

  await transporter.sendMail({
    from,
    to: oldEmail,  // ← IMPORTANTE: Envía al email ANTERIOR
    subject,
    text,
    html,
  });
}
}