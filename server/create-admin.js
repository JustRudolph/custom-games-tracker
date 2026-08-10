import "dotenv/config";
import { db } from "./db.js";
import { hashPassword } from "./auth.js";

const email = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
const displayName = String(process.env.ADMIN_NAME || "").trim();
const password = String(process.env.ADMIN_PASSWORD || "");
const role = String(process.env.ADMIN_ROLE || "owner");

if (!email || !displayName || password.length < 12 || !["owner", "admin", "viewer"].includes(role)) {
  console.error("Set ADMIN_EMAIL, ADMIN_NAME, ADMIN_PASSWORD (12+ characters), and optionally ADMIN_ROLE.");
  process.exitCode = 1;
} else {
  try {
    const passwordHash = await hashPassword(password);
    await db.execute("INSERT INTO admin_accounts (email, display_name, password_hash, role) VALUES (?, ?, ?, ?)", [email, displayName, passwordHash, role]);
    console.log("Created " + role + " account for " + email + ".");
  } catch (error) {
    console.error(error.code === "ER_DUP_ENTRY" ? "An account with that email already exists." : "Could not create the admin account.");
    process.exitCode = 1;
  } finally {
    await db.end();
  }
}
