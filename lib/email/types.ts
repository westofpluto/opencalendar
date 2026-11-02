export type CalendarPart = { method: "REQUEST" | "CANCEL" | "PUBLISH"; content: string };

export type OutgoingEmail = {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  /** iCalendar invitation, sent as a text/calendar part so clients show accept/update UI. */
  calendar?: CalendarPart;
};

/** Provider-neutral delivery contract. Templates and jobs depend only on this interface.
 * Resolve after provider acceptance; reject on failure so the queue can retry.
 */
export type Mailer = { send(email: OutgoingEmail): Promise<void> };

