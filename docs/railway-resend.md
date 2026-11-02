# Railway Hobby: Resend and CRMCore

Railway Hobby blocks outbound SMTP. Select the Resend HTTPS transport:

```text
EMAIL_PROVIDER=resend
RESEND_API_KEY=<sending-access key for your verified domain>
SMTP_FROM=MightyBase Calendar <noreply@calendar.mightybasecrm.com>
BOOKING_EMAILS_ENABLED=false
SIGNUP_MODE=invite_only
WORKER_MODE=inline
```

SMTP_FROM is the shared sender setting for both providers; no SMTP server,
username or password is needed when EMAIL_PROVIDER=resend. Keep secrets in
Railway Variables, never in Git. Existing deployments default to SMTP and retain
their previous email behavior.

Keep DATABASE_URL, APP_URL, AUTH_SECRET, ENCRYPTION_KEY and the other normal
deployment settings. Use one replica with the inline worker.

With BOOKING_EMAILS_ENABLED=false the email consumer acknowledges and suppresses
booking confirmations, requests, rejections, cancellations, reschedule requests,
and workflow emails, including already queued jobs. Account verification,
password reset, magic-link, team invitation and integration-error messages remain
enabled. Suppression is logged as email.suppressed. Calendar sync, booking
processing and webhook delivery continue normally. This does not build the
CRMCore receiver or its automations: those must be configured separately.

Google event insert/update/delete already use sendUpdates=none. Calendar clients
and a user's own Google notification settings may still generate notifications;
this setting is not a guarantee against every Google-generated message.

After merging and deploying:
1. Confirm the service starts without SMTP_HOST.
2. Create the first admin account and verify its email.
3. Invite a second address to a team; test its email-link sign-in.
4. Connect Google separately for each host.
5. Make, reschedule and cancel a test booking. Confirm calendar changes and
   webhook delivery, and confirm no booking/workflow email is sent by this app.
6. Configure and test CRMCore's corresponding customer communications.

No database migration is introduced by this change.
