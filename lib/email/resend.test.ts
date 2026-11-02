import { describe, expect, it, vi } from "vitest";
import { createResendMailer } from "./resend";

const email = { from: "Calendar <noreply@calendar.example.com>", to: "user@example.com", subject: "Test", html: "<p>Hello</p>", text: "Hello" };

describe("createResendMailer", () => {
  it("sends through HTTPS with bearer auth and an array of recipients", async () => {
    const request = vi.fn().mockResolvedValue(new Response('{"id":"email-1"}'));
    await createResendMailer("test-key", request).send(email);
    const [url, options] = request.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(options.headers.Authorization).toBe("Bearer test-key");
    expect(JSON.parse(options.body)).toEqual({ ...email, to: [email.to] });
    expect(options.signal).toBeInstanceOf(AbortSignal);
  });

  it("encodes calendar attachments without leaking the internal calendar field", async () => {
    const request = vi.fn().mockResolvedValue(new Response("{}"));
    await createResendMailer("test-key", request).send({ ...email, calendar: { method: "REQUEST", content: "BEGIN:VCALENDAR" } });
    const body = JSON.parse(request.mock.calls[0][1].body);
    expect(body.calendar).toBeUndefined();
    expect(body.attachments).toEqual([{ filename: "invite.ics", content: Buffer.from("BEGIN:VCALENDAR").toString("base64"), content_type: "text/calendar; method=REQUEST; charset=utf-8" }]);
  });

  it("throws on provider errors without exposing response contents", async () => {
    const request = vi.fn().mockResolvedValue(new Response("private-token", { status: 429 }));
    await expect(createResendMailer("test-key", request).send(email)).rejects.toThrow("Resend email failed (HTTP 429)");
  });

  it("propagates network errors for queue retries", async () => {
    const request = vi.fn().mockRejectedValue(new Error("Network unavailable"));
    await expect(createResendMailer("test-key", request).send(email)).rejects.toThrow("Network unavailable");
  });
});
