import type { Mailer } from "./types";

/** HTTPS transport for hosts such as Railway Hobby that block outbound SMTP. */
export function createResendMailer(apiKey: string, request: typeof fetch = fetch): Mailer {
  return {
    async send({ calendar, ...email }) {
      const response = await request("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...email,
          to: [email.to],
          ...(calendar && {
            attachments: [{
              filename: "invite.ics",
              content: Buffer.from(calendar.content).toString("base64"),
              content_type: `text/calendar; method=${calendar.method}; charset=utf-8`,
            }],
          }),
        }),
        signal: AbortSignal.timeout(30_000),
      });
      if (!response.ok) {
        // Never log the request or response body: either can contain private account links.
        throw new Error(`Resend email failed (HTTP ${response.status})`);
      }
    },
  };
}
