import "dotenv/config";
import { db } from "./db.js";
import { hashPassword } from "./auth.js";

const username = String(process.env.ADMIN_USERNAME || "").trim().toLowerCase();
const displayName = String(process.env.ADMIN_NAME || "").trim();
const password = String(process.env.ADMIN_PASSWORD || "");
const role = String(process.env.ADMIN_ROLE || "owner");

if (!/^[a-z0-9_.-]{3,32}$/.test(username) || !displayName || password.length < 12 || !["owner", "admin", "viewer"].includes(role)) {
  console.error("Set ADMIN_USERNAME (3-32 letters, numbers, dots, underscores, or hyphens), ADMIN_NAME, ADMIN_PASSWORD (12+ characters), and optionally ADMIN_ROLE.");
  process.exitCode = 1;
} else {
  try {
    const passwordHash = await hashPassword(password);
    await db.execute("INSERT INTO admin_accounts (username, display_name, password_hash, role) VALUES (?, ?, ?, ?)", [username, displayName, passwordHash, role]);
    console.log("Created " + role + " account for " + username + ".");
  } catch (error) {
    console.error(error.code === "ER_DUP_ENTRY" ? "An account with that username already exists." : "Could not create the admin account.");
    process.exitCode = 1;
  } finally {
    await db.end();
  }
}
