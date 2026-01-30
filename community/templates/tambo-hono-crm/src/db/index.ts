import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "./schema";

const poolConnection = mysql.createPool({
  host: process.env.DATABASE_HOST || "localhost",
  user: process.env.DATABASE_USER || "root",
  password: process.env.DATABASE_PASSWORD || "",
  database: process.env.DATABASE_NAME || "tambo_crm",
  port: parseInt(process.env.DATABASE_PORT || "3306"),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export const db = drizzle(poolConnection, { schema, mode: "default" });

// Initialize database with schema
export async function initDb() {
  const conn = await poolConnection.getConnection();
  try {
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS contacts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        company VARCHAR(255),
        notes TEXT
      )
    `);
  } finally {
    conn.release();
  }
}

// Auto-initialize on import
initDb().catch(console.error);

export { contacts } from "./schema";
export type { Contact, NewContact } from "./schema";
