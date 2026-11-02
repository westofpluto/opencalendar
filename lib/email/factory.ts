import type { Env } from "@/lib/env";
import type { Mailer } from "./types";

/**
 * The only provider-selection boundary. Jobs, auth, templates and booking logic
 * receive Mailer and never import a vendor SDK or branch on a provider name.
 * Load only the chosen adapter (Resend does not initialize SMTP).
 */
export async function createMailer(
  env: Pick<Env, "EMAIL_PROVIDER" | "RESEND_API_KEY" | "SMTP_HOST" | "SMTP_PORT" | "SMTP_SECURE" | "SMTP_USER" | "SMTP_PASSWORD">,
): Promise<Mailer> {
  switch (env.EMAIL_PROVIDER) {
    case "resend": {
      if (!env.RESEND_API_KEY) throw new Error("RESEND_API_KEY is required for EMAIL_PROVIDER=resend");
      const { createResendMailer } = await import("./resend");
      return createResendMailer(env.RESEND_API_KEY);
    }
    case "smtp": {
      if (!env.SMTP_HOST) throw new Error("SMTP_HOST is required for EMAIL_PROVIDER=smtp");
      const { createSmtpMailer } = await import("./smtp");
      return createSmtpMailer(env);
    }
    default: {
      const unsupported: never = env.EMAIL_PROVIDER;
      throw new Error(`Unsupported email provider: ${unsupported}`);
    }
  }
}
