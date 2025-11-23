import { DbStorage } from "./DbStorage";
import { Pool } from "pg";

const pool = new Pool({
  user: "postgres",           // your DB user
  host: "localhost",
  database: "habit_tracker",  // your DB name
  password: "Vidyarth2002",   // your DB password
  port: 5001,                 // PostgreSQL port
});

async function testDbConnection() {
  try {
    const client = await pool.connect();
    const res = await client.query("SELECT NOW()"); // simple test query
    console.log(`✅ Connected to database "${pool.options.database}" at ${res.rows[0].now}`);
    client.release();
  } catch (err) {
    console.error("❌ Failed to connect to the database:", err);
    process.exit(1); // stop the app if DB connection fails
  }
}

testDbConnection();

export const storage = new DbStorage(pool);
