import nodemailer from "nodemailer";

export type SendMailInput = {
  to: string;
  subject: string;
  html: string;
  /** Adjunto HTML de la orden (opcional) */
  attachments?: {
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }[];
};

export function mailConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      (process.env.SMTP_FROM || process.env.SMTP_USER)
  );
}

export async function sendMail(input: SendMailInput) {
  if (!mailConfigured()) {
    throw new Error(
      "Correo no configurado. Definí SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS y SMTP_FROM en .env"
    );
  }

  const port = Number(process.env.SMTP_PORT || "587");
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: input.to,
    subject: input.subject,
    html: input.html,
    attachments: input.attachments,
  });
}
