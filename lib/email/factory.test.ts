import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  smtp: vi.fn(() => ({ send: vi.fn() })),
  resend: vi.fn(() => ({ send: vi.fn() })),
}));
vi.mock("./smtp", () => ({ createSmtpMailer: mocks.smtp }));
vi.mock("./resend", () => ({ createResendMailer: mocks.resend }));
import { createMailer } from "./factory";

const config = { EMAIL_PROVIDER: "smtp" as const, SMTP_HOST: "smtp.example.com", SMTP_PORT: 587, SMTP_SECURE: false, SMTP_USER: undefined, SMTP_PASSWORD: undefined, RESEND_API_KEY: undefined };
beforeEach(() => vi.clearAllMocks());

describe("createMailer", () => {
  it("selects SMTP without initializing Resend", async () => {
    const mailer = await createMailer(config);
    expect(mailer.send).toBeTypeOf("function");
    expect(mocks.smtp).toHaveBeenCalledWith(config);
    expect(mocks.resend).not.toHaveBeenCalled();
  });
  it("selects Resend without initializing SMTP", async () => {
    const mailer = await createMailer({ ...config, EMAIL_PROVIDER: "resend", RESEND_API_KEY: "test-key", SMTP_HOST: "" });
    expect(mailer.send).toBeTypeOf("function");
    expect(mocks.resend).toHaveBeenCalledWith("test-key");
    expect(mocks.smtp).not.toHaveBeenCalled();
  });
  it("rejects missing adapter credentials", async () => {
    await expect(createMailer({ ...config, EMAIL_PROVIDER: "resend" })).rejects.toThrow(/RESEND_API_KEY/);
    await expect(createMailer({ ...config, SMTP_HOST: "" })).rejects.toThrow(/SMTP_HOST/);
  });
});
