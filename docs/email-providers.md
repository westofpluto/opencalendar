# Replaceable email delivery providers

Email delivery is a replaceable infrastructure dependency, not part of scheduling
or automation logic. Resend is one adapter, not the application's mail system.

## Boundaries

- `lib/email/types.ts`: provider-neutral OutgoingEmail and Mailer contract.
- `lib/email/smtp.ts`: standard SMTP adapter for any compatible SMTP service.
- `lib/email/resend.ts`: Resend-specific HTTPS request/attachment mapping.
- `lib/email/factory.ts`: the only adapter-selection boundary.
- `jobs/start.ts`: constructs the Mailer once and injects it into the worker.
- `jobs/email-send.ts`: renders templates, applies communication policy and calls
  Mailer.send. It knows nothing about provider credentials or APIs.
- The database queue stores our own encrypted template data, never vendor
  templates, contact IDs, audiences, workflows or automation definitions.

No Resend contact lists, templates or automations are used. Auth emails are
rendered by OpenCalendar; CRMCore owns customer communications when
BOOKING_EMAILS_ENABLED=false.

## Switch an existing provider

Set EMAIL_PROVIDER to smtp or resend and configure that adapter's credentials.
EMAIL_FROM and all templates remain unchanged. Restart/redeploy the worker; no
database migration is needed. Pending jobs use the selected provider when sent.
A verified sending domain must also be authorized at the replacement service.
SMTP still requires hosting that permits outbound SMTP; on Railway Hobby use
an HTTPS adapter.

## Add another HTTPS provider

1. Add a small adapter implementing Mailer in lib/email, mapping OutgoingEmail
   (including calendar attachments) to that provider's API.
2. Add its selector and credential validation to lib/env.ts and a factory case.
   The exhaustive switch makes unsupported selectors fail explicitly.
3. Test payload mapping and failure propagation, then set Railway variables and
   redeploy. Account, booking and template code require no changes.

The adapter resolves when the provider accepts the message, not when it reaches
the recipient. It rejects delivery failures so the existing queue retries.
Do not log secrets, message bodies, sign-in URLs or provider response bodies.
Do not silently fail over between vendors: acceptance can be ambiguous after a
timeout and automatic failover could send duplicate login emails.
