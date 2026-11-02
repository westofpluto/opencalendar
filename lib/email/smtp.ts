import nodemailer from "nodemailer";
import type { Env } from "@/lib/env";
import type { Mailer } from "./types";

export function createSmtpMailer(
  env: Pick<Env, "SMTP_HOST" | "SMTP_PORT" | "SMTP_SECURE" | "SMTP_USER" | "SMTP_PASSWORD">,
): Mailer {
  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } : undefined,
  });
  return {
    async send({ calendar, ...email }) {
      await transporter.sendMail({
        ...email,
        ...(calendar && {
          icalEvent: { method: calendar.method, filename: "invite.ics", content: calendar.content },
        }),
      });
    },
  };
}
