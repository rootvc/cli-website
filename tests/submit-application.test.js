import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { handler, FIELDS, MAX_BODY_BYTES } = require("../netlify/functions/submit-application.js");

const post = (body) => handler({ httpMethod: "POST", body: typeof body === "string" ? body : JSON.stringify(body) });

describe("submit-application", () => {
  beforeEach(() => {
    process.env.ATTIO_WEBHOOK_URL = "https://attio.example/webhook";
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true })));
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.ATTIO_WEBHOOK_URL;
  });

  const forwarded = () => JSON.parse(fetch.mock.calls[0][1].body);

  it("forwards only the known fields, trimmed and capped", async () => {
    const response = await post({
      name: "  Ada  ",
      email: "ada@example.com",
      notes: "x".repeat(FIELDS.notes + 50),
      position: "Platform Engineer",
      role: "admin",
      __proto__: { polluted: true },
      extra: { nested: "payload" },
    });
    expect(response.statusCode).toBe(200);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0][0]).toBe("https://attio.example/webhook");
    const body = forwarded();
    expect(body).toEqual({
      name: "Ada",
      email: "ada@example.com",
      notes: "x".repeat(FIELDS.notes),
      position: "Platform Engineer",
    });
    expect(body).not.toHaveProperty("role");
    expect(body).not.toHaveProperty("extra");
  });

  it("drops honeypot submissions without forwarding, but answers success", async () => {
    const response = await post({ name: "Bot", email: "bot@example.com", website: "http://spam" });
    expect(response.statusCode).toBe(200);
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([
    ["missing name", { email: "a@b.c" }, 400],
    ["non-string field", { name: ["Ada"], email: "a@b.c" }, 400],
    ["malformed JSON", "{not json", 400],
    ["array body", [1, 2], 400],
    ["oversized body", { name: "Ada", email: "a@b.c", notes: "x".repeat(MAX_BODY_BYTES) }, 413],
  ])("rejects %s without forwarding", async (_, body, status) => {
    const response = await post(body);
    expect(response.statusCode).toBe(status);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rejects non-POST and reports upstream failure", async () => {
    expect((await handler({ httpMethod: "GET" })).statusCode).toBe(405);
    fetch.mockResolvedValueOnce({ ok: false, status: 502 });
    const response = await post({ name: "Ada", email: "a@b.c" });
    expect(response.statusCode).toBe(500);
  });
});
