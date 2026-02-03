import crypto from "crypto";
import { shouldDeploy, verifySignature } from "@/lib/webhook";

describe("webhook helpers", () => {
  it("verifies valid signatures", () => {
    const secret = "test-secret";
    const payload = JSON.stringify({ ok: true });
    const hash = crypto.createHmac("sha256", secret).update(payload).digest("hex");
    expect(verifySignature(payload, `sha256=${hash}`, secret)).toBe(true);
  });

  it("rejects missing or invalid signatures", () => {
    const secret = "test-secret";
    const payload = "hello";
    expect(verifySignature(payload, null, secret)).toBe(false);
    expect(verifySignature(payload, "sha1=abcd", secret)).toBe(false);
    expect(verifySignature(payload, "sha256=wrong", secret)).toBe(false);
  });

  it("determines if a payload should deploy", () => {
    expect(shouldDeploy({ ref: "refs/heads/main", deleted: false })).toBe(true);
    expect(shouldDeploy({ ref: "refs/heads/dev", deleted: false })).toBe(false);
    expect(shouldDeploy({ ref: "refs/heads/main", deleted: true })).toBe(false);
  });
});
