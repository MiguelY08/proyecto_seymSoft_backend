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
    frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000",
  ) {
    const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;
    if (!from) {
      throw new Error(
        "EMAIL_FROM or EMAIL_USER must be configured to send emails",
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
}
