import { createHmac, timingSafeEqual } from "crypto";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function secret(): string {
  return process.env.NEXTAUTH_SECRET || "fallback_secret_for_development";
}

function b64url(input: string | Buffer): string {
  const buf = typeof input === "string" ? Buffer.from(input, "utf8") : input;
  return buf.toString("base64url");
}

function fromB64url(input: string): string {
  return Buffer.from(input, "base64url").toString("utf8");
}

function sign(payloadB64: string): string {
  return createHmac("sha256", secret()).update(payloadB64).digest("base64url");
}

/**
 * Stateless reset token. Includes a password-hash fingerprint so changing
 * the password invalidates outstanding tokens (one-time use without a DB table).
 */
export function createPasswordResetToken(email: string, passwordHash: string): string {
  const payload = JSON.stringify({
    email: email.toLowerCase().trim(),
    exp: Date.now() + TOKEN_TTL_MS,
    v: passwordHash.slice(0, 16),
  });
  const payloadB64 = b64url(payload);
  return `${payloadB64}.${sign(payloadB64)}`;
}

export function verifyPasswordResetToken(
  token: string,
  passwordHash: string
): { email: string } | null {
  try {
    const [payloadB64, sig] = token.split(".");
    if (!payloadB64 || !sig) return null;

    const expected = sign(payloadB64);
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

    const parsed = JSON.parse(fromB64url(payloadB64)) as {
      email?: string;
      exp?: number;
      v?: string;
    };

    if (!parsed.email || !parsed.exp || !parsed.v) return null;
    if (Date.now() > parsed.exp) return null;
    if (parsed.v !== passwordHash.slice(0, 16)) return null;

    return { email: parsed.email.toLowerCase().trim() };
  } catch {
    return null;
  }
}
