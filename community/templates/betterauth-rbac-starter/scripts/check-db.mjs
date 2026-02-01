import Database from "better-sqlite3";

const db = new Database("./sqlite.db");

console.log("🔍 Inspecting SQLite Database...");

try {
  const users = db.prepare("SELECT * FROM user").all();
  console.log(`\nFound ${users.length} users:`);
  console.table(users);
} catch (error) {
  console.error("Error reading database:", error.message);
}

db.close();
