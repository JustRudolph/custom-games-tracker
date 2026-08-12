import mysql from "mysql2/promise";
import "dotenv/config";

const useTls = process.env.DB_SSL === "true";
const ssl = useTls ? {
  rejectUnauthorized: true,
  ...(process.env.DB_SSL_CA ? { ca: process.env.DB_SSL_CA.replace(/\\n/g, "\n") } : {}),
} : undefined;

export const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl,
  waitForConnections: true,
  connectionLimit: 10,
});
