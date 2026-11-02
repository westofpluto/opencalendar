/** Compatibility exports for existing callers; new code should use types and factory. */
export type { CalendarPart, OutgoingEmail, Mailer } from "./types";
export { createSmtpMailer } from "./smtp";
