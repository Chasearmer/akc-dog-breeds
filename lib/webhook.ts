import crypto from "crypto";

type WebhookPayload = {
  ref?: string;
  deleted?: boolean;
};

export function verifySignature(payload: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  const [algorithm, hash] = signature.split("=");
  if (algorithm !== "sha256" || !hash) return false;
  const expectedHash = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return hash === expectedHash;
}

export function shouldDeploy(payload: WebhookPayload): boolean {
  return payload.ref === "refs/heads/main" && !payload.deleted;
}
