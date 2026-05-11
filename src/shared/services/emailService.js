import nodemailer from "nodemailer";

const mailConfig = {
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT ? Number(process.env.EMAIL_PORT) : undefined,
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
};

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
}