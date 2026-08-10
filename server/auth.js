import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const sessionLength = 7 * 24 * 60 * 60 * 1000;

export async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = await scrypt(password, salt, 64);
  return "scrypt$" + salt + "$" + hash.toString("hex");
}

export async function verifyPassword(password, storedHash) {
  const [algorithm, salt, encodedHash] = String(storedHash).split("$");
  if (algorithm !== "scrypt" || !salt || !encodedHash) return false;
  const expected = Buffer.from(encodedHash, "hex");
  const actual = await scrypt(password, salt, expected.length);
  return timingSafeEqual(expected, actual);
}

export function createSession() {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + sessionLength) };
}

export function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

export function getSessionToken(request) {
  const cookie = request.headers.cookie || "";
  return cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith("customs_session="))?.slice("customs_session=".length) || "";
}

export function sessionCookie(token, expiresAt) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return "customs_session=" + token + "; HttpOnly; Path=/; SameSite=Lax; Expires=" + expiresAt.toUTCString() + secure;
}

export function clearSessionCookie() {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return "customs_session=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0" + secure;
}
